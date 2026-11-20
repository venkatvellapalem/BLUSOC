#!/usr/bin/env python3
"""Read, validate and render deployment configuration without executing .env files."""
from __future__ import annotations

import argparse
import ipaddress
import json
import os
from pathlib import Path
import re
import secrets
import ssl
import sys
from urllib.error import URLError
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen
from xml.sax.saxutils import escape
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
SECRET_KEYS = (
    "WAZUH_ENROLLMENT_PASSWORD", "IRIS_API_KEY", "IRIS_ADMIN_PASSWORD",
    "POSTGRES_PASSWORD", "POSTGRES_ADMIN_PASSWORD", "IRIS_SECRET_KEY",
    "IRIS_SECURITY_PASSWORD_SALT", "RABBITMQ_PASSWORD",
)
REQUIRED_KEYS = (
    "WAZUH_VERSION", "WAZUH_EVENTS_PORT", "WAZUH_REGISTRATION_PORT",
    "IRIS_VERSION", "IRIS_SERVER_NAME", "IRIS_API_URL", "IRIS_HTTPS_PORT",
    "IRIS_BIND_ADDRESS", "IRIS_TLS_MODE", "IRIS_CUSTOMER_ID",
    "POSTGRES_USER", "POSTGRES_ADMIN_USER", "POSTGRES_DB", "RABBITMQ_USER",
    "IRIS_POLL_INTERVAL", "SYSLOG_BIND_ADDRESS", "SYSLOG_PORT",
    "SYSLOG_ALLOWED_NETWORK",
) + SECRET_KEYS


def read_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for number, raw in enumerate(path.read_text(encoding="utf-8-sig").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        key, separator, value = line.partition("=")
        if not separator or not re.fullmatch(r"[A-Z][A-Z0-9_]*", key):
            raise ValueError(f"{path.name}:{number}: expected KEY=value")
        if key in values:
            raise ValueError(f"{path.name}:{number}: duplicate key {key}")
        value = value.strip()
        if value.startswith(("'", '"')):
            if len(value) < 2 or value[-1] != value[0]:
                raise ValueError(f"{path.name}:{number}: unmatched quotes for {key}")
            value = value[1:-1]
        if any(ord(char) < 32 for char in value):
            raise ValueError(f"{path.name}:{number}: control characters are not allowed")
        values[key] = value
    return values


def is_placeholder(value: str) -> bool:
    return not value or value.startswith("__") or value.lower().startswith(("change_me", "changeme"))


def validate(values: dict[str, str], allow_placeholders: bool = False) -> None:
    missing = sorted(set(REQUIRED_KEYS) - values.keys())
    unknown = sorted(values.keys() - set(REQUIRED_KEYS))
    if missing:
        raise ValueError("Missing settings: " + ", ".join(missing))
    if unknown:
        raise ValueError("Unknown settings (check for typos): " + ", ".join(unknown))
    for key in SECRET_KEYS:
        if allow_placeholders and is_placeholder(values[key]):
            continue
        if is_placeholder(values[key]) or len(values[key]) < 32:
            raise ValueError(f"{key} must be replaced with a secret of at least 32 characters")
    ports = []
    for key in ("WAZUH_EVENTS_PORT", "WAZUH_REGISTRATION_PORT", "IRIS_HTTPS_PORT", "SYSLOG_PORT"):
        if not values[key].isdigit() or not 1 <= int(values[key]) <= 65535:
            raise ValueError(f"{key} must be a port from 1 to 65535")
        ports.append(int(values[key]))
    if len(set(ports)) != len(ports):
        raise ValueError("Listener ports must be distinct")
    for key in ("IRIS_CUSTOMER_ID", "IRIS_POLL_INTERVAL"):
        if not values[key].isdigit() or int(values[key]) < 1:
            raise ValueError(f"{key} must be a positive integer")
    if not re.fullmatch(r"4\.\d+\.\d+-\d+", values["WAZUH_VERSION"]):
        raise ValueError("WAZUH_VERSION must be an exact 4.x APT version, including -1")
    if not re.fullmatch(r"v2\.4\.\d+", values["IRIS_VERSION"]):
        raise ValueError("This deployment supports stable IRIS v2.4.x images")
    for key in ("IRIS_BIND_ADDRESS", "SYSLOG_BIND_ADDRESS"):
        if ipaddress.ip_address(values[key]).version != 4:
            raise ValueError(f"{key} must be an IPv4 bind address")
    if ipaddress.ip_network(values["SYSLOG_ALLOWED_NETWORK"], strict=False).version != 4:
        raise ValueError("SYSLOG_ALLOWED_NETWORK must be an IPv4 CIDR")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9.-]*", values["IRIS_SERVER_NAME"]):
        raise ValueError("IRIS_SERVER_NAME must be a DNS name or IPv4 address")
    for key in ("POSTGRES_USER", "POSTGRES_ADMIN_USER", "POSTGRES_DB", "RABBITMQ_USER"):
        if not re.fullmatch(r"[a-z][a-z0-9_]{0,62}", values[key]):
            raise ValueError(f"{key} must be a lowercase SQL-style identifier")
    if values["POSTGRES_USER"] == values["POSTGRES_ADMIN_USER"]:
        raise ValueError("POSTGRES_USER and POSTGRES_ADMIN_USER must differ")
    url = urlsplit(values["IRIS_API_URL"])
    if (url.scheme != "https" or url.username or url.password or url.query or url.fragment
            or url.path not in ("", "/") or url.hostname != values["IRIS_SERVER_NAME"].lower()
            or (url.port or 443) != int(values["IRIS_HTTPS_PORT"])):
        raise ValueError("IRIS_API_URL must be an HTTPS origin matching IRIS_SERVER_NAME and IRIS_HTTPS_PORT")
    if values["IRIS_TLS_MODE"] not in ("self-signed", "provided"):
        raise ValueError("IRIS_TLS_MODE must be self-signed or provided")


def write_private(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    # Open with restrictive permissions from creation, including when replacing a file.
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    try:
        os.fchmod(fd, 0o600) if hasattr(os, "fchmod") else None
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(content)
    except BaseException:
        try:
            os.close(fd)
        except OSError:
            pass
        raise


def render(values: dict[str, str], target: Path) -> None:
    def raw_env(name: str, entries: dict[str, str]) -> None:
        write_private(target / name, "".join(f"{key}={value}\n" for key, value in entries.items()))
    raw_env("compose.env", {key: values[key] for key in (
        "IRIS_VERSION", "IRIS_BIND_ADDRESS", "IRIS_HTTPS_PORT", "IRIS_SERVER_NAME")})
    database = {key: values[key] for key in (
        "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_ADMIN_USER", "POSTGRES_ADMIN_PASSWORD", "POSTGRES_DB")}
    raw_env("database.env", database)
    raw_env("broker.env", {
        "RABBITMQ_DEFAULT_USER": values["RABBITMQ_USER"],
        "RABBITMQ_DEFAULT_PASS": values["RABBITMQ_PASSWORD"],
    })
    app = dict(database, POSTGRES_SERVER="iris-db", POSTGRES_PORT="5432", DOCKERIZED="1",
               IRIS_SECRET_KEY=values["IRIS_SECRET_KEY"],
               IRIS_SECURITY_PASSWORD_SALT=values["IRIS_SECURITY_PASSWORD_SALT"],
               IRIS_ADM_USERNAME="administrator", IRIS_ADM_PASSWORD=values["IRIS_ADMIN_PASSWORD"],
               IRIS_ADM_API_KEY=values["IRIS_API_KEY"], IRIS_AUTHENTICATION_TYPE="local",
               CELERY_BROKER="amqp://" + quote(values["RABBITMQ_USER"], safe="") + ":" +
               quote(values["RABBITMQ_PASSWORD"], safe="") + "@iris-rabbitmq:5672//")
    raw_env("application.env", app)
    text = (ROOT / "templates/ossec.conf.template").read_text(encoding="utf-8")
    for key in re.findall(r"\$\{([A-Z_]+)\}", text):
        if key not in values:
            raise ValueError(f"Unresolved XML setting: {key}")
        value = values[key].rstrip("/") if key == "IRIS_API_URL" else values[key]
        text = text.replace("${" + key + "}", escape(value))
    ET.fromstring(text)
    write_private(target / "ossec.conf", text)


def probe_iris(values: dict[str, str], ca_file: str | None = None) -> None:
    context = ssl.create_default_context(cafile=ca_file)
    request = Request(values["IRIS_API_URL"].rstrip("/") + "/alerts/filter",
                      headers={"Authorization": "Bearer " + values["IRIS_API_KEY"], "Accept": "application/json"})
    with urlopen(request, timeout=15, context=context) as response:
        payload = json.load(response)
    if not isinstance(payload, dict) or payload.get("status") not in ("success", "Success"):
        raise ValueError("IRIS API did not return a successful authenticated JSON response")
    print("Authenticated IRIS API: ready")


def select_ioc_types(rows: list[dict]) -> dict[str, int]:
    """Resolve IDs from the instance rather than assuming a particular database seed order."""
    names = {str(row.get("type_name", "")).lower().replace(" ", ""): row.get("type_id") for row in rows}
    generic = next((names[name] for name in ("ip-dst", "ip-src", "ip") if name in names), None)
    result = {"ipv4": names.get("ipv4", generic), "ipv6": names.get("ipv6", generic)}
    if any(not isinstance(value, int) or value < 1 for value in result.values()):
        raise ValueError("IRIS must provide IPv4/IPv6 or generic IP IOC types before binding the adapter")
    return result


def discover_ioc_types(values: dict[str, str]) -> dict[str, int]:
    request = Request(values["IRIS_API_URL"].rstrip("/") + "/manage/ioc-types/list",
                      headers={"Authorization": "Bearer " + values["IRIS_API_KEY"], "Accept": "application/json"})
    with urlopen(request, timeout=15, context=ssl.create_default_context()) as response:
        payload = json.load(response)
    if not isinstance(payload, dict) or payload.get("status") != "success" or not isinstance(payload.get("data"), list):
        raise ValueError("IRIS IOC type discovery did not return a successful list")
    return select_ioc_types(payload["data"])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("check", "export", "init", "render", "probe-iris", "discover-ioc-types"))
    parser.add_argument("--env-file", type=Path, default=ROOT / ".env")
    parser.add_argument("--allow-placeholders", action="store_true")
    parser.add_argument("--output-dir", type=Path)
    parser.add_argument("--ca-file")
    args = parser.parse_args()
    try:
        if args.action == "init":
            if args.env_file.exists():
                raise ValueError("Refusing to overwrite an existing environment file")
            text = (ROOT / ".env.example").read_text(encoding="utf-8")
            for key in SECRET_KEYS:
                text = re.sub(rf"^{key}=.*$", f"{key}={secrets.token_hex(32)}", text, flags=re.MULTILINE)
            write_private(args.env_file, text)
            print(f"Created {args.env_file}. Review hostnames, ports, versions, and sensor network before deploying.")
            return 0
        values = read_env(args.env_file)
        validate(values, args.allow_placeholders)
        if args.action == "export":
            print("".join(f"{key}={value}\n" for key, value in values.items()), end="")
        elif args.action == "render":
            if not args.output_dir:
                raise ValueError("--output-dir is required for render")
            render(values, args.output_dir)
            print("Rendered private deployment configuration")
        elif args.action == "probe-iris":
            probe_iris(values, args.ca_file)
        elif args.action == "discover-ioc-types":
            print(json.dumps(discover_ioc_types(values)))
        else:
            print("Configuration is valid" + (" (example placeholders allowed)" if args.allow_placeholders else ""))
        return 0
    except (OSError, ValueError, URLError, ET.ParseError) as error:
        # Do not print settings, response bodies, or exception strings containing credentials.
        if isinstance(error, (ValueError, FileNotFoundError)):
            print(f"Configuration error: {error}", file=sys.stderr)
        else:
            print(f"Configuration operation failed: {type(error).__name__}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
