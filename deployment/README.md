# SOC server deployment

Provision a **dedicated Ubuntu 22.04 or 24.04 LTS server** with a Wazuh manager, DFIR-IRIS, a direct Python alert adapter, an IRIS status monitor, and scoped syslog input.

This does not install the public website, Wazuh indexer/dashboard, vendor collectors, n8n, Laya, notification connectors, or containment automation. See the [architecture](../docs/architecture.md).

## Before you start

Use a fresh systemd host with root access and outbound HTTPS access to the Ubuntu, Docker, Wazuh, GitHub Container Registry, and Python package repositories. Python 3.10+ must be available to validate configuration.

For an evaluation host, start with 4 vCPU, 8 GB RAM, and 80 GB SSD. This is a starting allocation, not a tested capacity rating. Size retention and resources using your actual event volume and a staging load test.

The scripts stop on an unsupported host or a failed required check. Run the repository tests first and keep a host snapshot before provisioning an existing machine. This suite manages service configuration; it is not a general migration tool.

## Configure and preview

From the repository root:

```bash
python3 deployment/config.py init
# Review deployment/.env with your editor.
python3 deployment/config.py check
bash deployment/deploy.sh --dry-run
```

The initializer creates independent random secrets and refuses to overwrite an existing file. The environment file is private and ignored by Git.

The [environment example](.env.example) documents every supported setting. Values are literal `KEY=value` data, optionally wrapped in matching quotes. Shell substitution, inline comments, and multiline values are not supported. Unknown keys and duplicates are errors.

Defaults keep IRIS and syslog on loopback. Configure your real hostname, HTTPS port, sensor interface, and allowed sensor network before exposing them. Review the example M365 proxy allowlist in the detection rules for your environment.

## Provision

```bash
sudo bash deployment/deploy.sh --non-interactive
```

| Step | Result |
| --- | --- |
| 1 | Ubuntu dependencies, Docker/Compose, Python support, service user, and directories |
| 2 | Exact Wazuh package, enrollment secret, configuration backup, custom rules, and engine validation |
| 3 | Matched stable IRIS images, private service configuration, certificate validation, and API readiness |
| 4 | Python virtual environment, Wazuh adapter, dedicated-user monitor, and service activation |
| 5 | Scoped UDP/TCP syslog, syntax validation, and rotation for BLUSOC-owned logs |
| 6 | Required service, container, authenticated API, database, and listener checks |

A missing dependency, invalid Wazuh ruleset, failed container, or unsuccessful authenticated IRIS request stops the process. A dry run prints a plan; it never claims that services are healthy.

For the default configuration, IRIS is available on the server at [https://localhost:8443](https://localhost:8443). The administrator username is `administrator`; the password comes from your private `IRIS_ADMIN_PASSWORD`. Use an SSH tunnel for remote access while retaining the loopback bind:

```bash
ssh -L 8443:localhost:8443 YOUR_USER@YOUR_SERVER
```

The evaluation certificate is self-signed. Trust it in your local browser deliberately, or use a certificate issued by your organization. Automation keeps TLS verification enabled.

## Useful commands

```bash
# Validate real settings without root or host changes.
bash deployment/deploy.sh --check

# Use a specific configuration, independent of the current directory.
sudo bash deployment/deploy.sh --env-file /secure/path/blusoc.env --non-interactive

# Resume after correcting an error.
sudo bash deployment/deploy.sh --from-step 3 --non-interactive

# Re-run real readiness checks.
sudo bash deployment/deploy.sh --step 6 --non-interactive
```

`--step` and `--from-step` are mutually exclusive. A deployment lock prevents simultaneous provisioning runs.

Reruns preserve existing Docker volumes and certificates, and back up the Wazuh configuration before replacing it. Provisioning still rewrites managed configuration. An existing Wazuh version must match the configured package; version upgrades require an explicit maintenance plan.

## Network and TLS

| Listener | Default scope | Purpose |
| --- | --- | --- |
| TCP 1514 | Wazuh manager | Agent events; restrict to your agent networks |
| TCP 1515 | Wazuh manager | Password-protected enrollment; restrict access |
| TCP 55000 | Wazuh package configuration | Management API; keep private |
| TCP 8443 | Loopback | IRIS HTTPS |
| UDP/TCP 514 | Loopback | Plain syslog, additionally scoped by allowed sender network |
| PostgreSQL / RabbitMQ | Private Docker network | No published host ports |

The scripts do not change your cloud firewall or UFW rules. Explicitly allow only the intended management and telemetry sources. Plain syslog belongs on a trusted network or protected transport; the suite does not open a pretend TLS listener on 6514.

With `IRIS_TLS_MODE=self-signed`, provisioning generates a SAN certificate and adds it to the host trust store. Requests uses the system CA bundle. With `IRIS_TLS_MODE=provided`, put a valid `iris.crt` and unencrypted `iris.key` in `/opt/blusoc/iris/certificates/web_certificates/` before step 3. Install your private CA chain in the host trust store if needed.

## Operations

Inspect services without printing environment files:

```bash
sudo systemctl status wazuh-manager blusoc-sync rsyslog
sudo journalctl -u blusoc-sync -n 50 --no-pager
sudo docker compose --project-directory /opt/blusoc/iris --env-file /opt/blusoc/iris/compose.env -f /opt/blusoc/iris/docker-compose.yml ps
```

IRIS configuration lives under `/opt/blusoc/iris`. The monitor stores its baseline in `/var/lib/blusoc/iris-status.sqlite3` and audit entries in `/var/log/blusoc/iris-status/audit.log`.

Before an upgrade, back up:

- The IRIS PostgreSQL database and its three artifact volumes: downloads, user templates, and server data.
- Private deployment configuration, rendered service environment files, and certificate material.
- Wazuh agent keys, configuration, local rules, and decoders.
- The monitor state database and audit log, with the monitor stopped or using SQLite’s backup API.

Use an application-consistent maintenance window for database and attachment snapshots. Verify restoration on a separate host. Never use `docker compose down --volumes` as a routine maintenance command.

IRIS administrator/API secrets and PostgreSQL credentials are **bootstrap settings**. Editing the file does not rotate existing service credentials. Rotate them in the owning service, update the configuration, then restart dependent services and run readiness checks.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Configuration rejected | Replace secret markers; correct unknown keys, matching URL/hostname/port, and numeric settings |
| Pinned package unavailable | Confirm the exact 4.x package in the [Wazuh repository](https://packages.wazuh.com/4.x/apt/); review a version change in staging |
| IRIS 401 after a rerun | The database may contain an older API token; changing bootstrap environment values does not rotate it |
| TLS failure | Check DNS, the SAN, expiry, certificate/key match, and the host CA trust chain |
| Sensor logs empty | Check interface binding, sender CIDR, firewall access, and the sender’s message format |
| Rule validation fails | Inspect `wazuh-analysisd -t`; do not bypass it or assume modeled tests establish engine compatibility |

The readiness checks verify the deployed components, not each vendor’s ingestion path. Finish by sending a controlled source event through Wazuh and confirming its IRIS alert.

## Upstream references

The Compose definition follows the [stable IRIS 2.4.29 image and environment contract](https://github.com/dfir-iris/iris-web/tree/v2.4.29). Wazuh installation follows the [official manager installation documentation](https://documentation.wazuh.com/current/installation-guide/wazuh-server/step-by-step.html). The package and image versions in the environment example are explicit upgrade points.
