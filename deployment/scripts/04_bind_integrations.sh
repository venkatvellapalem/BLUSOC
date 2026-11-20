#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"
init_step "$@"
if [ "$DRY_RUN" = true ]; then
    log "PLAN: install pinned Python dependencies in /opt/blusoc/venv; install the Wazuh adapter with root:wazuh ownership."
    log "PLAN: install a dedicated-user IRIS status monitor; protect its environment; restart and verify both services."
    exit 0
fi
group="$(wazuh_group)"
python3 -m venv /opt/blusoc/venv
/opt/blusoc/venv/bin/python -m pip install --disable-pip-version-check --requirement "${REPO_ROOT}/integrations/sync-daemon/requirements.txt"
install -d -m 0750 -o root -g "$group" /etc/blusoc
install -m 0750 -o root -g "$group" "${REPO_ROOT}/integrations/custom-iris/custom-iris.py" /var/ossec/integrations/custom-iris.py
cat > /var/ossec/integrations/custom-iris <<'WRAPPER'
#!/opt/blusoc/venv/bin/python
import json
import os
import runpy
with open("/etc/blusoc/integration.json", encoding="utf-8") as handle:
    os.environ.update(json.load(handle))
runpy.run_path("/var/ossec/integrations/custom-iris.py", run_name="__main__")
WRAPPER
chown root:"$group" /var/ossec/integrations/custom-iris
chmod 0750 /var/ossec/integrations/custom-iris
install -m 0755 "${REPO_ROOT}/integrations/sync-daemon/iris_status_daemon.py" /opt/blusoc/bin/iris_status_daemon.py
IRIS_IOC_TYPES_JSON="$("$PYTHON" "${DEPLOY_ROOT}/config.py" discover-ioc-types --env-file "$BLUSOC_ENV_FILE")"
export IRIS_IOC_TYPES_JSON
"$PYTHON" - <<'PY'
import json, os
from pathlib import Path
settings = {
    "IRIS_API_KEY": os.environ["IRIS_API_KEY"],
    "IRIS_ENDPOINT": os.environ["IRIS_API_URL"].rstrip("/") + "/alerts/filter",
    "IRIS_POLL_INTERVAL": os.environ["IRIS_POLL_INTERVAL"],
    "IRIS_AUDIT_LOG": "/var/log/blusoc/iris-status/audit.log",
    "IRIS_STATE_DB": "/var/lib/blusoc/iris-status.sqlite3",
    "IRIS_VERIFY_SSL": "true",
    "REQUESTS_CA_BUNDLE": "/etc/ssl/certs/ca-certificates.crt",
}
os.umask(0o077)
Path("/etc/blusoc/blusoc.env").write_text("".join(key + "=" + json.dumps(value, ensure_ascii=False) + "\n" for key, value in settings.items()), encoding="utf-8")
types = json.loads(os.environ["IRIS_IOC_TYPES_JSON"])
Path("/etc/blusoc/integration.json").write_text(json.dumps({
    "IRIS_CUSTOMER_ID": os.environ["IRIS_CUSTOMER_ID"], "IRIS_VERIFY_SSL": "true",
    "IRIS_API_KEY": os.environ["IRIS_API_KEY"],
    "REQUESTS_CA_BUNDLE": "/etc/ssl/certs/ca-certificates.crt",
    "IRIS_IOC_IPV4_TYPE_ID": str(types["ipv4"]), "IRIS_IOC_IPV6_TYPE_ID": str(types["ipv6"]),
}), encoding="utf-8")
PY
chown root:"$group" /etc/blusoc/integration.json
chmod 0640 /etc/blusoc/integration.json
chmod 0600 /etc/blusoc/blusoc.env
install -m 0644 "${DEPLOY_ROOT}/systemd/blusoc-sync.service" /etc/systemd/system/blusoc-sync.service
/var/ossec/bin/wazuh-analysisd -t
systemctl daemon-reload
systemctl enable wazuh-manager.service blusoc-sync.service
systemctl restart wazuh-manager.service blusoc-sync.service
systemctl is-active --quiet wazuh-manager.service
systemctl is-active --quiet blusoc-sync.service
log "Wazuh adapter and IRIS status monitor installed."
