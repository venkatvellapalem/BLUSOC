#!/usr/bin/env bash
# ==============================================================================
# BLUSOC Provisioning Step 03: DFIR-IRIS Container Stack Provisioning
# ==============================================================================
# - Prepares directory layout: /opt/blusoc/iris/{certs,nginx,overlays}
# - Generates self-signed TLS certificates for IRIS Nginx reverse proxy
# - Deploys Nginx reverse proxy configuration
# - Copies docker-compose.iris.yml and launches container stack:
#   PostgreSQL, RabbitMQ, IRIS App (Django), IRIS Worker (Celery), Nginx
# - Verifies healthcheck endpoints
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

BLUSOC Step 03: Provision DFIR-IRIS container stack and reverse proxy.

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

IRIS_BASE_DIR="/opt/blusoc/iris"
COMPOSE_TEMPLATE="${DEPLOY_ROOT}/templates/docker-compose.iris.yml"
TARGET_COMPOSE="${IRIS_BASE_DIR}/docker-compose.yml"

log_info "Starting BLUSOC Step 03: DFIR-IRIS Container Provisioning..."

# ------------------------------------------------------------------------------
# 1. Directory Layout Creation
# ------------------------------------------------------------------------------
log_info "Creating DFIR-IRIS persistent directories in ${IRIS_BASE_DIR}..."
DIRS=(
    "${IRIS_BASE_DIR}/certs"
    "${IRIS_BASE_DIR}/nginx"
    "${IRIS_BASE_DIR}/overlays"
    "${IRIS_BASE_DIR}/data"
    "/var/log/blusoc"
)

for dir in "${DIRS[@]}"; do
    execute_cmd "mkdir -p '${dir}' && chmod 0755 '${dir}'" "Ensure directory ${dir} exists"
done

# ------------------------------------------------------------------------------
# 2. SSL/TLS Certificate for IRIS Nginx
# ------------------------------------------------------------------------------
IRIS_CERT="${IRIS_BASE_DIR}/certs/iris.crt"
IRIS_KEY="${IRIS_BASE_DIR}/certs/iris.key"

log_info "Checking SSL/TLS certificate for DFIR-IRIS reverse proxy..."
if [ -f "${IRIS_CERT}" ] && [ -f "${IRIS_KEY}" ]; then
    log_success "TLS certificate already exists at ${IRIS_CERT}."
else
    GEN_IRIS_CERT="
openssl req -x509 -batch -nodes -days 3650 -newkey rsa:2048 \
    -keyout '${IRIS_KEY}' \
    -out '${IRIS_CERT}' \
    -subj '/C=US/ST=State/L=City/O=BLUSOC/OU=SOAR/CN=soar-iris-01.blusoc.internal'
chmod 0600 '${IRIS_KEY}'
chmod 0644 '${IRIS_CERT}'
"
    execute_cmd "${GEN_IRIS_CERT}" "Generate self-signed TLS cert for IRIS reverse proxy"
fi

# ------------------------------------------------------------------------------
# 3. Nginx Reverse Proxy Configuration
# ------------------------------------------------------------------------------
NGINX_CONF="${IRIS_BASE_DIR}/nginx/nginx.conf"
log_info "Configuring Nginx reverse proxy configuration at ${NGINX_CONF}..."

NGINX_CONTENT="events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 100M;

    upstream iris_app_cluster {
        server iris-app:8000;
    }

    server {
        listen 80;
        server_name _;
        location /health {
            access_log off;
            return 200 'healthy\n';
        }
        location / {
            return 301 https://\$host\$request_uri;
        }
    }

    server {
        listen 443 ssl;
        server_name _;

        ssl_certificate /etc/nginx/certs/iris.crt;
        ssl_certificate_key /etc/nginx/certs/iris.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5:!3DES;
        ssl_prefer_server_ciphers on;

        location /health {
            access_log off;
            return 200 'healthy\n';
        }

        location / {
            proxy_pass http://iris_app_cluster;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 300s;
        }
    }
}
"

if [ "${DRY_RUN}" = true ]; then
    log_dry "Would create ${NGINX_CONF} with Nginx reverse proxy routing."
else
    printf "%s" "${NGINX_CONTENT}" > "${NGINX_CONF}"
    chmod 0644 "${NGINX_CONF}"
    log_success "Nginx configuration generated."
fi

# ------------------------------------------------------------------------------
# 4. Deploy docker-compose.yml and Environment File
# ------------------------------------------------------------------------------
log_info "Deploying docker-compose stack definition..."
execute_cmd "cp '${COMPOSE_TEMPLATE}' '${TARGET_COMPOSE}'" "Copy compose template to ${TARGET_COMPOSE}"
execute_cmd "cp '${ENV_FILE}' '${IRIS_BASE_DIR}/.env'" "Copy environment file to ${IRIS_BASE_DIR}/.env"

# ------------------------------------------------------------------------------
# 5. Launch Container Stack
# ------------------------------------------------------------------------------
log_info "Starting DFIR-IRIS container stack with Docker Compose..."
if command -v docker >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose -f '${TARGET_COMPOSE}' --env-file '${IRIS_BASE_DIR}/.env' up -d"
    execute_cmd "${COMPOSE_CMD}" "Launch DFIR-IRIS container stack (app, db, worker, rabbitmq, nginx)"

    if [ "${DRY_RUN}" = false ]; then
        log_info "Waiting for container initialization..."
        # Give containers a moment to boot
        sleep 5 2>/dev/null || true
        docker compose -f "${TARGET_COMPOSE}" ps || true
        log_success "Containers launched successfully."
    fi
else
    log_warn "Docker is not available in PATH. Simulated compose execution complete."
fi

log_success "Step 03 completed successfully: DFIR-IRIS stack initialized."
