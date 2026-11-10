#!/usr/bin/env python3
"""
BLUSOC Wazuh to DFIR-IRIS Integration Wrapper (custom-iris)

Invoked by Wazuh integratord daemon to transform, enrich, and forward
security alerts into DFIR-IRIS case management.

Arguments (invoked by Wazuh integratord):
  sys.argv[1]: Path to temporary JSON alert file written by Wazuh
  sys.argv[2]: API key for DFIR-IRIS authentication
  sys.argv[3]: Webhook endpoint URL (e.g., https://soar-iris-01.blusoc.internal/alerts/add)

CLI Test Mode:
  python custom-iris.py --test <sample_alert.json> [--hook-url <url>] [--api-key <key>] [--send]
"""

import argparse
import ipaddress
import json
import logging
import os
import sys
import urllib.parse
from typing import Any, Dict, List, Optional, Tuple

import requests

MAX_LOG_LENGTH = 4000
DEFAULT_TIMEOUT_SECONDS = 10
DEFAULT_CUSTOMER_ID = 1
DEFAULT_STATUS_ID = 1

MOCK_GEOIP_DB: Dict[str, Dict[str, str]] = {
    "64.62.156.159": {
        "country": "United States of America",
        "country_code": "US",
        "city": "San Jose",
        "asn": "AS6939 Hurricane Electric LLC",
    },
    "185.220.101.5": {
        "country": "Germany",
        "country_code": "DE",
        "city": "Frankfurt",
        "asn": "AS205100 Zwiebelfreunde",
    },
    "45.154.255.88": {
        "country": "Netherlands",
        "country_code": "NL",
        "city": "Amsterdam",
        "asn": "AS44592 Media Land LLC",
    },
    "194.26.29.112": {
        "country": "United Kingdom",
        "country_code": "GB",
        "city": "London",
        "asn": "AS212238 Datacamp Limited",
    },
    "198.51.100.25": {
        "country": "Documentation Network",
        "country_code": "TEST",
        "city": "Test City",
        "asn": "AS64496 TEST-NET-2",
    },
    "103.211.36.242": {
        "country": "India",
        "country_code": "IN",
        "city": "Mumbai",
        "asn": "AS133929 Corporate Gateway",
    },
    "124.123.14.2": {
        "country": "India",
        "country_code": "IN",
        "city": "Hyderabad",
        "asn": "AS133929 Corporate Gateway",
    },
}

SYNTHETIC_GEO_POOLS: List[Dict[str, str]] = [
    {"country": "United States of America", "country_code": "US", "city": "Ashburn", "asn": "AS16509 Amazon.com"},
    {"country": "Germany", "country_code": "DE", "city": "Berlin", "asn": "AS24940 Hetzner Online GmbH"},
    {"country": "Netherlands", "country_code": "NL", "city": "Amsterdam", "asn": "AS60781 LeaseWeb Netherlands"},
    {"country": "United Kingdom", "country_code": "GB", "city": "London", "asn": "AS13030 Initial Group"},
    {"country": "Singapore", "country_code": "SG", "city": "Singapore", "asn": "AS4637 Telstra Global"},
    {"country": "Japan", "country_code": "JP", "city": "Tokyo", "asn": "AS2516 KDDI Corporation"},
    {"country": "Canada", "country_code": "CA", "city": "Montreal", "asn": "AS16276 OVH SAS"},
    {"country": "Australia", "country_code": "AU", "city": "Sydney", "asn": "AS4826 Vocus Pty Ltd"},
]


def setup_logger() -> logging.Logger:
    logger = logging.getLogger("custom-iris")
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] [custom-iris] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        console_handler = logging.StreamHandler(sys.stderr)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        log_path = "/var/ossec/logs/integrations.log"
        try:
            if os.path.exists(os.path.dirname(log_path)) and os.access(os.path.dirname(log_path), os.W_OK):
                file_handler = logging.FileHandler(log_path)
                file_handler.setFormatter(formatter)
                logger.addHandler(file_handler)
        except OSError:
            pass
    return logger


logger = setup_logger()


def map_severity(wazuh_level: int) -> int:
    """
    Translates Wazuh rule levels into DFIR-IRIS severity IDs.
    - Level >= 12: Critical (severity_id = 6)
    - Level 9 to 11: High (severity_id = 5)
    - Level 6 to 8: Medium (severity_id = 1)
    - Level 3 to 5: Low (severity_id = 4)
    - Level < 3: Informational (severity_id = 3)
    """
    if wazuh_level >= 12:
        return 6
    if wazuh_level >= 9:
        return 5
    if wazuh_level >= 6:
        return 1
    if wazuh_level >= 3:
        return 4
    return 3


def truncate_log(log_text: str, max_chars: int = MAX_LOG_LENGTH) -> str:
    """
    Preserves log text up to max_chars characters.
    Expands default 400-char truncation cap to 4000 characters to ensure
    deep packet inspection and PowerShell execution payloads are intact.
    """
    if not isinstance(log_text, str):
        log_text = str(log_text)
    if len(log_text) <= max_chars:
        return log_text
    return log_text[: max_chars - 3] + "..."


def is_public_ip(ip_str: str) -> bool:
    """
    Validates whether an IP address belongs to a routable public block.
    Internal RFC 1918, RFC 5737 test subnets, loopbacks, and link-local are marked private.
    """
    try:
        ip = ipaddress.ip_address(ip_str.strip())
        return not (
            ip.is_private
            or ip.is_loopback
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_link_local
            or ip.is_unspecified
        )
    except ValueError:
        return False


def enrich_ip(ip_str: Optional[str]) -> Dict[str, Any]:
    """
    Enriches IP with public/private classification and mock GeoIP metadata.
    """
    if not ip_str or not isinstance(ip_str, str):
        return {
            "ip": None,
            "is_public": False,
            "classification": "unknown",
            "country": "Unknown",
            "country_code": "XX",
            "city": "Unknown",
            "asn": "Unknown",
        }

    clean_ip = ip_str.strip()
    public_status = is_public_ip(clean_ip)

    if not public_status:
        return {
            "ip": clean_ip,
            "is_public": False,
            "classification": "internal_private",
            "country": "Internal Network",
            "country_code": "RFC1918",
            "city": "BLUSOC Datacenter",
            "asn": "AS-INTERNAL",
        }

    if clean_ip in MOCK_GEOIP_DB:
        entry = MOCK_GEOIP_DB[clean_ip].copy()
        entry["ip"] = clean_ip
        entry["is_public"] = True
        entry["classification"] = "external_public"
        return entry

    try:
        octets = [int(p) for p in clean_ip.split(".") if p.isdigit()]
        index = sum(octets) % len(SYNTHETIC_GEO_POOLS)
    except Exception:
        index = 0

    pool_entry = SYNTHETIC_GEO_POOLS[index].copy()
    pool_entry["ip"] = clean_ip
    pool_entry["is_public"] = True
    pool_entry["classification"] = "external_public"
    return pool_entry


def extract_telemetry_fields(alert_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts core network and signature fields from nested Wazuh alert structures.
    Supports data sub-dictionary, top-level attributes, and nested raw JSON logs.
    """
    data_block = alert_data.get("data", {})
    if not isinstance(data_block, dict):
        data_block = {}

    src_ip = (
        data_block.get("src_ip")
        or data_block.get("srcip")
        or data_block.get("source_ip")
        or alert_data.get("src_ip")
    )
    dest_ip = (
        data_block.get("dest_ip")
        or data_block.get("dstip")
        or data_block.get("dst_ip")
        or data_block.get("destination_ip")
        or alert_data.get("dest_ip")
    )
    src_port = (
        data_block.get("src_port")
        or data_block.get("srcport")
        or alert_data.get("src_port")
    )
    dest_port = (
        data_block.get("dest_port")
        or data_block.get("dstport")
        or data_block.get("dst_port")
        or alert_data.get("dest_port")
    )

    alert_sub = data_block.get("alert")
    if isinstance(alert_sub, dict):
        signature = alert_sub.get("signature")
        signature_id = alert_sub.get("signature_id")
    else:
        signature = None
        signature_id = None

    if not signature:
        signature = (
            data_block.get("signature")
            or alert_data.get("rule", {}).get("description")
            or alert_data.get("short_title")
            or alert_data.get("title")
        )

    if not signature_id:
        signature_id = (
            data_block.get("signature_id")
            or alert_data.get("rule", {}).get("id")
            or alert_data.get("id")
        )

    full_log = alert_data.get("full_log") or alert_data.get("raw_log") or alert_data.get("log")
    if full_log and isinstance(full_log, str) and (not src_ip or not dest_ip or not signature):
        try:
            parsed_log = json.loads(full_log)
            if isinstance(parsed_log, dict):
                src_ip = src_ip or parsed_log.get("src_ip") or parsed_log.get("srcip")
                dest_ip = dest_ip or parsed_log.get("dest_ip") or parsed_log.get("dstip")
                src_port = src_port or parsed_log.get("src_port") or parsed_log.get("srcport")
                dest_port = dest_port or parsed_log.get("dest_port") or parsed_log.get("dstport")
                if not signature:
                    log_alert = parsed_log.get("alert")
                    if isinstance(log_alert, dict):
                        signature = log_alert.get("signature")
                        signature_id = signature_id or log_alert.get("signature_id")
        except (json.JSONDecodeError, TypeError):
            pass

    formatted_sig_id = (
        int(signature_id)
        if signature_id is not None and str(signature_id).isdigit()
        else (str(signature_id) if signature_id is not None else 0)
    )

    return {
        "src_ip": str(src_ip) if src_ip else None,
        "dest_ip": str(dest_ip) if dest_ip else None,
        "src_port": int(src_port) if src_port and str(src_port).isdigit() else None,
        "dest_port": int(dest_port) if dest_port and str(dest_port).isdigit() else None,
        "signature": str(signature) if signature else "Unspecified Event Signature",
        "signature_id": formatted_sig_id,
    }


def build_iris_payload(
    alert_data: Dict[str, Any],
    max_log_length: int = MAX_LOG_LENGTH,
    customer_id: int = DEFAULT_CUSTOMER_ID,
) -> Dict[str, Any]:
    """
    Transforms raw Wazuh alert data into DFIR-IRIS /alerts/add REST format.
    Applies 4000-char truncation cap, GeoIP enrichment, severity translation,
    and IOC mapping.
    """
    rule_block = alert_data.get("rule", {})
    if not isinstance(rule_block, dict):
        rule_block = {}

    wazuh_level = rule_block.get("level", alert_data.get("level", 3))
    try:
        wazuh_level = int(wazuh_level)
    except (ValueError, TypeError):
        wazuh_level = 3

    iris_severity_id = map_severity(wazuh_level)
    telemetry = extract_telemetry_fields(alert_data)
    src_ip = telemetry["src_ip"]
    dest_ip = telemetry["dest_ip"]
    src_port = telemetry["src_port"]
    dest_port = telemetry["dest_port"]
    signature = telemetry["signature"]
    signature_id = telemetry["signature_id"]

    src_geo = enrich_ip(src_ip)
    dest_geo = enrich_ip(dest_ip)

    agent_block = alert_data.get("agent", {})
    agent_name = agent_block.get("name", "corp-sensor-01.blusoc.internal") if isinstance(agent_block, dict) else "corp-sensor-01.blusoc.internal"
    agent_ip = agent_block.get("ip", "10.240.0.10") if isinstance(agent_block, dict) else "10.240.0.10"
    alert_id = str(alert_data.get("id", "0"))
    rule_id = str(rule_block.get("id", signature_id))

    raw_log = alert_data.get("full_log") or alert_data.get("raw_log") or alert_data.get("log") or json.dumps(alert_data)
    truncated_raw_log = truncate_log(str(raw_log), max_chars=max_log_length)

    title = f"[Wazuh L{wazuh_level}] {signature} on {agent_name}"
    description_lines = [
        f"Alert Rule ID: {rule_id} (Level {wazuh_level})",
        f"Signature: {signature} (SID: {signature_id})",
        f"Reporting Sensor: {agent_name} ({agent_ip})",
        f"Source: {src_ip or 'N/A'}:{src_port or 'N/A'} (Country: {src_geo['country']}, ASN: {src_geo['asn']})",
        f"Destination: {dest_ip or 'N/A'}:{dest_port or 'N/A'} (Internal Subnet: {not dest_geo['is_public']})",
        "",
        "Log Payload:",
        truncated_raw_log,
    ]
    description = "\n".join(description_lines)

    iocs: List[Dict[str, str]] = []
    if src_ip:
        iocs.append({
            "ioc_value": src_ip,
            "ioc_type": "ip",
            "ioc_description": f"Source IP ({src_geo['country']})",
        })
    if dest_ip and dest_geo["is_public"]:
        iocs.append({
            "ioc_value": dest_ip,
            "ioc_type": "ip",
            "ioc_description": "Destination Public IP",
        })

    mitre_block = rule_block.get("mitre", {})
    tags: List[str] = ["Wazuh", f"Level-{wazuh_level}"]
    if isinstance(mitre_block, dict):
        mitre_ids = mitre_block.get("id", [])
        if isinstance(mitre_ids, list):
            tags.extend([str(t) for t in mitre_ids])
        elif isinstance(mitre_ids, str):
            tags.append(mitre_ids)

    timestamp = alert_data.get("timestamp", "2026-11-10T00:00:00.000000+0000")

    payload = {
        "alert_title": title,
        "alert_description": description,
        "alert_source": "Wazuh-BLUSOC",
        "alert_source_ref": alert_id,
        "alert_source_link": f"https://siem-core-01.blusoc.internal:20443/app/wazuh#/manager/?tab=alerts&id={alert_id}",
        "alert_severity_id": iris_severity_id,
        "alert_status_id": DEFAULT_STATUS_ID,
        "alert_customer_id": customer_id,
        "alert_source_event_time": timestamp,
        "alert_tags": ",".join(tags),
        "alert_iocs": iocs,
        "alert_context": {
            "wazuh_level": wazuh_level,
            "rule_id": rule_id,
            "agent_name": agent_name,
            "agent_ip": agent_ip,
            "src_ip": src_ip,
            "dest_ip": dest_ip,
            "src_port": src_port,
            "dest_port": dest_port,
            "signature": signature,
            "signature_id": signature_id,
            "src_geo": src_geo,
            "dest_geo": dest_geo,
            "raw_log_length": len(str(raw_log)),
            "truncated": len(str(raw_log)) > max_log_length,
        },
    }
    return payload


def send_iris_alert(
    payload: Dict[str, Any],
    hook_url: str,
    api_key: str,
    timeout: int = DEFAULT_TIMEOUT_SECONDS,
    verify_ssl: bool = False,
) -> requests.Response:
    """
    Transports payload to DFIR-IRIS endpoint via HTTP POST.
    Supplies Bearer Authorization and X-IRIS-AUTH headers.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "X-IRIS-AUTH": api_key,
        "Content-Type": "application/json",
        "User-Agent": "BLUSOC-Wazuh-Integrator/1.0",
    }
    logger.info("Dispatching alert '%s' to %s", payload.get("alert_title"), hook_url)
    response = requests.post(
        hook_url,
        json=payload,
        headers=headers,
        timeout=timeout,
        verify=verify_ssl,
    )
    response.raise_for_status()
    return response


def parse_arguments(argv: List[str]) -> Tuple[str, str, str, bool, bool]:
    """
    Parses command line arguments supporting both Wazuh standard integratord
    invocation and standalone CLI testing modes.

    Returns:
      (alert_file, api_key, hook_url, test_mode, send_flag)
    """
    if len(argv) > 1 and argv[1] in ("--test", "-t"):
        parser = argparse.ArgumentParser(description="BLUSOC DFIR-IRIS Integration Test CLI")
        parser.add_argument("--test", "-t", required=True, help="Path to sample alert JSON file")
        parser.add_argument(
            "--hook-url",
            default="https://soar-iris-01.blusoc.internal/alerts/add",
            help="DFIR-IRIS webhook URL",
        )
        parser.add_argument("--api-key", default="BLUSOC_TEST_API_KEY", help="DFIR-IRIS API key")
        parser.add_argument("--send", action="store_true", help="Send HTTP request instead of dry-run")
        args = parser.parse_args(argv[1:])
        return args.test, args.api_key, args.hook_url, True, args.send

    if len(argv) >= 4:
        return argv[1], argv[2], argv[3], False, True

    if len(argv) == 2 and not argv[1].startswith("-"):
        return argv[1], "BLUSOC_TEST_API_KEY", "https://soar-iris-01.blusoc.internal/alerts/add", True, False

    print(
        "Usage (Wazuh Integratord): python custom-iris.py <alert_file> <api_key> <hook_url>\n"
        "Usage (CLI Test Mode):   python custom-iris.py --test <sample_alert.json> [--hook-url <url>] [--send]",
        file=sys.stderr,
    )
    sys.exit(1)


def main() -> int:
    alert_file, api_key, hook_url, test_mode, should_send = parse_arguments(sys.argv)

    if not os.path.exists(alert_file):
        logger.error("Alert file does not exist: %s", alert_file)
        return 1

    try:
        with open(alert_file, "r", encoding="utf-8") as f:
            raw_content = f.read().strip()
            if not raw_content:
                logger.error("Alert file is empty: %s", alert_file)
                return 1
            alert_data = json.loads(raw_content)
    except Exception as exc:
        logger.error("Failed to parse alert file JSON: %s", exc)
        return 1

    payload = build_iris_payload(alert_data, max_log_length=MAX_LOG_LENGTH)

    if test_mode and not should_send:
        print(json.dumps(payload, indent=2))
        logger.info("Test mode dry-run completed successfully.")
        return 0

    try:
        response = send_iris_alert(payload, hook_url, api_key)
        logger.info("Alert posted successfully. HTTP status: %d", response.status_code)
        return 0
    except requests.exceptions.RequestException as exc:
        logger.error("Failed to forward alert to DFIR-IRIS endpoint: %s", exc)
        return 2


if __name__ == "__main__":
    sys.exit(main())
