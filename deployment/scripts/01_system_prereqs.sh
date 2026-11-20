#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"
init_step "$@"
if [ "$DRY_RUN" = true ]; then
    log "PLAN: install Ubuntu utilities, Python venv, Docker Engine and Compose v2; create service directories."
    log "PLAN: preserve existing workloads; no package upgrades or firewall changes."
    exit 0
fi
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends ca-certificates curl gnupg openssl jq python3 python3-venv rsyslog logrotate iproute2 util-linux
if ! command -v docker >/dev/null 2>&1; then
    install -d -m 0755 /etc/apt/keyrings
    curl -fsSL --retry 3 https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod 0644 /etc/apt/keyrings/docker.asc
    . /etc/os-release
    architecture="$(dpkg --print-architecture)"
    printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu %s stable\n' "$architecture" "$VERSION_CODENAME" > /etc/apt/sources.list.d/docker.list
    apt-get update
    apt-get install -y --no-install-recommends docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
docker compose version >/dev/null || fail "Docker exists without Compose v2. Install the matching Compose plugin before continuing."
compose_version="$(docker compose version --short | sed 's/^v//')"
dpkg --compare-versions "$compose_version" ge 2.30.0 || fail "Compose 2.30+ is required for literal environment-file handling."
systemctl enable --now docker.service
install -d -m 0755 /opt/blusoc /opt/blusoc/bin /var/log/blusoc
id blusoc >/dev/null 2>&1 || useradd --system --home-dir /var/lib/blusoc --create-home --shell /usr/sbin/nologin blusoc
install -d -o blusoc -g blusoc -m 0750 /var/lib/blusoc /var/log/blusoc/iris-status
log "Prerequisites ready."
