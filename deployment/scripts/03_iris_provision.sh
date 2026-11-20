#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"
init_step "$@"
if [ "$DRY_RUN" = true ]; then
    log "PLAN: render private IRIS environment files; use matching upstream $IRIS_VERSION app, database and proxy images."
    log "PLAN: bind HTTPS to $IRIS_BIND_ADDRESS:$IRIS_HTTPS_PORT; validate Compose; pull and wait for services."
    log "PLAN: TLS mode is $IRIS_TLS_MODE. No TLS verification bypasses."
    exit 0
fi
base=/opt/blusoc/iris
cert_dir="$base/certificates/web_certificates"
install -d -m 0700 "$base"
install -d -m 0755 "$base/certificates" "$cert_dir" "$base/certificates/rootCA" "$base/certificates/ldap"
if [ "$IRIS_TLS_MODE" = self-signed ] && { [ ! -f "$cert_dir/iris.crt" ] || [ ! -f "$cert_dir/iris.key" ]; }; then
    san="$("$PYTHON" -c 'import ipaddress,sys; name=sys.argv[1]; print(("IP:" if all(c in "0123456789." for c in name) else "DNS:")+name)' "$IRIS_SERVER_NAME")"
    openssl req -x509 -nodes -newkey rsa:3072 -days 365 -keyout "$cert_dir/iris.key" -out "$cert_dir/iris.crt" -subj "/CN=$IRIS_SERVER_NAME" -addext "subjectAltName=$san"
fi
[ -s "$cert_dir/iris.crt" ] && [ -s "$cert_dir/iris.key" ] || fail "Provide iris.crt and iris.key in $cert_dir."
openssl x509 -in "$cert_dir/iris.crt" -noout -checkend 86400 >/dev/null || fail "IRIS certificate is invalid or expires within a day."
if [[ "$IRIS_SERVER_NAME" =~ ^[0-9.]+$ ]]; then
    openssl x509 -in "$cert_dir/iris.crt" -noout -checkip "$IRIS_SERVER_NAME" >/dev/null
else
    openssl x509 -in "$cert_dir/iris.crt" -noout -checkhost "$IRIS_SERVER_NAME" >/dev/null
fi
cert_pub="$(openssl x509 -in "$cert_dir/iris.crt" -pubkey -noout | openssl pkey -pubin -outform DER | sha256sum)"
key_pub="$(openssl pkey -in "$cert_dir/iris.key" -pubout -outform DER | sha256sum)"
[ "$cert_pub" = "$key_pub" ] || fail "The IRIS certificate and private key do not match."
chmod 0600 "$cert_dir/iris.key"
chmod 0644 "$cert_dir/iris.crt"
install -m 0644 "$cert_dir/iris.crt" "$base/certificates/rootCA/irisRootCACert.pem"
if [ "$IRIS_TLS_MODE" = self-signed ]; then
    install -m 0644 "$cert_dir/iris.crt" /usr/local/share/ca-certificates/blusoc-iris.crt
    update-ca-certificates
fi
"$PYTHON" "${DEPLOY_ROOT}/config.py" render --env-file "$BLUSOC_ENV_FILE" --output-dir "$base"
install -m 0644 "${DEPLOY_ROOT}/templates/docker-compose.iris.yml" "$base/docker-compose.yml"
compose config --quiet
compose pull
compose up -d --wait --wait-timeout 240
"$PYTHON" "${DEPLOY_ROOT}/config.py" probe-iris --env-file "$BLUSOC_ENV_FILE"
log "IRIS is ready at $IRIS_API_URL. API bootstrap settings apply only to a new database."
