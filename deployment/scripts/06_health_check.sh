#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"
init_step "$@"
if [ "$DRY_RUN" = true ]; then
    log "PLAN: check installed Wazuh configuration, required service states, Compose health, database, authenticated IRIS API and listener ports."
    log "No health result is asserted in dry-run mode."
    exit 0
fi
failures=0
check() {
    local label="$1"; shift
    if "$@"; then printf '[PASS] %s\n' "$label"
    else printf '[FAIL] %s\n' "$label"; failures=$((failures + 1)); fi
}
check "Wazuh manager active" systemctl is-active --quiet wazuh-manager.service
check "Wazuh rules load" /var/ossec/bin/wazuh-analysisd -t
check "Status monitor active" systemctl is-active --quiet blusoc-sync.service
check "Rsyslog active" systemctl is-active --quiet rsyslog.service
check "Integration executable installed" test -x /var/ossec/integrations/custom-iris
check "PostgreSQL accepting connections" compose exec -T iris-db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"
for service in iris-db iris-rabbitmq iris-app iris-worker iris-nginx; do
    container="$(compose ps -q "$service")"
    if [ -n "$container" ]; then
        state="$(docker inspect --format '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' "$container")"
        if [[ "$state" == running* ]] && [[ "$state" != *unhealthy* ]] && [[ "$state" != *starting* ]]; then
            printf '[PASS] %s: %s\n' "$service" "$state"
        else
            printf '[FAIL] %s: %s\n' "$service" "$state"; failures=$((failures + 1))
        fi
    else printf '[FAIL] %s is missing\n' "$service"; failures=$((failures + 1)); fi
done
check "Authenticated IRIS API" "$PYTHON" "${DEPLOY_ROOT}/config.py" probe-iris --env-file "$BLUSOC_ENV_FILE"
for port in "$WAZUH_EVENTS_PORT" "$WAZUH_REGISTRATION_PORT" "$SYSLOG_PORT"; do
    if ss -H -ltn "sport = :$port" | grep -q .; then printf '[PASS] TCP listener %s\n' "$port"
    else printf '[FAIL] TCP listener %s\n' "$port"; failures=$((failures + 1)); fi
done
if ss -H -lun "sport = :$SYSLOG_PORT" | grep -q .; then printf '[PASS] UDP syslog listener\n'
else printf '[FAIL] UDP syslog listener\n'; failures=$((failures + 1)); fi
[ "$failures" -eq 0 ] || fail "$failures health check(s) failed."
log "All required readiness checks passed. Send a controlled test alert to verify your source-specific ingestion."
