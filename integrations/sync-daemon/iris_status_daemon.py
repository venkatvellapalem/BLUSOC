#!/usr/bin/env python3
"""
BLUSOC Real-Time DFIR-IRIS Status Synchronization Daemon

Periodically polls the DFIR-IRIS API to observe ticket state transitions
(OPEN, ASSIGNED, IN_PROGRESS, CLOSED), emits audit telemetry,
and synchronizes alert state with downstream databases.
"""

import argparse
import logging
import os
import signal
import sys
import time
from typing import Any, Dict, List, Optional, Tuple

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

STATUS_ID_TO_NAME: Dict[int, str] = {
    1: "OPEN",
    2: "OPEN",
    3: "ASSIGNED",
    4: "IN_PROGRESS",
    5: "PENDING",
    6: "CLOSED",
    7: "MERGED",
    8: "ESCALATED",
}

DEFAULT_ENDPOINT = "https://soar-iris-01.blusoc.internal/alerts/filter"
DEFAULT_INTERVAL_SECONDS = 10
INITIAL_BACKOFF_SECONDS = 2
MAX_BACKOFF_SECONDS = 60


def setup_logger(audit_file: Optional[str] = None) -> logging.Logger:
    daemon_logger = logging.getLogger("iris_status_daemon")
    daemon_logger.setLevel(logging.INFO)
    if not daemon_logger.handlers:
        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] [iris-sync] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(formatter)
        daemon_logger.addHandler(stream_handler)

        if audit_file:
            try:
                os.makedirs(os.path.dirname(os.path.abspath(audit_file)), exist_ok=True)
                file_handler = logging.FileHandler(audit_file, encoding="utf-8")
                file_handler.setFormatter(formatter)
                daemon_logger.addHandler(file_handler)
            except OSError as err:
                daemon_logger.warning("Could not attach file logger: %s", err)
    return daemon_logger


logger = setup_logger()


class IrisStatusDaemon:
    def __init__(
        self,
        endpoint_url: str = DEFAULT_ENDPOINT,
        api_key: str = "BLUSOC_IRIS_SYNC_KEY",
        poll_interval: int = DEFAULT_INTERVAL_SECONDS,
        verify_ssl: bool = False,
        audit_file: Optional[str] = None,
        db_connection_string: Optional[str] = None,
    ) -> None:
        self.endpoint_url = endpoint_url
        self.api_key = api_key
        self.poll_interval = poll_interval
        self.verify_ssl = verify_ssl
        self.audit_file = audit_file
        self.db_connection_string = db_connection_string

        self.running: bool = False
        self.retry_count: int = 0
        self.state_cache: Dict[str, Dict[str, Any]] = {}
        self.db_conn: Optional[Any] = None

        self._setup_signals()

    def _setup_signals(self) -> None:
        signal.signal(signal.SIGINT, self._handle_signal)
        if hasattr(signal, "SIGTERM"):
            signal.signal(signal.SIGTERM, self._handle_signal)

    def _handle_signal(self, signum: int, frame: Any) -> None:
        sig_name = signal.Signals(signum).name if hasattr(signal, "Signals") else str(signum)
        logger.info("Signal received (%s). Initiating graceful shutdown.", sig_name)
        self.running = False

    def connect_db(self) -> None:
        if not self.db_connection_string:
            return
        try:
            import psycopg2
            self.db_conn = psycopg2.connect(self.db_connection_string)
            self.db_conn.autocommit = True
            logger.info("Connected to PostgreSQL database for ticket synchronization.")
        except Exception as exc:
            logger.warning("Database connection unavailable (%s). Running with memory cache.", exc)
            self.db_conn = None

    def close_db(self) -> None:
        if self.db_conn:
            try:
                self.db_conn.close()
            except Exception:
                pass
            self.db_conn = None

    def fetch_alerts(self) -> List[Dict[str, Any]]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-IRIS-AUTH": self.api_key,
            "Accept": "application/json",
            "User-Agent": "BLUSOC-Iris-Status-Daemon/1.0",
        }
        response = requests.get(
            self.endpoint_url,
            headers=headers,
            timeout=10,
            verify=self.verify_ssl,
        )
        response.raise_for_status()
        raw_json = response.json()

        if isinstance(raw_json, dict):
            if "data" in raw_json and isinstance(raw_json["data"], list):
                return raw_json["data"]
            if "alerts" in raw_json and isinstance(raw_json["alerts"], list):
                return raw_json["alerts"]
            return [raw_json]
        elif isinstance(raw_json, list):
            return raw_json
        return []

    def record_transition(
        self,
        alert_id: str,
        old_status: str,
        new_status: str,
        owner_id: Optional[int],
        title: str,
    ) -> None:
        msg = (
            f"[AUDIT] Alert #{alert_id} status transitioned: {old_status} -> {new_status} "
            f"(Owner ID: {owner_id or 'Unassigned'}, Title: '{title}')"
        )
        logger.info(msg)

        if self.db_conn:
            try:
                with self.db_conn.cursor() as cur:
                    cur.execute(
                        """
                        UPDATE alerts
                        SET status = %s, updated_at = NOW()
                        WHERE external_ref = %s OR id = %s
                        """,
                        (new_status, str(alert_id), str(alert_id) if str(alert_id).isdigit() else None),
                    )
            except Exception as exc:
                logger.error("Failed to persist status change to PostgreSQL: %s", exc)

    def process_alert_records(self, alerts: List[Dict[str, Any]]) -> int:
        transitions_detected = 0
        for alert in alerts:
            alert_id = str(alert.get("alert_id") or alert.get("id") or "")
            if not alert_id:
                continue

            status_id = alert.get("alert_status_id") or alert.get("status_id") or 1
            try:
                status_id_int = int(status_id)
            except (ValueError, TypeError):
                status_id_int = 1

            status_name = STATUS_ID_TO_NAME.get(status_id_int, "OPEN")
            owner_id = alert.get("alert_owner_id") or alert.get("owner_id")
            title = alert.get("alert_title") or alert.get("title") or "Untitled Alert"

            previous_entry = self.state_cache.get(alert_id)
            if previous_entry is None:
                self.state_cache[alert_id] = {
                    "status_id": status_id_int,
                    "status_name": status_name,
                    "owner_id": owner_id,
                }
            elif previous_entry["status_name"] != status_name:
                old_status = previous_entry["status_name"]
                self.record_transition(alert_id, old_status, status_name, owner_id, title)
                self.state_cache[alert_id] = {
                    "status_id": status_id_int,
                    "status_name": status_name,
                    "owner_id": owner_id,
                }
                transitions_detected += 1
            elif previous_entry.get("owner_id") != owner_id:
                logger.info(
                    "[AUDIT] Alert #%s reassigned from owner %s to %s",
                    alert_id,
                    previous_entry.get("owner_id"),
                    owner_id,
                )
                self.state_cache[alert_id]["owner_id"] = owner_id

        return transitions_detected

    def calculate_backoff(self) -> float:
        backoff = min(MAX_BACKOFF_SECONDS, INITIAL_BACKOFF_SECONDS * (2 ** self.retry_count))
        return float(backoff)

    def run_once(self) -> int:
        try:
            alerts = self.fetch_alerts()
            transitions = self.process_alert_records(alerts)
            self.retry_count = 0
            return transitions
        except Exception as exc:
            self.retry_count += 1
            logger.error(
                "Polling error on %s: %s (Retry count: %d)",
                self.endpoint_url,
                exc,
                self.retry_count,
            )
            raise

    def run(self) -> None:
        self.running = True
        self.connect_db()
        logger.info(
            "DFIR-IRIS Status Sync Daemon started. Polling %s every %ds.",
            self.endpoint_url,
            self.poll_interval,
        )

        while self.running:
            try:
                transitions = self.run_once()
                if transitions > 0:
                    logger.info("Cycle completed: %d status transitions processed.", transitions)
                time.sleep(self.poll_interval)
            except Exception:
                if not self.running:
                    break
                backoff_time = self.calculate_backoff()
                logger.warning("Exponential backoff engaged. Waiting %.1fs before retry.", backoff_time)
                time.sleep(backoff_time)

        self.close_db()
        logger.info("DFIR-IRIS Status Sync Daemon stopped cleanly.")


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="BLUSOC DFIR-IRIS State Sync Daemon")
    parser.add_argument(
        "--endpoint",
        default=os.environ.get("IRIS_ENDPOINT", DEFAULT_ENDPOINT),
        help="DFIR-IRIS alerts query endpoint",
    )
    parser.add_argument(
        "--api-key",
        default=os.environ.get("IRIS_API_KEY", "BLUSOC_IRIS_SYNC_KEY"),
        help="API authentication key",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=int(os.environ.get("IRIS_POLL_INTERVAL", str(DEFAULT_INTERVAL_SECONDS))),
        help="Poll interval in seconds",
    )
    parser.add_argument(
        "--db-url",
        default=os.environ.get("DATABASE_URL"),
        help="Target PostgreSQL connection string",
    )
    parser.add_argument(
        "--audit-file",
        default=os.environ.get("IRIS_AUDIT_LOG"),
        help="Target audit file path",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Execute a single synchronization cycle and exit",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_arguments()
    daemon = IrisStatusDaemon(
        endpoint_url=args.endpoint,
        api_key=args.api_key,
        poll_interval=args.interval,
        db_connection_string=args.db_url,
        audit_file=args.audit_file,
    )

    if args.once:
        try:
            daemon.run_once()
            return 0
        except Exception:
            return 1

    daemon.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
