#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"
init_step "$@"
if [ "$DRY_RUN" = true ]; then
    log "PLAN: install exact Wazuh package $WAZUH_VERSION; preserve a configuration backup; render XML and validate with wazuh-analysisd."
    log "PLAN: require agent enrollment password. Restart after the integration is installed in step 4."
    exit 0
fi
if dpkg-query -W -f='${Status}' wazuh-manager 2>/dev/null | grep -q 'install ok installed'; then
    installed="$(dpkg-query -W -f='${Version}' wazuh-manager)"
    [ "$installed" = "$WAZUH_VERSION" ] || fail "Wazuh version differs from WAZUH_VERSION. Review and perform an explicit upgrade before continuing."
else
    install -d -m 0755 /etc/apt/keyrings
    curl -fsSL --retry 3 https://packages.wazuh.com/key/GPG-KEY-WAZUH -o /etc/apt/keyrings/wazuh.asc
    chmod 0644 /etc/apt/keyrings/wazuh.asc
    printf 'deb [signed-by=/etc/apt/keyrings/wazuh.asc] https://packages.wazuh.com/4.x/apt/ stable main\n' > /etc/apt/sources.list.d/wazuh.list
    apt-get update
    apt-cache show "wazuh-manager=$WAZUH_VERSION" >/dev/null || fail "Pinned Wazuh package is unavailable. Review WAZUH_VERSION."
    apt-get install -y --no-install-recommends "wazuh-manager=$WAZUH_VERSION"
fi
group="$(wazuh_group)"
install -d -m 0750 -o root -g "$group" /etc/blusoc
if [ ! -f /var/ossec/etc/sslmanager.cert ] || [ ! -f /var/ossec/etc/sslmanager.key ]; then
    openssl req -x509 -nodes -newkey rsa:3072 -days 365 -keyout /var/ossec/etc/sslmanager.key -out /var/ossec/etc/sslmanager.cert -subj '/CN=blusoc-wazuh'
fi
chown root:"$group" /var/ossec/etc/sslmanager.key
chmod 0640 /var/ossec/etc/sslmanager.key
printf '%s\n' "$WAZUH_ENROLLMENT_PASSWORD" > /var/ossec/etc/authd.pass
chown root:"$group" /var/ossec/etc/authd.pass
chmod 0640 /var/ossec/etc/authd.pass
render_dir="$(mktemp -d)"
trap 'rm -rf "$render_dir"' EXIT
"$PYTHON" "${DEPLOY_ROOT}/config.py" render --env-file "$BLUSOC_ENV_FILE" --output-dir "$render_dir"
if [ -f /var/ossec/etc/ossec.conf ]; then cp -p /var/ossec/etc/ossec.conf "/var/ossec/etc/ossec.conf.backup.$(date +%Y%m%d%H%M%S)"; fi
install -m 0640 -o root -g "$group" "$render_dir/ossec.conf" /var/ossec/etc/ossec.conf
for rule in "${REPO_ROOT}"/detection-engineering/wazuh/rules/*.xml; do
    install -m 0640 -o root -g "$group" "$rule" "/var/ossec/etc/rules/$(basename "$rule")"
done
/var/ossec/bin/wazuh-analysisd -t
systemctl enable wazuh-manager.service
log "Wazuh configuration validated. Step 4 installs the integration and restarts the manager."
