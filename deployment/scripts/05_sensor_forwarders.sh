#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"
init_step "$@"
if [ "$DRY_RUN" = true ]; then
    log "PLAN: plain UDP/TCP syslog on $SYSLOG_BIND_ADDRESS:$SYSLOG_PORT; allow only loopback and $SYSLOG_ALLOWED_NETWORK."
    log "PLAN: validate rsyslog before restart; rotate only the logs BLUSOC owns."
    exit 0
fi
group="$(wazuh_group)"
install -d -m 0755 /var/log/blusoc
for logfile in firewall.log waf.log; do
    touch "/var/log/blusoc/$logfile"
    chown syslog:"$group" "/var/log/blusoc/$logfile"
    chmod 0640 "/var/log/blusoc/$logfile"
done
cat > /etc/rsyslog.d/10-blusoc-sensors.conf <<RSYSLOG
# Managed by BLUSOC. Only explicitly bound remote inputs use this ruleset.
\$AllowedSender UDP, 127.0.0.0/8, $SYSLOG_ALLOWED_NETWORK
\$AllowedSender TCP, 127.0.0.0/8, $SYSLOG_ALLOWED_NETWORK
module(load="imudp")
module(load="imtcp")
template(name="BlusocMessage" type="string" string="%msg:::drop-last-lf%\\n")
template(name="BlusocRaw" type="string" string="%rawmsg%\\n")
ruleset(name="blusocRemote") {
    if (\$msg contains 'Cloudflare' or \$msg contains 'cloudflare' or \$msg contains 'waf_rule' or \$msg contains 'cf-ray') then {
        action(type="omfile" file="/var/log/blusoc/waf.log" template="BlusocMessage" fileOwner="syslog" fileGroup="$group" fileCreateMode="0640")
        stop
    }
    action(type="omfile" file="/var/log/blusoc/firewall.log" template="BlusocRaw" fileOwner="syslog" fileGroup="$group" fileCreateMode="0640")
    stop
}
input(type="imudp" address="$SYSLOG_BIND_ADDRESS" port="$SYSLOG_PORT" ruleset="blusocRemote")
input(type="imtcp" address="$SYSLOG_BIND_ADDRESS" port="$SYSLOG_PORT" ruleset="blusocRemote")
RSYSLOG
cat > /etc/logrotate.d/blusoc-sensors <<ROTATE
/var/log/blusoc/firewall.log /var/log/blusoc/waf.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 syslog $group
    sharedscripts
    postrotate
        systemctl kill -s HUP rsyslog.service
    endscript
}
ROTATE
rsyslogd -N1
systemctl enable rsyslog.service
systemctl restart rsyslog.service
systemctl is-active --quiet rsyslog.service
log "Sensor listener configured. Restrict incoming traffic to the sensor network in the host/cloud firewall."
