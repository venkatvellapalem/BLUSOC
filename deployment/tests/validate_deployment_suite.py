#!/usr/bin/env python3
"""Portable deployment contract tests. Live service checks run on the Ubuntu host."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
import xml.etree.ElementTree as ET

import yaml

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("deployment_config", ROOT / "config.py")
config = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config)


def find_bash():
    candidates = [r"C:\Program Files\Git\bin\bash.exe", shutil.which("bash")]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            try:
                if subprocess.run([candidate, "--version"], capture_output=True, timeout=10).returncode == 0:
                    return candidate
            except (OSError, subprocess.TimeoutExpired):
                pass
    return None


class ConfigurationTests(unittest.TestCase):
    def setUp(self):
        self.values = config.read_env(ROOT / ".env.example")
        for key in config.SECRET_KEYS:
            self.values[key] = "test-only-" + "a" * 40

    def test_valid_configuration(self):
        config.validate(self.values)

    def test_ioc_ids_are_resolved_from_the_instance(self):
        self.assertEqual(config.select_ioc_types([{"type_name": "IPv4", "type_id": 100}, {"type_name": "IPv6", "type_id": 101}]), {"ipv4": 100, "ipv6": 101})
        self.assertEqual(config.select_ioc_types([{"type_name": "ip-dst", "type_id": 50}]), {"ipv4": 50, "ipv6": 50})
        with self.assertRaises(ValueError):
            config.select_ioc_types([])

    def test_placeholders_are_rejected(self):
        with self.assertRaisesRegex(ValueError, "WAZUH_ENROLLMENT_PASSWORD"):
            config.validate(config.read_env(ROOT / ".env.example"))

    def test_missing_and_unknown_keys(self):
        missing = dict(self.values)
        del missing["IRIS_API_KEY"]
        with self.assertRaisesRegex(ValueError, "Missing settings"):
            config.validate(missing)
        with self.assertRaisesRegex(ValueError, "Unknown settings"):
            config.validate(dict(self.values, IRIS_APY_KEY="typo"))

    def test_origin_port_and_listener_validation(self):
        for key, value in (("IRIS_HTTPS_PORT", "70000"), ("IRIS_API_URL", "http://localhost:8443"),
                           ("SYSLOG_ALLOWED_NETWORK", "invalid"), ("IRIS_POLL_INTERVAL", "0"),
                           ("IRIS_TLS_MODE", "insecure"), ("WAZUH_VERSION", "latest")):
            with self.subTest(key=key), self.assertRaises(ValueError):
                config.validate(dict(self.values, **{key: value}))

    def test_environment_is_literal_data(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env"
            path.write_text("PASSWORD='$(touch should-not-exist); $VALUE & # literal'\n", encoding="utf-8")
            self.assertEqual(config.read_env(path)["PASSWORD"], "$(touch should-not-exist); $VALUE & # literal")
            path.write_text("KEY=a\nKEY=b\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "duplicate"):
                config.read_env(path)

    def test_init_is_private_and_will_not_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env"
            command = [sys.executable, str(ROOT / "config.py"), "init", "--env-file", str(path)]
            first = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            values = config.read_env(path)
            config.validate(values)
            self.assertEqual(len({values[key] for key in config.SECRET_KEYS}), len(config.SECRET_KEYS))
            self.assertNotEqual(subprocess.run(command, capture_output=True).returncode, 0)
            if os.name != "nt":
                self.assertEqual(path.stat().st_mode & 0o777, 0o600)

    def test_render_escapes_xml_and_preserves_special_characters(self):
        values = dict(self.values, IRIS_API_KEY="a" * 35 + "$&<>'#|/", RABBITMQ_PASSWORD="b" * 35 + "$&@:#/'")
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            config.render(values, output)
            xml = ET.parse(output / "ossec.conf").getroot()
            self.assertEqual(xml.findtext("integration/api_key"), "blusoc-runtime")
            self.assertNotIn(values["IRIS_API_KEY"], (output / "ossec.conf").read_text())
            self.assertIn("IRIS_ADM_API_KEY=" + values["IRIS_API_KEY"], (output / "application.env").read_text())
            self.assertIn("%24%26%40%3A%23%2F%27", (output / "application.env").read_text())
            self.assertNotIn("IRIS_API_KEY", (output / "compose.env").read_text())
            self.assertEqual(len(xml.findall("ruleset/rule")), 0)


class DeploymentContractTests(unittest.TestCase):
    def test_compose_contract(self):
        compose = yaml.safe_load((ROOT / "templates/docker-compose.iris.yml").read_text())
        services = compose["services"]
        self.assertEqual(set(services), {"iris-db", "iris-rabbitmq", "iris-app", "iris-worker", "iris-nginx"})
        self.assertNotIn("ports", services["iris-db"])
        self.assertNotIn("ports", services["iris-rabbitmq"])
        self.assertTrue(compose["networks"]["iris-backend"]["internal"])
        for name in ("iris-app", "iris-db", "iris-nginx"):
            self.assertIn("ghcr.io/dfir-iris/", services[name]["image"])
        for name in ("iris-app", "iris-db", "iris-rabbitmq"):
            self.assertEqual(services[name]["env_file"][0]["format"], "raw")

    def test_systemd_environment_and_dedicated_user(self):
        unit = (ROOT / "systemd/blusoc-sync.service").read_text()
        self.assertIn("User=blusoc", unit)
        self.assertIn("EnvironmentFile=/etc/blusoc/blusoc.env", unit)
        self.assertIn("Restart=on-failure", unit)
        self.assertNotIn("--api-key", unit)
        self.assertNotIn("--db-url", unit)

    def test_bash_syntax_and_lf(self):
        bash = find_bash()
        self.assertIsNotNone(bash, "Install Bash (Git for Windows includes it)")
        for path in sorted(ROOT.rglob("*.sh")):
            with self.subTest(script=path.name):
                self.assertNotIn(b"\r\n", path.read_bytes(), "Shell scripts must use LF")
                result = subprocess.run([bash, "-n", str(path)], capture_output=True, text=True, timeout=10)
                self.assertEqual(result.returncode, 0, result.stderr)

    def test_dry_run_and_argument_failures(self):
        bash = find_bash()
        self.assertIsNotNone(bash, "Install Bash to exercise the deployment CLI")
        command = [bash, str(ROOT / "deploy.sh")]
        result = subprocess.run(command + ["--dry-run", "--env-file", str(ROOT / ".env.example")],
                                capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("No services were installed or checked", result.stdout)
        self.assertNotIn("[PASS]", result.stdout)
        for arguments in (["--step"], ["--from-step"], ["--env-file"], ["--step", "9"],
                          ["--step", "1", "--from-step", "2"], ["--dry-run", "--check"]):
            with self.subTest(arguments=arguments):
                result = subprocess.run(command + arguments, capture_output=True, timeout=10)
                self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
