#!/usr/bin/env bash
# Provision a dedicated Ubuntu host. --dry-run and --check make no host changes.
set -euo pipefail
DEPLOY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/common.sh
source "${DEPLOY_ROOT}/scripts/common.sh"
TARGET_STEP=""
FROM_STEP=1
CHECK_ONLY=false
NON_INTERACTIVE=false
FROM_SET=false
usage() {
    cat <<'HELP'
Usage: bash deployment/deploy.sh [options]
  --dry-run, -n          Print the plan; example placeholders are allowed
  --check               Validate actual configuration without provisioning
  --env-file PATH       Use a specific environment file
  --step 1-6            Run one step
  --from-step 1-6       Resume from a step
  --non-interactive, -y Skip the host-change confirmation
  --help, -h            Show help
Steps: 1 prerequisites; 2 Wazuh; 3 IRIS; 4 middleware; 5 syslog; 6 health
HELP
}
while [ "$#" -gt 0 ]; do
    case "$1" in
        --dry-run|-n) DRY_RUN=true; shift ;;
        --check) CHECK_ONLY=true; shift ;;
        --non-interactive|-y) NON_INTERACTIVE=true; shift ;;
        --step|--from-step|--env-file)
            [ "$#" -ge 2 ] && [[ "$2" != --* ]] || fail "$1 requires a value"
            case "$1" in
                --step) TARGET_STEP="$2" ;;
                --from-step) FROM_STEP="$2"; FROM_SET=true ;;
                --env-file) BLUSOC_ENV_FILE="$2"; export BLUSOC_ENV_FILE ;;
            esac
            shift 2 ;;
        --help|-h) usage; exit 0 ;;
        *) usage; fail "Unknown option: $1" ;;
    esac
done
[ -z "$TARGET_STEP" ] || [[ "$TARGET_STEP" =~ ^[1-6]$ ]] || fail "--step must be 1-6"
[[ "$FROM_STEP" =~ ^[1-6]$ ]] || fail "--from-step must be 1-6"
if [ -n "$TARGET_STEP" ] && [ "$FROM_SET" = true ]; then fail "--step and --from-step cannot be combined"; fi
if [ "$CHECK_ONLY" = true ] && [ "$DRY_RUN" = true ]; then fail "--check validates real settings; use --dry-run separately"; fi
load_environment
if [ "$CHECK_ONLY" = true ]; then log "Configuration passed. No host changes made."; exit 0; fi
if [ "$DRY_RUN" = false ]; then
    require_host
    if [ "$NON_INTERACTIVE" = false ]; then
        printf 'Provision this dedicated Ubuntu host? [y/N] '
        read -r answer
        [[ "$answer" =~ ^[yY]([eE][sS])?$ ]] || { log "Cancelled."; exit 0; }
    fi
    install -d -m 0755 /opt/blusoc
    exec 9>/opt/blusoc/deploy.lock
    flock -n 9 || fail "Another BLUSOC deployment is running."
fi
trap 'printf "[ERROR] Deployment stopped at line %s. Fix the error before resuming.\n" "$LINENO" >&2' ERR
scripts=(01_system_prereqs.sh 02_wazuh_provision.sh 03_iris_provision.sh 04_bind_integrations.sh 05_sensor_forwarders.sh 06_health_check.sh)
for index in "${!scripts[@]}"; do
    step=$((index + 1))
    if [ -n "$TARGET_STEP" ]; then [ "$step" -eq "$TARGET_STEP" ] || continue
    else [ "$step" -ge "$FROM_STEP" ] || continue; fi
    log "Step $step/6: ${scripts[$index]}"
    flags=()
    if [ "$DRY_RUN" = true ]; then flags+=(--dry-run); fi
    bash "${DEPLOY_ROOT}/scripts/${scripts[$index]}" "${flags[@]}"
done
if [ "$DRY_RUN" = true ]; then log "Plan complete. No services were installed or checked."
else log "Selected steps completed. Keep the private .env and review deployment/README.md for operations."; fi
