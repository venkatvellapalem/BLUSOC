#!/usr/bin/env python3
"""
BLUSOC Integrations Middleware Test Suite

Verifies:
1. Log truncation buffer fix (prevents 400-char truncation, intact up to 4000 chars)
2. Severity mapping across all Wazuh levels (L0 to L16)
3. IP enrichment, public vs private subnet detection, GeoIP metadata
4. DFIR-IRIS /alerts/add payload structure and field integrity
5. CLI execution via --test flag
6. Real-time status sync daemon transitions, backoff, and signals
7. Mock DFIR-IRIS server HTTP communication
8. Zero occurrences of em dashes across all integration files
"""

import importlib.util
import json
import os
import signal
import subprocess
import sys
import tempfile
import threading
import unittest
from http.server import HTTPServer
from pathlib import Path
from typing import Any, Dict

TESTS_DIR = Path(__file__).resolve().parent
INTEGRATIONS_DIR = TESTS_DIR.parent
CUSTOM_IRIS_PATH = INTEGRATIONS_DIR / "custom-iris" / "custom-iris.py"
SYNC_DAEMON_PATH = INTEGRATIONS_DIR / "sync-daemon" / "iris_status_daemon.py"
MOCK_SERVER_PATH = INTEGRATIONS_DIR / "docker" / "mock_iris_server.py"

spec_iris = importlib.util.spec_from_file_location("custom_iris", str(CUSTOM_IRIS_PATH))
custom_iris = importlib.util.module_from_spec(spec_iris)
sys.modules["custom_iris"] = custom_iris
spec_iris.loader.exec_module(custom_iris)

spec_daemon = importlib.util.spec_from_file_location("iris_status_daemon", str(SYNC_DAEMON_PATH))
iris_status_daemon = importlib.util.module_from_spec(spec_daemon)
sys.modules["iris_status_daemon"] = iris_status_daemon
spec_daemon.loader.exec_module(iris_status_daemon)

spec_mock = importlib.util.spec_from_file_location("mock_iris_server", str(MOCK_SERVER_PATH))
mock_iris_server = importlib.util.module_from_spec(spec_mock)
sys.modules["mock_iris_server"] = mock_iris_server
spec_mock.loader.exec_module(mock_iris_server)


class TestSeverityMapping(unittest.TestCase):
    def test_critical_severity_level_12_and_above(self) -> None:
        for level in [12, 13, 14, 15, 16]:
            with self.subTest(level=level):
                self.assertEqual(custom_iris.map_severity(level), 6)

    def test_high_severity_levels_9_to_11(self) -> None:
        for level in [9, 10, 11]:
            with self.subTest(level=level):
                self.assertEqual(custom_iris.map_severity(level), 5)

    def test_medium_severity_levels_6_to_8(self) -> None:
        for level in [6, 7, 8]:
            with self.subTest(level=level):
                self.assertEqual(custom_iris.map_severity(level), 1)

    def test_low_severity_levels_3_to_5(self) -> None:
        for level in [3, 4, 5]:
            with self.subTest(level=level):
                self.assertEqual(custom_iris.map_severity(level), 4)

    def test_informational_severity_below_level_3(self) -> None:
        for level in [0, 1, 2, -1]:
            with self.subTest(level=level):
                self.assertEqual(custom_iris.map_severity(level), 3)


class TestLogTruncationBufferFix(unittest.TestCase):
    def test_normal_payload_not_truncated(self) -> None:
        normal_text = "Standard Suricata alert event with short payload"
        result = custom_iris.truncate_log(normal_text, max_chars=4000)
        self.assertEqual(result, normal_text)
        self.assertNotIn("...", result)

    def test_medium_payload_exceeding_old_400_char_cap_preserved(self) -> None:
        long_powershell = "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command " + ("X" * 1200)
        result = custom_iris.truncate_log(long_powershell, max_chars=4000)
        self.assertEqual(len(result), len(long_powershell))
        self.assertEqual(result, long_powershell)
        self.assertNotIn("...", result)

    def test_payload_at_exact_4000_char_limit(self) -> None:
        exact_text = "A" * 4000
        result = custom_iris.truncate_log(exact_text, max_chars=4000)
        self.assertEqual(len(result), 4000)
        self.assertEqual(result, exact_text)
        self.assertNotIn("...", result)

    def test_oversized_payload_truncated_at_4000_chars(self) -> None:
        huge_text = "B" * 5000
        result = custom_iris.truncate_log(huge_text, max_chars=4000)
        self.assertEqual(len(result), 4000)
        self.assertTrue(result.endswith("..."))
        self.assertEqual(result[:3997], "B" * 3997)


class TestEnrichmentAndPublicPrivateDetection(unittest.TestCase):
    def test_private_subnets_detected(self) -> None:
        private_ips = ["10.240.0.10", "10.240.20.50", "172.16.5.1", "127.0.0.1"]
        for ip in private_ips:
            with self.subTest(ip=ip):
                self.assertFalse(custom_iris.is_public_ip(ip))
                enriched = custom_iris.enrich_ip(ip)
                self.assertFalse(enriched["is_public"])
                self.assertEqual(enriched["classification"], "internal_private")

    def test_public_ips_detected_and_enriched(self) -> None:
        known_attacker = "64.62.156.159"
        self.assertTrue(custom_iris.is_public_ip(known_attacker))
        enriched = custom_iris.enrich_ip(known_attacker)
        self.assertTrue(enriched["is_public"])
        self.assertEqual(enriched["country"], "United States of America")
        self.assertEqual(enriched["country_code"], "US")
        self.assertIn("Hurricane Electric", enriched["asn"])

    def test_synthetic_public_ip_enrichment_fallback(self) -> None:
        arbitrary_public = "93.184.216.34"
        self.assertTrue(custom_iris.is_public_ip(arbitrary_public))
        enriched = custom_iris.enrich_ip(arbitrary_public)
        self.assertTrue(enriched["is_public"])
        self.assertIn("country", enriched)
        self.assertIn("asn", enriched)


class TestPayloadGeneration(unittest.TestCase):
    def setUp(self) -> None:
        self.sample_alert = {
            "id": "10042",
            "timestamp": "2026-11-10T14:30:00.000000+0000",
            "rule": {
                "id": "86601",
                "level": 10,
                "description": "ET DROP Dshield Block Listed Source group 1",
                "mitre": {
                    "id": ["T1071.001", "T1595"],
                },
            },
            "agent": {
                "id": "002",
                "name": "corp-sensor-01.blusoc.internal",
                "ip": "10.240.0.10",
            },
            "data": {
                "src_ip": "64.62.156.159",
                "dest_ip": "10.240.0.10",
                "src_port": "49181",
                "dest_port": "20443",
                "alert": {
                    "signature": "ET DROP Dshield Block Listed Source group 1",
                    "signature_id": 2402000,
                },
            },
            "full_log": "Deep packet inspection raw log entry " + ("Z" * 1500),
        }

    def test_iris_payload_structure(self) -> None:
        payload = custom_iris.build_iris_payload(self.sample_alert)

        self.assertEqual(payload["alert_source"], "Wazuh-BLUSOC")
        self.assertEqual(payload["alert_source_ref"], "10042")
        self.assertEqual(payload["alert_severity_id"], 5)
        self.assertEqual(payload["alert_status_id"], 1)
        self.assertEqual(payload["alert_customer_id"], 1)

        self.assertIn("[Wazuh L10] ET DROP Dshield Block Listed Source group 1", payload["alert_title"])
        self.assertIn("64.62.156.159:49181", payload["alert_description"])
        self.assertIn("United States of America", payload["alert_description"])

        context = payload["alert_context"]
        self.assertEqual(context["src_ip"], "64.62.156.159")
        self.assertEqual(context["dest_ip"], "10.240.0.10")
        self.assertEqual(context["src_port"], 49181)
        self.assertEqual(context["dest_port"], 20443)
        self.assertEqual(context["signature_id"], 2402000)
        self.assertFalse(context["truncated"])
        self.assertGreater(context["raw_log_length"], 1500)

        iocs = payload["alert_iocs"]
        self.assertTrue(any(ioc["ioc_value"] == "64.62.156.159" for ioc in iocs))

    def test_all_67_sanitized_alerts_transform_cleanly(self) -> None:
        dataset_path = INTEGRATIONS_DIR.parent / "data" / "alerts_sanitized.json"
        if not dataset_path.exists():
            self.skipTest("data/alerts_sanitized.json not found")

        with open(dataset_path, "r", encoding="utf-8") as f:
            alerts = json.load(f)

        self.assertEqual(len(alerts), 67)
        for idx, alert in enumerate(alerts):
            transformed = custom_iris.build_iris_payload(alert, max_log_length=4000)
            self.assertIn("alert_title", transformed)
            self.assertIn("alert_description", transformed)
            self.assertEqual(transformed["alert_source"], "Wazuh-BLUSOC")
            self.assertIn(transformed["alert_severity_id"], [1, 3, 4, 5, 6])
            self.assertIn("src_ip", transformed["alert_context"])
            self.assertIn("dest_ip", transformed["alert_context"])
            self.assertIn("src_geo", transformed["alert_context"])
            self.assertFalse(transformed["alert_context"]["truncated"])


class TestCLIExecution(unittest.TestCase):
    def test_cli_test_flag_dry_run(self) -> None:
        sample = {
            "id": "999",
            "rule": {"id": "100019", "level": 8, "description": "Suspicious Reconnaissance Scan"},
            "agent": {"name": "dmz-proxy-01.blusoc.internal", "ip": "10.240.1.20"},
            "data": {"src_ip": "185.220.101.5", "dest_ip": "10.240.1.20", "dest_port": 80},
        }

        with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json", encoding="utf-8") as tmp:
            tmp.write(json.dumps(sample))
            tmp_path = tmp.name

        try:
            cmd = [sys.executable, str(CUSTOM_IRIS_PATH), "--test", tmp_path]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            output = json.loads(result.stdout)
            self.assertEqual(output["alert_source"], "Wazuh-BLUSOC")
            self.assertEqual(output["alert_severity_id"], 1)
            self.assertIn("185.220.101.5", output["alert_context"]["src_ip"])
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


class TestStatusSyncDaemon(unittest.TestCase):
    def setUp(self) -> None:
        self.daemon = iris_status_daemon.IrisStatusDaemon(
            endpoint_url="https://soar-iris-01.blusoc.internal/alerts/filter",
            api_key="TEST_API_KEY",
            poll_interval=10,
        )

    def test_initial_cache_population(self) -> None:
        alerts = [
            {"alert_id": 1, "alert_status_id": 1, "alert_owner_id": None, "alert_title": "Alert 1"},
            {"alert_id": 2, "alert_status_id": 3, "alert_owner_id": 10, "alert_title": "Alert 2"},
        ]
        changes = self.daemon.process_alert_records(alerts)
        self.assertEqual(changes, 0)
        self.assertEqual(len(self.daemon.state_cache), 2)
        self.assertEqual(self.daemon.state_cache["1"]["status_name"], "OPEN")
        self.assertEqual(self.daemon.state_cache["2"]["status_name"], "ASSIGNED")

    def test_state_transition_detection(self) -> None:
        alerts_initial = [
            {"alert_id": 1, "alert_status_id": 1, "alert_owner_id": None, "alert_title": "Alert 1"},
        ]
        self.daemon.process_alert_records(alerts_initial)

        alerts_assigned = [
            {"alert_id": 1, "alert_status_id": 3, "alert_owner_id": 105, "alert_title": "Alert 1"},
        ]
        changes = self.daemon.process_alert_records(alerts_assigned)
        self.assertEqual(changes, 1)
        self.assertEqual(self.daemon.state_cache["1"]["status_name"], "ASSIGNED")
        self.assertEqual(self.daemon.state_cache["1"]["owner_id"], 105)

        alerts_closed = [
            {"alert_id": 1, "alert_status_id": 6, "alert_owner_id": 105, "alert_title": "Alert 1"},
        ]
        changes = self.daemon.process_alert_records(alerts_closed)
        self.assertEqual(changes, 1)
        self.assertEqual(self.daemon.state_cache["1"]["status_name"], "CLOSED")

    def test_exponential_backoff_calculation(self) -> None:
        self.daemon.retry_count = 0
        self.assertEqual(self.daemon.calculate_backoff(), 2.0)

        self.daemon.retry_count = 1
        self.assertEqual(self.daemon.calculate_backoff(), 4.0)

        self.daemon.retry_count = 2
        self.assertEqual(self.daemon.calculate_backoff(), 8.0)

        self.daemon.retry_count = 3
        self.assertEqual(self.daemon.calculate_backoff(), 16.0)

        self.daemon.retry_count = 6
        self.assertEqual(self.daemon.calculate_backoff(), 60.0)

    def test_signal_handling_shutdown(self) -> None:
        self.daemon.running = True
        self.daemon._handle_signal(signal.SIGINT, None)
        self.assertFalse(self.daemon.running)


class TestMockIrisServerAndTransport(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.server = HTTPServer(("127.0.0.1", 0), mock_iris_server.MockIrisHandler)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.server.shutdown()
        cls.server.server_close()

    def test_mock_alerts_add_and_sync_flow(self) -> None:
        test_payload = {
            "alert_title": "[Wazuh L12] Live Integration Test Alert",
            "alert_severity_id": 6,
            "alert_status_id": 1,
            "alert_context": {"rule_id": "100400"},
        }
        hook_url = f"http://127.0.0.1:{self.port}/alerts/add"
        response = custom_iris.send_iris_alert(test_payload, hook_url=hook_url, api_key="TEST_KEY")
        self.assertEqual(response.status_code, 200)
        res_data = response.json()
        self.assertEqual(res_data["status"], "success")
        self.assertIn("alert_id", res_data["data"])

        sync_endpoint = f"http://127.0.0.1:{self.port}/alerts/filter"
        daemon = iris_status_daemon.IrisStatusDaemon(endpoint_url=sync_endpoint)
        daemon.run_once()
        self.assertGreaterEqual(len(daemon.state_cache), 1)


class TestZeroEmDashesConstraint(unittest.TestCase):
    def test_no_em_dashes_in_integrations_files(self) -> None:
        target_extensions = {".py", ".json", ".yml", ".yaml", ".txt", ".md"}
        em_dash = "\u2014"

        violations = []
        for root, _, files in os.walk(INTEGRATIONS_DIR):
            for file_name in files:
                file_path = Path(root) / file_name
                if file_path.suffix.lower() in target_extensions:
                    content = file_path.read_text(encoding="utf-8", errors="replace")
                    if em_dash in content:
                        line_nums = [
                            idx + 1
                            for idx, line in enumerate(content.splitlines())
                            if em_dash in line
                        ]
                        violations.append(f"{file_path} (lines: {line_nums})")

        self.assertEqual(
            violations,
            [],
            f"Found forbidden em dashes (\u2014) in integration files: {violations}",
        )


if __name__ == "__main__":
    unittest.main()
