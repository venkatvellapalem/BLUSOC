#!/usr/bin/env bash
# ==============================================================================
# BLUSOC Provisioning Step 05: Sensor Forwarders and Syslog Ingestion
# ==============================================================================
# - Configures rsyslog to bind UDP 514, TCP 514, and TCP 6514
# - Filters incoming telemetry from Barracuda, Sophos, and Cloudflare WAF
# - Routes firewall logs to /var/log/blusoc/firewall.log
# - Sets up logrotate configuration for sensor logs
# - Establishes Suricata eve.json ingestion hooks
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ANSI color codes
COLOR_RESET="\033[0m"
COLOR_INFO="\033[36m"
COLOR_SUCCESS="\033[32m"
COLOR_WARN="\033[33m"
COLOR_ERROR="\033[31m"
COLOR_DRY="\033[35m"

DRY_RUN=false

log_info() {
    printf "%b[INFO]%b [%s] %s\n" "${COLOR_INFO}" "${COLOR_RESET}" "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

log_success() {
    printf "%b[SUCCESS]%b [%s] %s\n" "${COLOR_SUCCESS}" "${COLOR_RESET}" "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

log_warn() {
    printf "%b[WARN]%b [%s] %s\n" "${COLOR_WARN}" "${COLOR_RESET}" "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

log_error() {
    printf "%b[ERROR]%b [%s] %s\n" "${COLOR_ERROR}" "${COLOR_RESET}" "$(date '+%Y-%m-%d %H:%M:%S')" "$1" >&2
}

log_dry() {
    printf "%b[DRY-RUN]%b [%s] %s\n" "${COLOR_DRY}" "${COLOR_RESET}" "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

execute_cmd() {
    local cmd="$1"
    local desc="$2"
    if [ "${DRY_RUN}" = true ]; then
        log_dry "Would execute: ${cmd} (${desc})"
    else
        log_info "Executing: ${desc}"
        eval "${cmd}"
    fi
}

show_help() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

BLUSOC Step 05: Configure syslog listeners (514/6514) and Suricata sensor hooks.

Options:
  --dry-run, -n       Simulate execution without modifying the host system
  --help, -h          Show this help message and exit
EOF
}

# Parse command line flags
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run|-n)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown parameter: $1"
            show_help
            exit 1
            ;;
    esac
done

# Root privilege check
if [ "$(id -u)" -ne 0 ] && [ "${DRY_RUN}" = false ]; then
    log_error "This script must be executed as root (or with sudo). Aborting."
    exit 1
fi

log_info "Starting BLUSOC Step 05: Sensor Forwarders Configuration..."

# ------------------------------------------------------------------------------
# 1. Target Directories & File Handles
# ------------------------------------------------------------------------------
LOG_DIRS=(
    "/var/log/blusoc"
    "/var/log/suricata"
)

for dir in "${LOG_DIRS[@]}"; do
    execute_cmd "mkdir -p '${dir}' && chmod 0755 '${dir}'" "Ensure log directory ${dir} exists"
done

# Touch initial log files to avoid missing file errors
INIT_FILES=(
    "/var/log/blusoc/firewall.log"
    "/var/log/blusoc/waf.log"
    "/var/log/suricata/eve.json"
)

for file in "${INIT_FILES[@]}"; do
    execute_cmd "touch '${file}' && chmod 0640 '${file}'" "Ensure log file ${file} exists"
    if getent group ossec >/dev/null 2>&1; then
        execute_cmd "chown root:ossec '${file}'" "Ensure ossec group read access on ${file}"
    fi
done

# ------------------------------------------------------------------------------
# 2. Deploy rsyslog Ingestion Rules
# ------------------------------------------------------------------------------
RSYSLOG_CONF="/etc/rsyslog.d/10-blusoc-sensors.conf"
log_info "Configuring rsyslog sensor listeners at ${RSYSLOG_CONF}..."

RSYSLOG_CONTENT="# BLUSOC Edge Sensor Ingestion Listeners
# Listening on UDP 514, TCP 514, and TCP 6514

# UDP Syslog Listener (Barracuda / Sophos Default)
module(load=\"imudp\")
input(type=\"imudp\" port=\"514\")

# TCP Syslog Listener (Reliable Delivery)
module(load=\"imtcp\")
input(type=\"imtcp\" port=\"514\")
input(type=\"imtcp\" port=\"6514\")

# Message template preserving raw RFC 3164/5424 headers
template(name=\"BlusocLogFormat\" type=\"string\" string=\"%TIMESTAMP% %HOSTNAME% %syslogtag%%msg:::sp-if-no-1st-sp%%msg:::drop-last-lf%\\n\")

# Routing: Edge Firewall Telemetry (Barracuda CloudGen, Sophos Central)
if (\$programname == 'barracuda' or \$msg contains 'BFW' or \$msg contains 'device_name=\"sophos\"' or \$msg contains 'Sophos') then {
    action(type=\"omfile\" file=\"/var/log/blusoc/firewall.log\" template=\"BlusocLogFormat\")
    stop
}

# Routing: Cloudflare WAF Ingestion
if (\$msg contains 'Cloudflare' or \$msg contains 'waf_rule' or \$msg contains 'cf-ray') then {
    action(type=\"omfile\" file=\"/var/log/blusoc/waf.log\" template=\"BlusocLogFormat\")
    stop
}
"

if [ "${DRY_RUN}" = true ]; then
    log_dry "Would write configuration to ${RSYSLOG_CONF}."
else
    mkdir -p "$(dirname "${RSYSLOG_CONF}")"
    printf "%s" "${RSYSLOG_CONTENT}" > "${RSYSLOG_CONF}"
    chmod 0644 "${RSYSLOG_CONF}"
    log_success "rsyslog sensor configuration generated."
fi

# ------------------------------------------------------------------------------
# 3. Deploy logrotate Policy
# ------------------------------------------------------------------------------
LOGROTATE_CONF="/etc/logrotate.d/blusoc-sensors"
log_info "Configuring logrotate policy for BLUSOC sensors..."

LOGROTATE_CONTENT="/var/log/blusoc/*.log /var/log/suricata/eve.json {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root ossec
    sharedscripts
    postrotate
        /usr/lib/rsyslog/rsyslog-rotate >/dev/null 2>&1 || systemctl kill -s HUP rsyslog.service >/dev/null 2>&1 || true
    endscript
}
"

if [ "${DRY_RUN}" = true ]; then
    log_dry "Would write logrotate policy to ${LOGROTATE_CONF}."
else
    mkdir -p "$(dirname "${LOGROTATE_CONF}")"
    printf "%s" "${LOGROTATE_CONTENT}" > "${LOGROTATE_CONF}"
    chmod 0644 "${LOGROTATE_CONF}"
    log_success "Logrotate policy established."
fi

# ------------------------------------------------------------------------------
# 4. Restart and Verify rsyslog Service
# ------------------------------------------------------------------------------
log_info "Restarting rsyslog service..."
if command -v systemctl >/dev/null 2>&1; then
    execute_cmd "systemctl restart rsyslog.service || true" "Restart rsyslog daemon"
else
    log_warn "systemctl not available; skipping rsyslog service restart."
fi

# ------------------------------------------------------------------------------
# 5. Connect Suricata Socket / EVE JSON Stream
# ------------------------------------------------------------------------------
SURICATA_RUN_DIR="/var/run/suricata"
execute_cmd "mkdir -p '${SURICATA_RUN_DIR}' && chmod 0755 '${SURICATA_RUN_DIR}'" \
    "Ensure Suricata socket directory ${SURICATA_RUN_DIR} exists"

log_success "Step 05 completed successfully: Sensor forwarders and syslog listeners active."
