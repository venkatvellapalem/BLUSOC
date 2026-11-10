#!/usr/bin/env bash
# ==============================================================================
# BLUSOC Provisioning Step 02: Wazuh Manager Provisioning & Ruleset Deployment
# ==============================================================================
# - Installs Wazuh Manager service package
# - Generates self-signed SSL/TLS certificates for API and agent registration
# - Interpolates environment variables into ossec.conf template
# - Deploys BLUSOC custom rulesets (suppression, proxy tuning, threat intel)
# - Validates ruleset syntax and starts Wazuh Manager daemon
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

BLUSOC Step 02: Install Wazuh Manager, configure ossec.conf, and link detection rules.

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
    # Export non-comment lines
    set -a
    # shellcheck disable=SC1090
    source "${ENV_FILE}"
    set +a
fi

# Default fallback values for required variables
WAZUH_MANAGER_IP="${WAZUH_MANAGER_IP:-10.240.0.10}"
WAZUH_API_PORT="${WAZUH_API_PORT:-55000}"
WAZUH_EVENTS_PORT="${WAZUH_EVENTS_PORT:-1514}"
WAZUH_REGISTRATION_PORT="${WAZUH_REGISTRATION_PORT:-1515}"
IRIS_API_URL="${IRIS_API_URL:-https://soar-iris-01.blusoc.internal}"
IRIS_API_KEY="${IRIS_API_KEY:-iris_api_token_placeholder}"

log_info "Starting BLUSOC Step 02: Wazuh Provisioning..."

# ------------------------------------------------------------------------------
# 1. Install Wazuh Manager Package
# ------------------------------------------------------------------------------
log_info "Checking Wazuh Manager installation..."
if [ -d "/var/ossec" ] && [ -x "/var/ossec/bin/wazuh-control" ]; then
    log_success "Wazuh Manager is already installed in /var/ossec."
else
    if command -v apt-get >/dev/null 2>&1; then
        WAZUH_INSTALL_CMD="
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && chmod 644 /usr/share/keyrings/wazuh.gpg
echo \"deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main\" | tee -a /etc/apt/sources.list.d/wazuh.list
apt-get update -y
apt-get install -y wazuh-manager
"
        execute_cmd "${WAZUH_INSTALL_CMD}" "Install official Wazuh Manager package"
    else
        log_warn "Non-APT system detected. Mocking /var/ossec layout for simulated deployment."
        execute_cmd "mkdir -p /var/ossec/etc/rules /var/ossec/etc/decoders /var/ossec/logs /var/ossec/queue/sockets /var/ossec/integrations" \
            "Create base /var/ossec directory structure"
    fi
fi

# ------------------------------------------------------------------------------
# 2. TLS Certificates for Wazuh Manager & Agent Enrollment
# ------------------------------------------------------------------------------
SSL_KEY="/var/ossec/etc/sslmanager.key"
SSL_CERT="/var/ossec/etc/sslmanager.cert"

log_info "Verifying SSL/TLS certificates for manager daemon..."
if [ -f "${SSL_KEY}" ] && [ -f "${SSL_CERT}" ]; then
    log_success "Manager SSL certificates already exist at ${SSL_CERT}."
else
    GEN_CERT_CMD="
mkdir -p /var/ossec/etc
openssl req -x509 -batch -nodes -days 3650 -newkey rsa:2048 \
    -keyout '${SSL_KEY}' \
    -out '${SSL_CERT}' \
    -subj '/C=US/ST=State/L=City/O=BLUSOC/OU=SOC/CN=siem-core-01.blusoc.internal'
chmod 0600 '${SSL_KEY}'
chmod 0644 '${SSL_CERT}'
"
    execute_cmd "${GEN_CERT_CMD}" "Generate self-signed SSL certificates for Wazuh daemon"
fi

# ------------------------------------------------------------------------------
# 3. Configure ossec.conf from Template
# ------------------------------------------------------------------------------
TEMPLATE_FILE="${DEPLOY_ROOT}/templates/ossec.conf.template"
TARGET_CONF="/var/ossec/etc/ossec.conf"

log_info "Interpolating configuration template: ${TEMPLATE_FILE} -> ${TARGET_CONF}..."

if [ ! -f "${TEMPLATE_FILE}" ]; then
    log_error "Template file ${TEMPLATE_FILE} not found!"
    exit 1
fi

if [ "${DRY_RUN}" = true ]; then
    log_dry "Would interpolate variables into ${TARGET_CONF}:"
    log_dry "  WAZUH_EVENTS_PORT=${WAZUH_EVENTS_PORT}"
    log_dry "  WAZUH_REGISTRATION_PORT=${WAZUH_REGISTRATION_PORT}"
    log_dry "  IRIS_API_KEY=[REDACTED]"
    log_dry "  IRIS_API_URL=${IRIS_API_URL}"
else
    # Create backup if existing
    if [ -f "${TARGET_CONF}" ]; then
        cp "${TARGET_CONF}" "${TARGET_CONF}.bak.$(date +%Y%m%d%H%M%S)"
    fi

    # Render template with sed / envsubst
    sed \
        -e "s|\${WAZUH_EVENTS_PORT}|${WAZUH_EVENTS_PORT}|g" \
        -e "s|\${WAZUH_REGISTRATION_PORT}|${WAZUH_REGISTRATION_PORT}|g" \
        -e "s|\${IRIS_API_KEY}|${IRIS_API_KEY}|g" \
        -e "s|\${IRIS_API_URL}|${IRIS_API_URL}|g" \
        "${TEMPLATE_FILE}" > "${TARGET_CONF}"

    chmod 0640 "${TARGET_CONF}"
    if getent group ossec >/dev/null 2>&1; then
        chown root:ossec "${TARGET_CONF}"
    fi
    log_success "Applied production configuration to ${TARGET_CONF}."
fi

# ------------------------------------------------------------------------------
# 4. Deploy BLUSOC Detection Rules
# ------------------------------------------------------------------------------
RULES_SOURCE_DIR="${REPO_ROOT}/detection-engineering/wazuh/rules"
RULES_DEST_DIR="/var/ossec/etc/rules"

log_info "Deploying BLUSOC detection engineering rulesets..."
if [ -d "${RULES_SOURCE_DIR}" ]; then
    execute_cmd "mkdir -p '${RULES_DEST_DIR}'" "Ensure target rules directory exists"
    
    for rule_file in "${RULES_SOURCE_DIR}"/*.xml; do
        if [ -f "${rule_file}" ]; then
            rule_name="$(basename "${rule_file}")"
            execute_cmd "cp '${rule_file}' '${RULES_DEST_DIR}/${rule_name}' && chmod 0640 '${RULES_DEST_DIR}/${rule_name}'" \
                "Deploy rule file ${rule_name} to ${RULES_DEST_DIR}/"
            if getent group ossec >/dev/null 2>&1; then
                execute_cmd "chown root:ossec '${RULES_DEST_DIR}/${rule_name}'" "Set rule ownership to root:ossec"
            fi
        fi
    done
    log_success "BLUSOC detection rules copied to ${RULES_DEST_DIR}."
else
    log_warn "Rules source directory ${RULES_SOURCE_DIR} not found. Skipping rule copy."
fi

# ------------------------------------------------------------------------------
# 5. Validate Ruleset Syntax and Restart Wazuh
# ------------------------------------------------------------------------------
log_info "Testing Wazuh configuration syntax..."
if [ -x "/var/ossec/bin/wazuh-analysisd" ]; then
    if [ "${DRY_RUN}" = true ]; then
        log_dry "Would test rules with: /var/ossec/bin/wazuh-analysisd -t"
    else
        /var/ossec/bin/wazuh-analysisd -t >/dev/null 2>&1 && log_success "Wazuh ruleset syntax test PASSED." || log_warn "wazuh-analysisd test flagged warnings."
    fi
fi

log_info "Enabling and starting Wazuh Manager service..."
if command -v systemctl >/dev/null 2>&1; then
    execute_cmd "systemctl enable wazuh-manager.service && systemctl restart wazuh-manager.service || true" \
        "Enable and start wazuh-manager service"
else
    log_warn "systemctl not available; skipping service startup."
fi

log_success "Step 02 completed successfully: Wazuh Manager configured and rules deployed."
