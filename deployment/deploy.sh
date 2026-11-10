#!/usr/bin/env bash
# ==============================================================================
# BLUSOC Zero-Touch Server Deployment Orchestrator
# ==============================================================================
# Master orchestrator for provisioning a production-grade SOC server.
# Sequentially executes modular provisioning steps:
#   01: System Prerequisites & Kernel Tuning
#   02: Wazuh SIEM Manager Provisioning & Ruleset Linking
#   03: DFIR-IRIS Container Stack & Nginx Reverse Proxy
#   04: Integration Middleware (custom-iris) & Sync Daemon
#   05: Sensor Forwarders & Syslog Ingestion Listeners
#   06: End-to-End System Health Diagnostics
# ==============================================================================

set -eo pipefail

DEPLOY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="${DEPLOY_ROOT}/scripts"

# ANSI color codes
COLOR_RESET="\033[0m"
COLOR_BOLD="\033[1m"
COLOR_CYAN="\033[36m"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_RED="\033[31m"
COLOR_MAGENTA="\033[35m"

# Execution flags
DRY_RUN=false
TARGET_STEP=""
FROM_STEP=1
NON_INTERACTIVE=false

log_info() {
    printf "%b[INFO]%b [%s] %s\n" "${COLOR_CYAN}" "${COLOR_RESET}" "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

log_step() {
    printf "\n%b[%s]%b %b%s%b\n" "${COLOR_MAGENTA}" "$1" "${COLOR_RESET}" "${COLOR_BOLD}" "$2" "${COLOR_RESET}"
}

log_success() {
    printf "%b[SUCCESS]%b [%s] %s\n" "${COLOR_GREEN}" "${COLOR_RESET}" "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

log_warn() {
    printf "%b[WARN]%b [%s] %s\n" "${COLOR_YELLOW}" "${COLOR_RESET}" "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

log_error() {
    printf "%b[ERROR]%b [%s] %s\n" "${COLOR_RED}" "${COLOR_RESET}" "$(date '+%Y-%m-%d %H:%M:%S')" "$1" >&2
}

print_banner() {
    cat << "EOF"
================================================================================
  ____  _     _   _ ____   ___   ____ 
 | __ )| |   | | | / ___| / _ \ / ___|   BLUSOC Blue Team Engineering
 |  _ \| |   | | | \___ \| | | | |       Zero-Touch Server Orchestrator
 | |_) | |___| |_| |___) | |_| | |___    Target: Ubuntu 22.04 / 24.04 LTS
 |____/|_____|\___/|____/ \___/ \____|   Security Operations Architecture
================================================================================
EOF
}

show_help() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS]

Master deployment script for the BLUSOC server environment.

Options:
  --dry-run, -n              Simulate execution without modifying the host system
  --step <1-6>               Execute only the specified provisioning step
  --from-step <1-6>          Execute from the specified step through step 6
  --non-interactive, -y      Skip confirmation prompts during deployment
  --help, -h                 Display this help manual and exit

Provisioning Steps:
  1: System Prerequisites (sysctl limits, Docker, Python 3.11+, uv, jq)
  2: Wazuh Manager Provisioning (manager install, certs, ossec.conf, rulesets)
  3: DFIR-IRIS Stack (PostgreSQL, RabbitMQ, IRIS App, Celery, Nginx)
  4: Integration Middleware (custom-iris wrapper, sync daemon service)
  5: Sensor Forwarders (syslog listeners on 514/6514, Suricata hooks)
  6: Health Diagnostics (end-to-end API, DB, and pipeline verification)

Examples:
  ./deploy.sh --dry-run
  ./deploy.sh --step 2
  ./deploy.sh --from-step 3 --non-interactive
EOF
}

cleanup_on_error() {
    local exit_code=$?
    if [ ${exit_code} -ne 0 ]; then
        printf "\n"
        log_error "Deployment halted prematurely with exit code ${exit_code}."
        log_error "Review log output above or inspect /var/log/blusoc/ for error traces."
        log_warn "To test without making changes, re-run with: ./deploy.sh --dry-run"
    fi
    exit ${exit_code}
}

trap cleanup_on_error EXIT

# Parse CLI options
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run|-n)
            DRY_RUN=true
            shift
            ;;
        --step)
            TARGET_STEP="$2"
            shift 2
            ;;
        --from-step)
            FROM_STEP="$2"
            shift 2
            ;;
        --non-interactive|-y)
            NON_INTERACTIVE=true
            shift
            ;;
        --help|-h)
            print_banner
            show_help
            exit 0
            ;;
        *)
            log_error "Unrecognized argument: $1"
            show_help
            exit 1
            ;;
    esac
done

print_banner

# Step range validation
if [ -n "${TARGET_STEP}" ]; then
    if ! [[ "${TARGET_STEP}" =~ ^[1-6]$ ]]; then
        log_error "Invalid step '${TARGET_STEP}'. Must be an integer between 1 and 6."
        exit 1
    fi
fi

if ! [[ "${FROM_STEP}" =~ ^[1-6]$ ]]; then
    log_error "Invalid from-step '${FROM_STEP}'. Must be an integer between 1 and 6."
    exit 1
fi

# Root privilege validation
if [ "$(id -u)" -ne 0 ]; then
    if [ "${DRY_RUN}" = true ]; then
        log_warn "Running without root privileges in dry-run mode (allowed for simulation)."
    else
        log_error "Root permissions are required to deploy system configurations and services."
        log_error "Please run with sudo: sudo ./deploy.sh"
        exit 1
    fi
fi

# Environment file validation
ENV_FILE="${DEPLOY_ROOT}/.env"
ENV_EXAMPLE="${DEPLOY_ROOT}/.env.example"

if [ ! -f "${ENV_FILE}" ]; then
    if [ -f "${ENV_EXAMPLE}" ]; then
        if [ "${DRY_RUN}" = true ]; then
            log_warn "No .env found. Using .env.example directly for dry-run simulation."
            ENV_FILE="${ENV_EXAMPLE}"
        else
            log_warn "No .env found. Generating template from .env.example..."
            cp "${ENV_EXAMPLE}" "${ENV_FILE}"
            log_info "Created ${ENV_FILE}. In production, review and edit before deployment."
        fi
    else
        log_error "Neither .env nor .env.example exists in ${DEPLOY_ROOT}!"
        exit 1
    fi
fi

# Step definitions
STEP_NAMES=(
    "System Prerequisites and Kernel Parameters"
    "Wazuh SIEM Manager Provisioning & Rulesets"
    "DFIR-IRIS Container Stack & Nginx Proxy"
    "Integration Middleware & Sync Daemon"
    "Sensor Forwarders & Syslog Listeners"
    "End-to-End System Health Diagnostics"
)

STEP_SCRIPTS=(
    "${SCRIPTS_DIR}/01_system_prereqs.sh"
    "${SCRIPTS_DIR}/02_wazuh_provision.sh"
    "${SCRIPTS_DIR}/03_iris_provision.sh"
    "${SCRIPTS_DIR}/04_bind_integrations.sh"
    "${SCRIPTS_DIR}/05_sensor_forwarders.sh"
    "${SCRIPTS_DIR}/06_health_check.sh"
)

# Confirmation prompt for interactive runs
if [ "${NON_INTERACTIVE}" = false ] && [ "${DRY_RUN}" = false ]; then
    printf "\n"
    log_warn "This will provision/update system services, kernel parameters, and containers."
    printf "Are you sure you want to proceed? [y/N]: "
    read -r response
    if [[ ! "${response}" =~ ^[yY](es)?$ ]]; then
        log_info "Deployment cancelled by user."
        exit 0
    fi
fi

TOTAL_START=$(date +%s)
PASSED_STEPS=0

log_info "Initiating deployment pipeline (Dry-Run: ${DRY_RUN})..."

for i in {0..5}; do
    step_num=$((i + 1))
    step_name="${STEP_NAMES[$i]}"
    step_script="${STEP_SCRIPTS[$i]}"

    # Single-step filter
    if [ -n "${TARGET_STEP}" ] && [ "${step_num}" -ne "${TARGET_STEP}" ]; then
        continue
    fi

    # From-step filter
    if [ -z "${TARGET_STEP}" ] && [ "${step_num}" -lt "${FROM_STEP}" ]; then
        continue
    fi

    log_step "STEP ${step_num}/6" "${step_name}"

    if [ ! -f "${step_script}" ]; then
        log_error "Provisioning script not found: ${step_script}"
        exit 1
    fi

    STEP_START=$(date +%s)
    SCRIPT_FLAGS=()
    if [ "${DRY_RUN}" = true ]; then
        SCRIPT_FLAGS+=("--dry-run")
    fi

    # Execute modular script
    bash "${step_script}" "${SCRIPT_FLAGS[@]}"

    STEP_END=$(date +%s)
    STEP_DURATION=$((STEP_END - STEP_START))
    log_success "Step ${step_num} (${step_name}) completed in ${STEP_DURATION}s."
    PASSED_STEPS=$((PASSED_STEPS + 1))
done

TOTAL_END=$(date +%s)
TOTAL_DURATION=$((TOTAL_END - TOTAL_START))

printf "\n"
printf "================================================================================\n"
log_success "BLUSOC deployment pipeline completed: ${PASSED_STEPS} step(s) in ${TOTAL_DURATION}s."
printf "================================================================================\n\n"

