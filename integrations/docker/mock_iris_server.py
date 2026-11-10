#!/usr/bin/env python3
"""
BLUSOC Lightweight Mock DFIR-IRIS API Server

Simulates DFIR-IRIS HTTP endpoints for local testing and container orchestration:
- POST /alerts/add: Receives transformed alerts, returns 200 OK with alert ID
- GET /alerts/filter: Returns alert records with current statuses
- GET /health: Health check endpoint
"""

import json
import logging
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict, List

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [mock-iris] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("mock-iris")

STORED_ALERTS: List[Dict[str, Any]] = [
    {
        "alert_id": 101,
        "alert_title": "[Wazuh L10] ET DROP Dshield Block Listed Source",
        "alert_status_id": 1,
        "alert_severity_id": 5,
        "alert_owner_id": None,
    },
    {
        "alert_id": 102,
        "alert_title": "[Wazuh L12] Cobalt Strike Beaconing Detected",
        "alert_status_id": 3,
        "alert_severity_id": 6,
        "alert_owner_id": 42,
    },
]
ALERT_COUNTER = 1000


class MockIrisHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        logger.info("%s - - [%s] %s", self.address_string(), self.log_date_time_string(), format % args)

    def _send_json(self, status_code: int, data: Any) -> None:
        response_bytes = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def do_GET(self) -> None:
        path = self.path.split("?")[0]
        if path in ("/alerts/filter", "/alerts", "/api/v1/alerts"):
            self._send_json(200, {"status": "success", "data": STORED_ALERTS})
        elif path in ("/health", "/"):
            self._send_json(200, {"status": "healthy", "service": "blusoc-iris-mock"})
        else:
            self._send_json(404, {"status": "error", "message": "Endpoint not found"})

    def do_POST(self) -> None:
        global ALERT_COUNTER
        path = self.path.split("?")[0]

        content_length = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""

        try:
            payload = json.loads(post_body) if post_body else {}
        except json.JSONDecodeError:
            self._send_json(400, {"status": "error", "message": "Invalid JSON body"})
            return

        if path in ("/alerts/add", "/alerts"):
            ALERT_COUNTER += 1
            new_id = ALERT_COUNTER
            stored_entry = {
                "alert_id": new_id,
                "alert_title": payload.get("alert_title", "Untitled Alert"),
                "alert_status_id": payload.get("alert_status_id", 1),
                "alert_severity_id": payload.get("alert_severity_id", 3),
                "alert_owner_id": None,
                "context": payload.get("alert_context", {}),
            }
            STORED_ALERTS.append(stored_entry)
            logger.info("Created alert ID #%d: '%s'", new_id, stored_entry["alert_title"])
            self._send_json(200, {
                "status": "success",
                "data": {
                    "alert_id": new_id,
                    "message": "Alert added successfully",
                },
            })
        elif path.startswith("/alerts/update/"):
            try:
                alert_id = int(path.split("/")[-1])
            except ValueError:
                self._send_json(400, {"status": "error", "message": "Invalid alert ID"})
                return

            for alert in STORED_ALERTS:
                if alert.get("alert_id") == alert_id:
                    if "alert_status_id" in payload:
                        alert["alert_status_id"] = payload["alert_status_id"]
                    if "alert_owner_id" in payload:
                        alert["alert_owner_id"] = payload["alert_owner_id"]
                    self._send_json(200, {"status": "success", "data": alert})
                    return

            self._send_json(404, {"status": "error", "message": "Alert not found"})
        else:
            self._send_json(404, {"status": "error", "message": "Endpoint not found"})


def run_server(port: int = 8000) -> None:
    server_address = ("0.0.0.0", port)
    httpd = HTTPServer(server_address, MockIrisHandler)
    logger.info("BLUSOC Mock DFIR-IRIS server listening on http://0.0.0.0:%d", port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down mock server.")
        httpd.server_close()


if __name__ == "__main__":
    port_arg = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", "8000"))
    run_server(port=port_arg)
