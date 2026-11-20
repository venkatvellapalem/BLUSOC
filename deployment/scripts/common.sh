#!/usr/bin/env bash
# Shared environment and command handling. Environment files are data, never sourced.
set -euo pipefail
DEPLOY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${DEPLOY_ROOT}/.." && pwd)"
DRY_RUN=false
log() { printf '[BLUSOC] %s\n' "$*"; }
fail() { printf '[ERROR] %s\n' "$*" >&2; exit 1; }

find_python() {
    local candidate
    for candidate in python3 python; do
        if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; sys.exit(sys.version_info < (3, 10))' >/dev/null 2>&1; then
            PYTHON="$candidate"; export PYTHON; return
        fi
    done
    fail "Python 3.10+ is required. On Ubuntu: sudo apt-get install python3"
}

load_environment() {
    find_python
    local file="${BLUSOC_ENV_FILE:-${DEPLOY_ROOT}/.env}"
    local flags=() exported key value
    if [ "$DRY_RUN" = true ]; then
        flags+=(--allow-placeholders)
        [ -f "$file" ] || file="${DEPLOY_ROOT}/.env.example"
    fi
    [ -f "$file" ] || fail "Missing environment file. Run: python3 deployment/config.py init"
    exported="$("$PYTHON" "${DEPLOY_ROOT}/config.py" export --env-file "$file" "${flags[@]}")" || return 1
    while IFS='=' read -r key value; do
        [ -z "$key" ] || export "$key=$value"
    done <<< "$exported"
    BLUSOC_ENV_FILE="$file"; export BLUSOC_ENV_FILE
}

require_host() {
    [ "$(id -u)" -eq 0 ] || fail "Run provisioning with sudo."
    [ -r /etc/os-release ] || fail "Ubuntu 22.04 or 24.04 is required."
    # OS-owned, root-managed metadata, not a user configuration file.
    . /etc/os-release
    [ "$ID" = ubuntu ] && [[ "$VERSION_ID" =~ ^(22\.04|24\.04)$ ]] || fail "Supported hosts: Ubuntu 22.04 / 24.04 LTS."
    command -v systemctl >/dev/null || fail "A systemd host is required."
    [ -d /run/systemd/system ] || fail "Run on a booted systemd host, not a bare container."
}

init_step() {
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --dry-run|-n) DRY_RUN=true; shift ;;
            --help|-h) printf 'Usage: bash %s [--dry-run]\n' "$0"; exit 0 ;;
            *) fail "Unknown step option: $1" ;;
        esac
    done
    load_environment
    if [ "$DRY_RUN" = false ]; then require_host; fi
}

run() {
    if [ "$DRY_RUN" = true ]; then
        printf '[PLAN]'; printf ' %q' "$@"; printf '\n'
    else
        "$@"
    fi
}

wazuh_group() {
    if [ "$DRY_RUN" = true ]; then printf wazuh; return; fi
    getent group wazuh >/dev/null || fail "Wazuh group is missing; run step 2 first."
    printf wazuh
}

compose() {
    docker compose --project-directory /opt/blusoc/iris --env-file /opt/blusoc/iris/compose.env -f /opt/blusoc/iris/docker-compose.yml "$@"
}
