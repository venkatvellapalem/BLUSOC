# BLUSOC Zero-Touch Server Deployment & Operations Manual

This directory contains the production automation suite for deploying, configuring, and maintaining the BLUSOC Blue Team architecture on Ubuntu 22.04 / 24.04 LTS servers.

---

## 1. Architecture Overview

The deployment suite provisions a cohesive blue team engineering stack combining:
- **Wazuh SIEM Manager (v4.9+)**: High-throughput log collection, real-time decoder pipeline, FIM, and noise-suppression rulesets.
- **DFIR-IRIS SOAR Platform (v2.4+)**: Containerized incident investigation workbench running PostgreSQL, RabbitMQ, Django core, Celery workers, and Nginx.
- **Python Middleware**: The `custom-iris` webhook enricher (eliminating Wazuh's 400-character payload truncation limit) and the `iris_status_daemon` real-time state synchronization service.
- **Edge Syslog Forwarders**: High-capacity rsyslog daemon handling raw UDP/TCP 514 and TCP 6514 telemetry from edge perimeter firewalls (Barracuda CloudGen, Sophos Central, Cloudflare WAF).

```
                      +---------------------------------------+
                      |       Perimeter Telemetry Sources     |
                      |  (Barracuda, Sophos, Cloudflare WAF)  |
                      +---------------------------------------+
                                          |
                     Syslog UDP/TCP 514   |   TCP 6514 TLS
                                          v
                      +---------------------------------------+
                      |         rsyslog Sensor Ingestion      |
                      |        (/var/log/blusoc/*.log)        |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |          Wazuh SIEM Manager           |
                      |    (Analysisd Engine + FIM Monitor)   |
                      +---------------------------------------+
                                          |
                                          |  Integration Hook (0750)
                                          v
                      +---------------------------------------+
                      |         custom-iris Middleware        |
                      |    (4000-char buffer + GeoIP / IOC)   |
                      +---------------------------------------+
                                          |
                                          v  REST API / HTTPS
                      +---------------------------------------+
                      |          DFIR-IRIS SOAR Stack         |
                      |    (Nginx -> App -> Celery -> DB)     |
                      +---------------------------------------+
                                          ^
                                          |  State Polling (10s)
                      +---------------------------------------+
                      |       iris_status_daemon.service      |
                      |    (Bi-directional Ticket Sync)       |
                      +---------------------------------------+
```

---

## 2. Hardware Sizing Guide

Recommended server allocations based on enterprise sustained events per second (EPS):

| Deployment Tier | Sustained EPS | Peak EPS | CPU Cores | RAM | Storage Allocation | IOPS Target |
|:---|:---|:---|:---|:---|:---|:---|
| **Proof of Concept / Lab** | 500 EPS | 1,500 EPS | 4 vCPU | 8 GB | 120 GB SSD | 1,000 IOPS |
| **Standard Production** | 2,500 EPS | 7,500 EPS | 8 vCPU | 16 GB | 500 GB NVMe | 3,000 IOPS |
| **High-Throughput Enterprise**| 10,000 EPS | 25,000 EPS | 16 vCPU | 32 GB | 2.0 TB NVMe (RAID 10) | 10,000 IOPS |

### Storage Retention Formula
$$\text{Storage (GB/day)} = \frac{\text{EPS} \times 86,400 \times \text{Avg Event Bytes (800)}}{1,073,741,824} \times (1 - \text{Compression (0.7)})$$

At 2,500 EPS with 800-byte raw messages and 70% gzip compression, plan for **51.8 GB raw indexing / month**.

---

## 3. Network & Port Allocation Matrix

All services enforce strict firewall boundaries. The table below details required network sockets:

| Port | Protocol | Direction | Source | Destination | Service Description |
|:---|:---|:---|:---|:---|:---|
| **514** | UDP / TCP | Inbound | Sensors / Firewalls | BLUSOC Host | Unencrypted perimeter firewall logs |
| **6514** | TCP (TLS) | Inbound | Remote Cloud / WAF | BLUSOC Host | Encrypted perimeter syslog streams |
| **1514** | TCP | Inbound | Wazuh Agents | BLUSOC Host | Wazuh secure agent communications |
| **1515** | TCP | Inbound | Wazuh Agents | BLUSOC Host | Wazuh agent auto-enrollment daemon |
| **55000** | TCP | Localhost / Internal | SOC Management | BLUSOC Host | Wazuh RESTful Management API |
| **80** | TCP | Inbound | Web Browsers | BLUSOC Host | IRIS HTTP redirect to HTTPS |
| **443** | TCP | Inbound | SOC Analysts / API | BLUSOC Host | DFIR-IRIS Nginx HTTPS Web UI & API |
| **5432** | TCP | Internal Bridge | `blusoc-net` | `iris-db` | PostgreSQL internal database socket |
| **5672** | TCP | Internal Bridge | `blusoc-net` | `iris-rabbitmq` | Celery message broker socket |
| **8000** | TCP | Internal Bridge | `iris-nginx` | `iris-app` | Django ASGI/WSGI application listener |

---

## 4. One-Command Deployment Guide

### Prerequisites
1. Fresh instance of **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS**.
2. Root access or user account with `sudo` privileges.
3. Stable internet connectivity for container base images and APT repositories.

### Quickstart Execution

```bash
# 1. Clone repository into local workspace
git clone https://github.com/blusoc/blusoc.git /opt/blusoc-repo
cd /opt/blusoc-repo/deployment

# 2. Copy and customize environment configuration
cp .env.example .env
chmod 0600 .env
nano .env

# 3. Perform pre-flight simulation (no system changes)
sudo ./deploy.sh --dry-run

# 4. Execute production deployment
sudo ./deploy.sh
```

### CLI Command Options

```bash
# Execute only a single provisioning step (e.g. step 2: Wazuh setup)
sudo ./deploy.sh --step 2

# Resume deployment from a specific step (e.g. step 3 through 6)
sudo ./deploy.sh --from-step 3

# Run unattended in CI/CD pipeline without interactive prompts
sudo ./deploy.sh --non-interactive

# Display full syntax manual
./deploy.sh --help
```

---

## 5. Provisioning Pipeline Steps

The orchestrator executes six sequential steps:

1. **`scripts/01_system_prereqs.sh`**:
   - Applies sysctl tuning (`vm.max_map_count=262144`, `fs.file-max=65536`, `somaxconn=1024`).
   - Sets descriptor ulimits in `/etc/security/limits.d/99-blusoc.conf`.
   - Installs Docker Engine, Docker Compose v2, Python 3.11+, uv, jq, curl, openssl, rsyslog.
   - Creates root directories `/opt/blusoc/{bin,etc,iris}` and `/var/log/blusoc/`.

2. **`scripts/02_wazuh_provision.sh`**:
   - Installs official Wazuh Manager release.
   - Generates 2048-bit RSA self-signed certificates for manager authentication.
   - Interpolates environment variables into `templates/ossec.conf.template` -> `/var/ossec/etc/ossec.conf`.
   - Copies BLUSOC detection rules (`01_suppression_rules.xml`, `02_proxy_egress_tuning.xml`, `03_threat_intel_rules.xml`) to `/var/ossec/etc/rules/`.
   - Starts and enables `wazuh-manager.service`.

3. **`scripts/03_iris_provision.sh`**:
   - Generates TLS certificates for IRIS reverse proxy.
   - Deploys Nginx reverse proxy configuration at `/opt/blusoc/iris/nginx/nginx.conf`.
   - Deploys `templates/docker-compose.iris.yml` to `/opt/blusoc/iris/docker-compose.yml`.
   - Launches PostgreSQL, RabbitMQ, IRIS App, IRIS Celery Worker, and Nginx.

4. **`scripts/04_bind_integrations.sh`**:
   - Installs `custom-iris.py` to `/var/ossec/integrations/custom-iris` with `0750` permissions owned by `root:ossec`.
   - Deploys `iris_status_daemon.py` to `/opt/blusoc/bin/iris_status_daemon.py`.
   - Writes production daemon configuration to `/etc/blusoc/blusoc.env` (`0600`).
   - Configures, enables, and activates `blusoc-sync.service` under systemd.

5. **`scripts/05_sensor_forwarders.sh`**:
   - Configures `/etc/rsyslog.d/10-blusoc-sensors.conf` for UDP 514, TCP 514, and TCP 6514 listeners.
   - Separates firewall logs to `/var/log/blusoc/firewall.log` and WAF logs to `/var/log/blusoc/waf.log`.
   - Establishes logrotate policy in `/etc/logrotate.d/blusoc-sensors` (14-day retention with compression).
   - Links Suricata sensor sockets and initializes `/var/log/suricata/eve.json`.

6. **`scripts/06_health_check.sh`**:
   - Executes 9 health checks verifying sysctl parameters, service states, API ports, container health, database responsiveness, and integration binaries.
   - Outputs an ASCII status dashboard and returns exit code 0 on full system readiness.

---

## 6. Migration Runbook: Multi-Node Lab to Unified Production Server

Follow this runbook when consolidating multi-node lab servers into a unified production instance:

### Step 1: Backup Source DFIR-IRIS Database
On the existing IRIS database node:
```bash
docker exec -t iris_postgres pg_dump -U iris_user -d iris_db -F c -b -v -f /tmp/iris_backup_$(date +%Y%m%d).dump
scp /tmp/iris_backup_*.dump admin@siem-core-01.blusoc.internal:/opt/blusoc/backups/
```

### Step 2: Backup Wazuh Agent Keys and Cluster Identity
On the existing Wazuh Manager:
```bash
# Export registered agent cryptographic keys
sudo cp /var/ossec/etc/client.keys /tmp/client.keys
sudo tar -czvf /tmp/wazuh_backup.tar.gz /var/ossec/etc/rules/ /var/ossec/etc/decoders/ /tmp/client.keys
scp /tmp/wazuh_backup.tar.gz admin@siem-core-01.blusoc.internal:/opt/blusoc/backups/
```

### Step 3: Run Zero-Touch Provisioning on Unified Host
On the new server `siem-core-01.blusoc.internal`:
```bash
cd /opt/blusoc-repo/deployment
sudo ./deploy.sh
```

### Step 4: Restore State into Containerized Stack
```bash
# 1. Stop IRIS web container to prevent concurrent writes
docker stop blusoc-iris-app blusoc-iris-worker

# 2. Restore PostgreSQL dump
docker exec -i blusoc-iris-db pg_restore -U iris_user -d iris_db --clean --if-exists -v < /opt/blusoc/backups/iris_backup_*.dump

# 3. Restore Wazuh agent registration table
sudo cp /opt/blusoc/backups/client.keys /var/ossec/etc/client.keys
sudo chown root:ossec /var/ossec/etc/client.keys
sudo chmod 0640 /var/ossec/etc/client.keys

# 4. Restart services
docker start blusoc-iris-app blusoc-iris-worker
sudo systemctl restart wazuh-manager.service
sudo systemctl restart blusoc-sync.service
```

### Step 5: Verify Post-Migration Operations
```bash
sudo /opt/blusoc-repo/deployment/scripts/06_health_check.sh
```

---

## 7. Operations, Maintenance & Troubleshooting

### Service Management Commands
```bash
# Wazuh Manager daemon
sudo systemctl status wazuh-manager
sudo systemctl restart wazuh-manager

# IRIS container stack
cd /opt/blusoc/iris
docker compose ps
docker compose restart
docker compose logs -f iris-app

# Background sync daemon
sudo systemctl status blusoc-sync
sudo journalctl -u blusoc-sync -f --no-tail
```

### Common Troubleshooting Scenarios

#### Scenario 1: Wazuh Alert Payload Truncation
- **Symptom**: Alerts appear in IRIS with incomplete JSON or missing `data` blocks.
- **Root Cause**: Wazuh `integratord` defaults to small internal buffer allocations.
- **Remedy**: Verify `/var/ossec/integrations/custom-iris` has `MAX_LOG_LENGTH = 4000` set. Check `/var/ossec/logs/ossec.log` for line length warnings.

#### Scenario 2: IRIS Webhook HTTP 401 / 403 Forbidden
- **Symptom**: Wazuh logs report `custom-iris: HTTP error 401: Unauthorized`.
- **Root Cause**: API key mismatch or expired token.
- **Remedy**: Log into IRIS web UI -> User Profile -> API Tokens -> Generate New Token. Update `IRIS_API_KEY` in `/etc/blusoc/blusoc.env` and `/var/ossec/etc/ossec.conf`. Restart `wazuh-manager` and `blusoc-sync`.

#### Scenario 3: Rsyslog Port Bind Conflict
- **Symptom**: `scripts/06_health_check.sh` reports warning on UDP 514.
- **Root Cause**: Systemd-resolved or standard syslog already bound to port 514.
- **Remedy**: Run `sudo ss -ulnp | grep :514` to identify the occupying PID. Ensure `/etc/rsyslog.d/10-blusoc-sensors.conf` is loaded before default configs.

---

## 8. Security & Compliance Checklist

- [x] All database and message broker passwords randomized in `.env`.
- [x] Permissions on `/var/ossec/integrations/custom-iris` restricted to `0750` (`root:ossec`).
- [x] Configuration template `/etc/blusoc/blusoc.env` restricted to `0600` (`root:root`).
- [x] Rsyslog listener drops unrecognized packets outside authenticated subnets.
- [x] Zero plain credentials committed to source control.
- [x] All internal network addresses strictly adhere to RFC 1918 (`10.240.0.0/16`) and RFC 5737 (`198.51.100.0/24`).
