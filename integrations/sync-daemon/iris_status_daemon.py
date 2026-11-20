#!/usr/bin/env python3
"""Observe IRIS alert status changes with paginated polling and durable local state."""
from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path
import signal
import sqlite3
import sys
from threading import Event
from typing import Any, Dict, List, Optional

import requests

STATUS_ID_TO_NAME = {
    1: "UNSPECIFIED", 2: "NEW", 3: "ASSIGNED", 4: "IN_PROGRESS",
    5: "PENDING", 6: "CLOSED", 7: "MERGED", 8: "ESCALATED",
}
DEFAULT_ENDPOINT = "https://localhost:8443/alerts/filter"
DEFAULT_INTERVAL_SECONDS = 10
INITIAL_BACKOFF_SECONDS = 2
MAX_BACKOFF_SECONDS = 60


def _env_flag(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    return default if value is None else value.lower() in {"1", "true", "yes", "on"}


def setup_logger(audit_file: Optional[str] = None) -> logging.Logger:
    result = logging.getLogger("iris_status_daemon")
    result.setLevel(logging.INFO)
    result.propagate = False
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] [iris-status] %(message)s")
    if not result.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(formatter)
        result.addHandler(handler)
    if audit_file:
        path = Path(audit_file).resolve()
        path.parent.mkdir(parents=True, exist_ok=True)
        if not any(isinstance(handler, logging.FileHandler) and handler.baseFilename == str(path)
                   for handler in result.handlers):
            handler = logging.FileHandler(path, encoding="utf-8")
            handler.setFormatter(formatter)
            result.addHandler(handler)
    return result


logger = setup_logger()


class IrisStatusDaemon:
    def __init__(self, endpoint_url: str = DEFAULT_ENDPOINT, api_key: Optional[str] = None,
                 poll_interval: int = DEFAULT_INTERVAL_SECONDS, verify_ssl: Optional[bool] = None,
                 audit_file: Optional[str] = None, state_db: Optional[str] = None) -> None:
        if poll_interval < 1:
            raise ValueError("The poll interval must be positive")
        self.endpoint_url = endpoint_url
        self.api_key = api_key if api_key is not None else os.environ.get("IRIS_API_KEY", "")
        self.poll_interval = poll_interval
        self.verify_ssl = _env_flag("IRIS_VERIFY_SSL", True) if verify_ssl is None else verify_ssl
        self.running = False
        self.retry_count = 0
        self.state_cache: Dict[str, Dict[str, Any]] = {}
        self.db_conn: Optional[sqlite3.Connection] = None
        self.stop_event = Event()
        setup_logger(audit_file)
        if state_db:
            path = Path(state_db)
            path.parent.mkdir(parents=True, exist_ok=True)
            self.db_conn = sqlite3.connect(path)
            os.chmod(path, 0o600)
            self.db_conn.execute("CREATE TABLE IF NOT EXISTS alert_state (alert_id TEXT PRIMARY KEY, payload TEXT NOT NULL)")
            for alert_id, payload in self.db_conn.execute("SELECT alert_id, payload FROM alert_state"):
                self.state_cache[alert_id] = json.loads(payload)
        self._setup_signals()

    def _setup_signals(self) -> None:
        signal.signal(signal.SIGINT, self._handle_signal)
        if hasattr(signal, "SIGTERM"):
            signal.signal(signal.SIGTERM, self._handle_signal)

    def _handle_signal(self, signum: int, frame: Any) -> None:
        self.running = False
        self.stop_event.set()
        logger.info("Shutdown requested")

    def close_db(self) -> None:
        if self.db_conn:
            self.db_conn.close()
            self.db_conn = None

    def fetch_alerts(self) -> List[Dict[str, Any]]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Accept": "application/json"}
        alerts: List[Dict[str, Any]] = []
        page = 1
        for _ in range(1000):
            response = requests.get(self.endpoint_url, headers=headers,
                                    params={"page": page, "per_page": 100},
                                    timeout=(5, 15), verify=self.verify_ssl)
            response.raise_for_status()
            payload = response.json()
            if isinstance(payload, dict) and payload.get("status") not in (None, "success", "Success"):
                raise ValueError("IRIS returned an API error")
            data = payload.get("data", payload) if isinstance(payload, dict) else payload
            if isinstance(data, list):
                alerts.extend(data)
                return alerts
            if not isinstance(data, dict) or not isinstance(data.get("alerts"), list):
                raise ValueError("Unexpected IRIS alerts response")
            alerts.extend(data["alerts"])
            next_page = data.get("next_page")
            if next_page is None:
                return alerts
            if not isinstance(next_page, int) or next_page <= page:
                raise ValueError("Invalid IRIS pagination")
            page = next_page
        raise ValueError("IRIS exceeded the 1000-page polling limit; narrow the endpoint query")

    def record_transition(self, alert_id: str, old_status: str, new_status: str,
                          owner_id: Optional[int], title: str) -> None:
        logger.info("[AUDIT] Alert %s: %s -> %s; owner=%s", alert_id, old_status, new_status, owner_id)

    def process_alert_records(self, alerts: List[Dict[str, Any]]) -> int:
        transitions = 0
        for alert in alerts:
            if not isinstance(alert, dict):
                raise ValueError("IRIS returned a non-object alert")
            alert_id = str(alert.get("alert_id") or alert.get("id") or "")
            if not alert_id:
                continue
            status_id = int(alert.get("alert_status_id") or alert.get("status_id") or 1)
            status_object = alert.get("status")
            status_name = (status_object.get("status_name") if isinstance(status_object, dict) else None)
            status_name = status_name.upper().replace(" ", "_") if status_name else STATUS_ID_TO_NAME.get(status_id, f"STATUS_{status_id}")
            owner_id = alert.get("alert_owner_id", alert.get("owner_id"))
            current = {"status_id": status_id, "status_name": status_name, "owner_id": owner_id}
            previous = self.state_cache.get(alert_id)
            if previous and previous["status_id"] != status_id:
                self.record_transition(alert_id, previous["status_name"], status_name, owner_id, alert.get("alert_title", ""))
                transitions += 1
            elif previous and previous.get("owner_id") != owner_id:
                logger.info("[AUDIT] Alert %s: owner %s -> %s", alert_id, previous.get("owner_id"), owner_id)
            self.state_cache[alert_id] = current
        if self.db_conn:
            with self.db_conn:
                self.db_conn.executemany(
                    "INSERT INTO alert_state(alert_id, payload) VALUES (?, ?) "
                    "ON CONFLICT(alert_id) DO UPDATE SET payload=excluded.payload",
                    [(alert_id, json.dumps(state)) for alert_id, state in self.state_cache.items()],
                )
        return transitions

    def calculate_backoff(self) -> float:
        return float(min(MAX_BACKOFF_SECONDS, INITIAL_BACKOFF_SECONDS * 2 ** min(self.retry_count, 5)))

    def run_once(self) -> int:
        try:
            transitions = self.process_alert_records(self.fetch_alerts())
            self.retry_count = 0
            return transitions
        except Exception as error:
            logger.error("Polling failed (%s). No credentials or response bodies are logged.", type(error).__name__)
            raise

    def run(self) -> None:
        self.running = True
        logger.info("Monitoring IRIS every %s seconds", self.poll_interval)
        try:
            while self.running:
                try:
                    self.run_once()
                    self.stop_event.wait(self.poll_interval)
                except Exception:
                    delay = self.calculate_backoff()
                    self.retry_count += 1
                    logger.warning("Retrying in %.0f seconds", delay)
                    self.stop_event.wait(delay)
        finally:
            self.close_db()
            logger.info("Status monitor stopped")


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--endpoint", default=os.environ.get("IRIS_ENDPOINT", DEFAULT_ENDPOINT))
    parser.add_argument("--api-key", default=os.environ.get("IRIS_API_KEY"), help="Prefer IRIS_API_KEY in the environment")
    parser.add_argument("--interval", type=int, default=os.environ.get("IRIS_POLL_INTERVAL", DEFAULT_INTERVAL_SECONDS))
    parser.add_argument("--audit-file", default=os.environ.get("IRIS_AUDIT_LOG"))
    parser.add_argument("--state-db", default=os.environ.get("IRIS_STATE_DB"))
    parser.add_argument("--insecure", action="store_true", help="Explicit local test mode only")
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    if not args.api_key or args.api_key.startswith("__"):
        parser.error("Set a real IRIS_API_KEY")
    if args.interval < 1:
        parser.error("--interval must be positive")
    return args


def main() -> int:
    args = parse_arguments()
    daemon = IrisStatusDaemon(endpoint_url=args.endpoint, api_key=args.api_key, poll_interval=args.interval,
                              verify_ssl=False if args.insecure else None,
                              audit_file=args.audit_file, state_db=args.state_db)
    if args.once:
        try:
            daemon.run_once()
            return 0
        except Exception:
            return 1
        finally:
            daemon.close_db()
    daemon.run()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
