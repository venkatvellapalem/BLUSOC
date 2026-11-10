#!/usr/bin/env bash
# ==============================================================================
# BLUSOC Provisioning Step 04: Integration Middleware and Sync Daemon Binding
# ==============================================================================
# - Deploys custom-iris.py to /var/ossec/integrations/custom-iris
# - Sets permissions to 0750 owned by root:ossec
# - Configures Python runtime dependencies (requests, urllib3)
# - Deploys iris_status_daemon.py to /opt/blusoc/bin/
# - Installs and starts blusoc-sync.service systemd unit
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${DEPLOY_ROOT}/.." && pwd)"

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

BLUSOC Step 04: Bind Wazuh-to-IRIS integration script and deploy sync daemon service.

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

# Load environment configuration
ENV_FILE="${DEPLOY_ROOT}/.env"
if [ ! -f "${ENV_FILE}" ]; then
    ENV_FILE="${DEPLOY_ROOT}/.env.example"
    log_warn "No .env file found at ${DEPLOY_ROOT}/.env. Using defaults from .env.example."
fi

if [ -f "${ENV_FILE}" ]; then
    log_info "Loading environment variables from ${ENV_FILE}..."
    set -a
    # shellcheck disable=SC1090
    source "${ENV_FILE}"
    set +a
fi

log_info "Starting BLUSOC Step 04: Integration Middleware Binding..."

# ------------------------------------------------------------------------------
# 1. Install Python Dependencies
# ------------------------------------------------------------------------------
log_info "Verifying Python dependencies for integrations..."
if command -v pip3 >/dev/null 2>&1 || command -v pip >/dev/null 2>&1; then
    execute_cmd "pip3 install --quiet --upgrade requests urllib3 || pip install --quiet --upgrade requests urllib3" \
        "Install Python requests and urllib3 packages"
else
    log_warn "pip3 not found. Ensure python packages (requests, urllib3) are installed in the active environment."
fi

# ------------------------------------------------------------------------------
# 2. Deploy custom-iris Integration Binary
# ------------------------------------------------------------------------------
SRC_CUSTOM_IRIS="${REPO_ROOT}/integrations/custom-iris/custom-iris.py"
DEST_INTEGRATIONS_DIR="/var/ossec/integrations"
DEST_CUSTOM_IRIS="${DEST_INTEGRATIONS_DIR}/custom-iris"

log_info "Deploying custom-iris integration script..."
if [ -f "${SRC_CUSTOM_IRIS}" ]; then
    execute_cmd "mkdir -p '${DEST_INTEGRATIONS_DIR}'" "Ensure /var/ossec/integrations exists"
    execute_cmd "cp '${SRC_CUSTOM_IRIS}' '${DEST_CUSTOM_IRIS}'" "Copy custom-iris.py to ${DEST_CUSTOM_IRIS}"
    execute_cmd "cp '${SRC_CUSTOM_IRIS}' '${DEST_CUSTOM_IRIS}.py'" "Create .py alias for manual debugging"
    execute_cmd "chmod 0750 '${DEST_CUSTOM_IRIS}' '${DEST_CUSTOM_IRIS}.py'" "Set executable permissions to 0750"

    if getent group ossec >/dev/null 2>&1; then
        execute_cmd "chown root:ossec '${DEST_CUSTOM_IRIS}' '${DEST_CUSTOM_IRIS}.py'" "Set group ownership to ossec"
    fi
    log_success "Deployed ${DEST_CUSTOM_IRIS} (permissions: 0750, owner: root:ossec)."
else
    log_error "Source integration script not found: ${SRC_CUSTOM_IRIS}"
    exit 1
fi

# Copy example config if needed
SRC_IRIS_CONFIG="${REPO_ROOT}/integrations/custom-iris/config.example.json"
DEST_IRIS_CONFIG="/var/ossec/etc/custom-iris.json"
if [ -f "${SRC_IRIS_CONFIG}" ]; then
    execute_cmd "mkdir -p /var/ossec/etc" "Ensure /var/ossec/etc exists"
    execute_cmd "cp '${SRC_IRIS_CONFIG}' '${DEST_IRIS_CONFIG}' && chmod 0640 '${DEST_IRIS_CONFIG}'" \
        "Deploy integration configuration file"
    if getent group ossec >/dev/null 2>&1; then
        execute_cmd "chown root:ossec '${DEST_IRIS_CONFIG}'" "Set group ownership for config"
    fi
fi

# ------------------------------------------------------------------------------
# 3. Deploy iris_status_daemon Script
# ------------------------------------------------------------------------------
SRC_SYNC_DAEMON="${REPO_ROOT}/integrations/sync-daemon/iris_status_daemon.py"
DEST_BIN_DIR="/opt/blusoc/bin"
DEST_SYNC_DAEMON="${DEST_BIN_DIR}/iris_status_daemon.py"

log_info "Deploying DFIR-IRIS state sync daemon..."
if [ -f "${SRC_SYNC_DAEMON}" ]; then
    execute_cmd "mkdir -p '${DEST_BIN_DIR}'" "Ensure ${DEST_BIN_DIR} exists"
    execute_cmd "cp '${SRC_SYNC_DAEMON}' '${DEST_SYNC_DAEMON}'" "Copy sync daemon"
    execute_cmd "chmod 0755 '${DEST_SYNC_DAEMON}'" "Set daemon permissions to 0755"
    log_success "Sync daemon deployed to ${DEST_SYNC_DAEMON}."
else
    log_error "Source sync daemon not found: ${SRC_SYNC_DAEMON}"
    exit 1
fi

# ------------------------------------------------------------------------------
# 4. Deploy System Environment File for Daemon
# ------------------------------------------------------------------------------
SYS_ENV_DIR="/etc/blusoc"
SYS_ENV_FILE="${SYS_ENV_DIR}/blusoc.env"

log_info "Writing system environment file to ${SYS_ENV_FILE}..."
execute_cmd "mkdir -p '${SYS_ENV_DIR}' && chmod 0700 '${SYS_ENV_DIR}'" "Create secure /etc/blusoc directory"
execute_cmd "cp '${ENV_FILE}' '${SYS_ENV_FILE}' && chmod 0600 '${SYS_ENV_FILE}'" "Persist secure environment file"

# ------------------------------------------------------------------------------
# 5. Install and Enable blusoc-sync Systemd Service
# ------------------------------------------------------------------------------
SRC_SERVICE="${DEPLOY_ROOT}/systemd/blusoc-sync.service"
DEST_SERVICE="/etc/systemd/system/blusoc-sync.service"

log_info "Configuring systemd service for blusoc-sync..."
if [ -f "${SRC_SERVICE}" ]; then
    execute_cmd "cp '${SRC_SERVICE}' '${DEST_SERVICE}' && chmod 0644 '${DEST_SERVICE}'" \
        "Deploy systemd service unit"
    if command -v systemctl >/dev/null 2>&1; then
        execute_cmd "systemctl daemon-reload" "Reload systemd configuration"
        execute_cmd "systemctl enable blusoc-sync.service" "Enable blusoc-sync unit"
        execute_cmd "systemctl restart blusoc-sync.service || true" "Restart blusoc-sync service"
        log_success "blusoc-sync.service is configured and enabled."
    else
        log_warn "systemctl is not available; daemon service installed but not started."
    fi
else
    log_error "Systemd unit template not found: ${SRC_SERVICE}"
    exit 1
fi

log_success "Step 04 completed successfully: Integration middleware and background sync daemon bound."
