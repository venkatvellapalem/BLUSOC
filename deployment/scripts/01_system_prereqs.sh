#!/usr/bin/env bash
# ==============================================================================
# BLUSOC Provisioning Step 01: System Prerequisites and Kernel Tuning
# ==============================================================================
# - Configures sysctl limits (vm.max_map_count, fs.file-max, somaxconn)
# - Configures PAM security limits (nofile, nproc)
# - Installs core toolchain: Docker Engine, Docker Compose v2, Python 3.11+,
#   uv, jq, curl, openssl, rsyslog, netcat-openbsd
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

BLUSOC Step 01: Configure system limits and install runtime prerequisites.

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

log_info "Starting BLUSOC Step 01: System Prerequisites and Kernel Tuning..."

# ------------------------------------------------------------------------------
# 1. Kernel sysctl Tuning
# ------------------------------------------------------------------------------
SYSCTL_FILE="/etc/sysctl.d/99-blusoc.conf"
log_info "Configuring kernel sysctl parameters for SIEM and container workloads..."

SYSCTL_CONFIG="# BLUSOC SIEM and Search Engine Kernel Parameters
vm.max_map_count=262144
fs.file-max=65536
fs.inotify.max_user_watches=524288
net.core.somaxconn=1024
net.ipv4.ip_forward=1
"

if [ "${DRY_RUN}" = true ]; then
    log_dry "Would write configuration to ${SYSCTL_FILE}:"
    printf "%s\n" "${SYSCTL_CONFIG}" | while IFS= read -r line; do log_dry "  ${line}"; done
    log_dry "Would run: sysctl --system"
else
    mkdir -p "$(dirname "${SYSCTL_FILE}")"
    printf "%s" "${SYSCTL_CONFIG}" > "${SYSCTL_FILE}"
    sysctl --system >/dev/null 2>&1 || sysctl -p "${SYSCTL_FILE}" >/dev/null 2>&1 || log_warn "sysctl reload warning (container environment detected)."
    log_success "Kernel parameters applied and persisted to ${SYSCTL_FILE}."
fi

# ------------------------------------------------------------------------------
# 2. Security Limits (ulimit)
# ------------------------------------------------------------------------------
LIMITS_FILE="/etc/security/limits.d/99-blusoc.conf"
log_info "Configuring system descriptor and process limits..."

LIMITS_CONFIG="# BLUSOC System Resource Limits
* soft nofile 65536
* hard nofile 65536
* soft nproc 4096
* hard nproc 4096
root soft nofile 65536
root hard nofile 65536
"

if [ "${DRY_RUN}" = true ]; then
    log_dry "Would write limits to ${LIMITS_FILE}:"
    printf "%s\n" "${LIMITS_CONFIG}" | while IFS= read -r line; do log_dry "  ${line}"; done
else
    mkdir -p "$(dirname "${LIMITS_FILE}")"
    printf "%s" "${LIMITS_CONFIG}" > "${LIMITS_FILE}"
    log_success "Resource limits applied to ${LIMITS_FILE}."
fi

# ------------------------------------------------------------------------------
# 3. Base Utilities & APT Package Installation
# ------------------------------------------------------------------------------
REQUIRED_PKGS=("curl" "wget" "jq" "openssl" "rsyslog" "git" "ca-certificates" "gnupg" "lsb-release")

log_info "Checking essential utility packages..."
if command -v apt-get >/dev/null 2>&1; then
    MISSING_PKGS=()
    for pkg in "${REQUIRED_PKGS[@]}"; do
        if ! dpkg -s "${pkg}" >/dev/null 2>&1; then
            MISSING_PKGS+=("${pkg}")
        fi
    done

    if [ ${#MISSING_PKGS[@]} -gt 0 ]; then
        execute_cmd "apt-get update -y && apt-get install -y --no-install-recommends ${MISSING_PKGS[*]}" \
            "Install missing system utilities: ${MISSING_PKGS[*]}"
    else
        log_success "All base system utilities are already installed."
    fi
else
    log_warn "Non-APT package manager detected. Please ensure: ${REQUIRED_PKGS[*]} are installed."
fi

# ------------------------------------------------------------------------------
# 4. Python 3.11+ Environment
# ------------------------------------------------------------------------------
log_info "Verifying Python 3 runtime..."
PYTHON_INSTALLED=false
PY_CMD=""
if python3 -c 'import sys' >/dev/null 2>&1; then
    PY_CMD="python3"
elif python -c 'import sys' >/dev/null 2>&1; then
    PY_CMD="python"
fi

if [ -n "${PY_CMD}" ]; then
    PY_VER="$(${PY_CMD} -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)"
    if [ -n "${PY_VER}" ]; then
        PY_MAJOR="$(echo "${PY_VER}" | cut -d. -f1)"
        PY_MINOR="$(echo "${PY_VER}" | cut -d. -f2)"
        if [ "${PY_MAJOR}" -ge 3 ] 2>/dev/null && [ "${PY_MINOR}" -ge 11 ] 2>/dev/null; then
            log_success "Python ${PY_VER} satisfies requirement (>= 3.11)."
            PYTHON_INSTALLED=true
        else
            log_warn "Python version is ${PY_VER}, requires >= 3.11."
        fi
    fi
fi

if [ "${PYTHON_INSTALLED}" = false ] && command -v apt-get >/dev/null 2>&1; then
    execute_cmd "apt-get update -y && apt-get install -y python3 python3-pip python3-venv" \
        "Install Python 3 environment"
fi

# ------------------------------------------------------------------------------
# 5. uv Fast Python Package Manager
# ------------------------------------------------------------------------------
log_info "Verifying uv package manager..."
if command -v uv >/dev/null 2>&1; then
    log_success "uv is already installed: $(uv --version 2>/dev/null || echo 'installed')"
else
    execute_cmd "curl -LsSf https://astral.sh/uv/install.sh | sh" \
        "Install uv Python package installer"
    if [ -f "${HOME}/.cargo/bin/uv" ]; then
        execute_cmd "ln -sf ${HOME}/.cargo/bin/uv /usr/local/bin/uv" "Symlink uv to /usr/local/bin/uv"
    fi
fi

# ------------------------------------------------------------------------------
# 6. Docker Engine and Docker Compose v2
# ------------------------------------------------------------------------------
log_info "Verifying Docker Engine and Compose v2..."
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    log_success "Docker Engine and Docker Compose v2 are present: $(docker --version)"
else
    if command -v apt-get >/dev/null 2>&1; then
        DOCKER_INSTALL_SCRIPT="
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
chmod a+r /etc/apt/keyrings/docker.gpg
echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(. /etc/os-release && echo \"\$VERSION_CODENAME\") stable\" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker || true
"
        execute_cmd "${DOCKER_INSTALL_SCRIPT}" "Install Docker Engine and Docker Compose Plugin"
    else
        log_warn "Please ensure Docker Engine and Docker Compose v2 are installed manually."
    fi
fi

# ------------------------------------------------------------------------------
# 7. Base Directory Layout
# ------------------------------------------------------------------------------
log_info "Creating standard BLUSOC operational directories..."
DIRS_TO_CREATE=(
    "/opt/blusoc/bin"
    "/opt/blusoc/etc"
    "/opt/blusoc/iris/overlays"
    "/opt/blusoc/iris/certs"
    "/opt/blusoc/iris/nginx"
    "/var/log/blusoc"
    "/var/ossec/integrations"
)

for dir in "${DIRS_TO_CREATE[@]}"; do
    execute_cmd "mkdir -p ${dir} && chmod 0755 ${dir}" "Ensure directory ${dir} exists"
done

log_success "Step 01 completed successfully: System prerequisites and kernel parameters configured."
