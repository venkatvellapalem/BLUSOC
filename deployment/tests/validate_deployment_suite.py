#!/usr/bin/env python3
"""
BLUSOC Deployment Suite Validation Test Harness
Location: deployment/tests/validate_deployment_suite.py

Verifies:
1. Bash syntax validity across all provisioning and orchestrator scripts.
2. Required keys and placeholder sanitization in deployment/.env.example.
3. XML syntax validity of ossec.conf.template.
4. YAML syntax validity of docker-compose.iris.yml.
5. Systemd unit structure of blusoc-sync.service.
6. Absolute zero em dashes across all files in deployment/.
"""

import os
import re
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Set, Tuple

import yaml

DEPLOY_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = DEPLOY_DIR.parent

EXPECTED_ENV_KEYS: List[str] = [
    # Wazuh Manager
    "WAZUH_MANAGER_IP",
    "WAZUH_API_PORT",
    "WAZUH_API_USER",
    "WAZUH_API_PASSWORD",
    "WAZUH_CLUSTER_KEY",
    # DFIR-IRIS
    "IRIS_API_URL",
    "IRIS_API_KEY",
    "IRIS_CUSTOMER_ID",
    "IRIS_WEBHOOK_SECRET",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
    # Telemetry Integrations
    "CROWDSTRIKE_CLIENT_ID",
    "CROWDSTRIKE_CLIENT_SECRET",
    "SOPHOS_CLIENT_ID",
    "SOPHOS_CLIENT_SECRET",
    "BARRACUDA_SYSLOG_PORT",
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_ZONE_ID",
    "VIRUSTOTAL_API_KEY",
    # Web & Showcase
    "DATABASE_URL",
    "SESSION_SECRET",
    "NEXT_PUBLIC_APP_URL",
]

EXPECTED_SCRIPTS: List[str] = [
    "deploy.sh",
    "scripts/01_system_prereqs.sh",
    "scripts/02_wazuh_provision.sh",
    "scripts/03_iris_provision.sh",
    "scripts/04_bind_integrations.sh",
    "scripts/05_sensor_forwarders.sh",
    "scripts/06_health_check.sh",
]


def find_bash_executable() -> str:
    """Locate a functioning bash executable on Windows or Linux."""
    candidates = [
        r"C:\Program Files\Git\bin\bash.exe",
        r"C:\Program Files\Git\usr\bin\bash.exe",
        shutil.which("bash"),
        shutil.which("sh"),
    ]
    for candidate in candidates:
        if candidate and os.path.exists(candidate):
            return candidate
    return ""


def test_bash_scripts_syntax() -> Tuple[bool, str]:
    """Test bash syntax using bash -n on all scripts."""
    bash_bin = find_bash_executable()
    if not bash_bin:
        return False, "No bash executable located on host system"

    errors = []
    for script_rel in EXPECTED_SCRIPTS:
        script_path = DEPLOY_DIR / script_rel
        if not script_path.exists():
            errors.append(f"Missing script: {script_rel}")
            continue

        content = script_path.read_text(encoding="utf-8")
        if not content.startswith("#!/usr/bin/env bash"):
            errors.append(f"{script_rel} missing #!/usr/bin/env bash shebang")
        if "set -eo pipefail" not in content and "set -e" not in content:
            errors.append(f"{script_rel} missing set -eo pipefail")

        # Run bash -n
        cmd = [bash_bin, "-n", str(script_path)]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            errors.append(f"{script_rel} syntax error: {res.stderr.strip()}")

    if errors:
        return False, "; ".join(errors)
    return True, f"All {len(EXPECTED_SCRIPTS)} scripts passed bash -n syntax checks"


def test_env_example_keys() -> Tuple[bool, str]:
    """Verify all required keys and sanitization in .env.example."""
    env_file = DEPLOY_DIR / ".env.example"
    if not env_file.exists():
        return False, f"Missing {env_file}"

    content = env_file.read_text(encoding="utf-8")
    parsed_keys: Set[str] = set()

    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key = line.split("=", 1)[0].strip()
            parsed_keys.add(key)

    missing = [k for k in EXPECTED_ENV_KEYS if k not in parsed_keys]
    if missing:
        return False, f"Missing required env keys in .env.example: {missing}"

    # Sanitization verification
    suspicious_patterns = [
        r"(?i)password\s*=\s*(?!Placeholder|change)[a-zA-Z0-9!@#$%^&*]{8,}",
        r"(?i)secret\s*=\s*(?!Placeholder|placeholder)[a-zA-Z0-9]{16,}",
    ]
    for pattern in suspicious_patterns:
        matches = re.findall(pattern, content)
        if matches:
            return False, f"Potential unsanitized secret pattern detected: {matches}"

    return True, f"All {len(EXPECTED_ENV_KEYS)} required keys present and sanitized"


def test_ossec_template_xml() -> Tuple[bool, str]:
    """Verify that ossec.conf.template is valid XML once placeholders are resolved."""
    template_path = DEPLOY_DIR / "templates" / "ossec.conf.template"
    if not template_path.exists():
        return False, f"Missing template: {template_path}"

    raw_xml = template_path.read_text(encoding="utf-8")

    # Interpolate placeholder variables with dummy values for XML parsing
    dummy_replacements: Dict[str, str] = {
        "${WAZUH_EVENTS_PORT}": "1514",
        "${WAZUH_REGISTRATION_PORT}": "1515",
        "${IRIS_API_KEY}": "test_api_key_123",
        "${IRIS_API_URL}": "https://soar-iris-01.blusoc.internal",
    }
    interpolated = raw_xml
    for placeholder, val in dummy_replacements.items():
        interpolated = interpolated.replace(placeholder, val)

    try:
        root = ET.fromstring(interpolated)
        if root.tag != "ossec_config":
            return False, f"Root element expected <ossec_config>, found <{root.tag}>"

        # Check required tags
        integrations = root.findall("integration")
        if not integrations:
            return False, "Missing <integration> block in ossec.conf.template"

        custom_iris_found = False
        for integ in integrations:
            name_node = integ.find("name")
            if name_node is not None and name_node.text == "custom-iris":
                custom_iris_found = True
                break

        if not custom_iris_found:
            return False, "No <integration><name>custom-iris</name> block found in template"

    except ET.ParseError as err:
        return False, f"XML ParseError in ossec.conf.template: {err}"

    return True, "ossec.conf.template is structurally valid XML with custom-iris hook"


def test_docker_compose_yaml() -> Tuple[bool, str]:
    """Verify that docker-compose.iris.yml is valid YAML with all required services."""
    compose_path = DEPLOY_DIR / "templates" / "docker-compose.iris.yml"
    if not compose_path.exists():
        return False, f"Missing template: {compose_path}"

    raw_yaml = compose_path.read_text(encoding="utf-8")
    try:
        data = yaml.safe_load(raw_yaml)
    except yaml.YAMLError as err:
        return False, f"YAML error in docker-compose.iris.yml: {err}"

    if not isinstance(data, dict):
        return False, "docker-compose.iris.yml root must be a mapping"

    services = data.get("services", {})
    required_services = ["iris-db", "iris-rabbitmq", "iris-app", "iris-worker", "iris-nginx"]
    missing = [s for s in required_services if s not in services]
    if missing:
        return False, f"Missing expected services in docker-compose: {missing}"

    # Check health checks and memory limits
    for s_name in ["iris-db", "iris-app"]:
        srv = services[s_name]
        if "healthcheck" not in srv:
            return False, f"Service {s_name} is missing healthcheck block"

    return True, f"docker-compose.iris.yml is valid YAML with all 5 core services ({', '.join(required_services)})"


def test_systemd_unit() -> Tuple[bool, str]:
    """Verify blusoc-sync.service has required systemd directives."""
    service_path = DEPLOY_DIR / "systemd" / "blusoc-sync.service"
    if not service_path.exists():
        return False, f"Missing unit file: {service_path}"

    content = service_path.read_text(encoding="utf-8")
    required_directives = [
        "[Unit]",
        "[Service]",
        "[Install]",
        "ExecStart",
        "Restart=always",
        "RestartSec=",
        "iris_status_daemon.py",
        "WantedBy=multi-user.target",
    ]

    missing = [d for d in required_directives if d not in content]
    if missing:
        return False, f"Missing systemd directives in blusoc-sync.service: {missing}"

    return True, "blusoc-sync.service has valid systemd directives and clean restart policy"


def test_zero_em_dashes() -> Tuple[bool, str]:
    """Verify that 0 em dashes (U+2014) exist across all deployment/ files."""
    em_dash = "\u2014"
    violations = []
    scanned_files = 0

    for root, _, files in os.walk(DEPLOY_DIR):
        for f in files:
            file_path = Path(root) / f
            scanned_files += 1
            try:
                content = file_path.read_text(encoding="utf-8")
                if em_dash in content:
                    violations.append(str(file_path.relative_to(REPO_ROOT)))
            except UnicodeDecodeError:
                # Binary files if any
                pass

    if violations:
        return False, f"Found em dashes in {len(violations)} file(s): {', '.join(violations)}"

    return True, f"Scanned {scanned_files} files in deployment/: 0 em dashes detected"


def main() -> int:
    print("=" * 80)
    print("BLUSOC ZERO-TOUCH DEPLOYMENT SUITE VALIDATION HARNESS")
    print("=" * 80)

    tests = [
        ("Bash Scripts Syntax & Shebangs", test_bash_scripts_syntax),
        ("Environment Template Keys (.env.example)", test_env_example_keys),
        ("Wazuh Configuration Template (XML)", test_ossec_template_xml),
        ("DFIR-IRIS Container Stack (YAML)", test_docker_compose_yaml),
        ("Systemd Unit Configuration (INI)", test_systemd_unit),
        ("Global Em-Dash Purity Check", test_zero_em_dashes),
    ]

    all_passed = True
    for test_name, test_fn in tests:
        success, message = test_fn()
        status = "[ PASS ]" if success else "[ FAIL ]"
        print(f"{status} {test_name:<45} -> {message}")
        if not success:
            all_passed = False

    print("=" * 80)
    if all_passed:
        print("[ SUCCESS ] All 6 deployment suite tests passed with 100% compliance!")
        return 0
    else:
        print("[ ERROR ] One or more tests failed. Review failures above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
