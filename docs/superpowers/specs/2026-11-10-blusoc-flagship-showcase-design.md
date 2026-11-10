# BLUSOC: Production-Grade SOC Architecture, Detection Engineering & Interactive Web Showcase

**Date**: 2026-11-10  
**Project Path**: `C:\Users\keert\Desktop\Projects\BLUSOC`  
**Status**: Approved Design Specification  

---

## 1. Executive Summary & Objectives

BLUSOC is an enterprise-grade Security Operations Center (SOC) platform designed to showcase end-to-end blue team engineering, telemetry pipelines, false-positive suppression, and incident triage. 

This project bridges raw security operations with modern software engineering by combining:
1. **Production Detection Engineering**: Sanitized Wazuh rulesets, Suricata sensor configurations, and custom tuning rules that reduced enterprise alert fatigue by over 80%.
2. **Infrastructure Automation & Middleware**: Python integration daemons (`custom-iris`) solving real-world payload truncation, live bi-directional ticket synchronization, and container overlays.
3. **Zero-Touch Server Orchestration**: A clean, modular `deployment/` suite with `.env.example` enabling one-command provisioning of the entire SOC stack on fresh servers without exposing internal secrets.
4. **Light-Themed Web Showcase**: A web application built with Next.js 14, Tailwind CSS, Framer Motion, and Neon PostgreSQL, following clinical Swiss and minimalist design standards (`#F8FAFC` canvas, crisp 1px borders, deep Slate typography, and semantic status accents). Features an interactive Visual Pipeline Orchestrator, live 67-alert Triage Workbench, and an Alert Fatigue Lab.

---

## 2. Monorepo Architecture & Directory Structure

The repository at `C:\Users\keert\Desktop\Projects\BLUSOC` is organized as follows:

```
BLUSOC/
├── README.md                      # Flagship engineering documentation, architecture diagrams, ROI metrics
├── LICENSE                        # MIT License
├── .gitignore                     # Git ignore rules for Node, Python, env, and OS artifacts
│
├── detection-engineering/         # Production SIEM rules and tuning configurations
│   ├── wazuh/
│   │   ├── rules/
│   │   │   ├── 01_suppression_rules.xml   # CrowdStrike, Suricata ethertype, Cloudflare noise suppression
│   │   │   ├── 02_proxy_egress_tuning.xml # O365 login tuning (proxy egress vs brute force)
│   │   │   └── 03_threat_intel_rules.xml  # High-fidelity blocklist hits (L8 to L12)
│   │   └── tests/
│   │       ├── test_rule_syntax.sh        # Automated wazuh-analysisd test harness
│   │       └── sample_events.json         # Raw test payloads for rule evaluation
│   └── docs/
│       └── alert_fatigue_study.md         # Case study on 80%+ alert noise suppression
│
├── integrations/                  # Sanitized middleware and automation daemons
│   ├── custom-iris/
│   │   ├── custom-iris.py         # Wazuh to IRIS webhook enricher (4000-char payload expansion fix)
│   │   └── config.example.json    # Sanitized API configuration
│   ├── sync-daemon/
│   │   ├── iris_status_daemon.py  # Real-time ticket synchronization loop
│   │   └── requirements.txt       # Python dependencies
│   └── docker/
│       └── docker-compose.yml     # Standalone local sandbox (Wazuh + IRIS simulation)
│
├── deployment/                    # Zero-touch server orchestration suite
│   ├── .env.example               # Full template for Wazuh, IRIS, CrowdStrike, Sophos, Barracuda
│   ├── deploy.sh                  # Master orchestrator script
│   ├── scripts/
│   │   ├── 01_system_prereqs.sh   # Kernel params, Docker, Compose v2, Python 3.11+, uv, jq
│   │   ├── 02_wazuh_provision.sh  # Wazuh Manager installation, API config, SSL certs
│   │   ├── 03_iris_provision.sh   # DFIR-IRIS container stack, volume overrides, overlay mounts
│   │   ├── 04_bind_integrations.sh# Installs custom-iris into /var/ossec/integrations
│   │   ├── 05_sensor_forwarders.sh# Syslog listeners for Barracuda/Sophos, Suricata socket hooks
│   │   └── 06_health_check.sh     # End-to-end verification (API health, pipeline ping, alert flow test)
│   ├── systemd/
│   │   └── blusoc-sync.service    # Systemd unit file for the background ticket sync daemon
│   ├── templates/
│   │   ├── docker-compose.iris.yml# Production compose file with persistent volumes
│   │   ├── ossec.conf.template    # Wazuh manager configuration with custom integration blocks
│   │   └── suricata.yaml.template # High-throughput packet capture & EVE JSON logging config
│   └── README.md                  # Hardware sizing, port map, firewall rules, and migration runbook
│
├── data/                          # Sanitized real-world telemetry and IOCs
│   ├── alerts_sanitized.json      # The 67 confirmed attack alerts (CINS, DROP, GPL, WAF)
│   ├── alert_taxonomy.json        # Categorization (brute force, recon, web exploit, intel)
│   └── enterprise_topology.json   # Synthetic corporate network map (clean sanitized assets)
│
├── docs/                          # In-depth architectural runbooks
│   ├── architecture.md            # End-to-end data flow and network isolation model
│   ├── incident_response_playbook.md # L1/L2 standard operating procedures
│   └── database_schema.md         # PostgreSQL / Neon entity relationship documentation
│
└── web/                           # Live interactive showcase (Next.js + Neon + Vercel)
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.mjs
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx         # Modern light theme, custom fonts, telemetry status bar
    │   │   ├── page.tsx           # Command center landing page
    │   │   ├── pipeline/page.tsx  # Interactive animated pipeline visualizer
    │   │   ├── workbench/page.tsx # Live analyst triage workspace (67 real alerts)
    │   │   ├── fatigue-lab/page.tsx # Interactive Before vs After rule optimizer
    │   │   └── api/               # Next.js route handlers connecting to Neon
    │   ├── components/            # Reusable UI components (HUD cards, glass panels, graphs)
    │   ├── lib/
    │   │   ├── db.ts              # Neon PostgreSQL serverless client
    │   │   ├── session.ts         # Guest workspace cookie management
    │   │   └── types.ts           # Shared TypeScript interfaces
    │   └── data/                  # Embedded fallback records for instant cold starts
    └── drizzle/                   # Database migrations and seed scripts for Neon
```

---

## 3. Data Sanitization & Threat Intelligence Matrix

To protect sensitive corporate infrastructure while preserving complete technical realism:

1. **Synthetic Enterprise Topology**:
   * Internal subnets map to RFC 1918 and RFC 5737 spaces (`10.240.0.0/16`, `172.16.50.0/24`).
   * Production server names map to role-specific FQDNs:
     * SIEM Manager: `siem-core-01.blusoc.internal`
     * SOAR & Incident Platform: `soar-iris-01.blusoc.internal`
     * Edge Sensors: `sensor-us-east-01`, `sensor-eu-west-01`
     * Active Directory: `dc-01.blusoc.internal`
2. **The 67 Confirmed Attack Alerts**:
   * Sourced directly from verified true-positive detections hitting public-facing endpoints.
   * Four distinct attack vectors:
     * **Blocklist Hits**: ET CINS Active Threat, ET DROP Dshield, Spamhaus DROP.
     * **Remote Code Execution**: GPL ATTACK_RESPONSE / Web Server RCE attempts.
     * **Web Application Firewall**: Cloudflare WAF SQL injection and path traversal events.
     * **Reconnaissance**: High-speed SYN scanning, aggressive directory enumeration, and service discovery.
   * Full data preservation: source IP, destination IP, target ports (e.g. 443, 6514, 20443), protocol, raw event payload, GeoIP country, and triage questions.
3. **Egress Proxy vs Brute-Force Logic**:
   * Preserves real engineering logic where company egress gateways triggered mass O365 brute-force alerts.
   * Sanitized egress IPs (`198.51.100.14`, `198.51.100.242`) are mapped to known corporate exit nodes to showcase the exact correlation rule that eliminated false alerts while maintaining vigilance against actual credential-stuffing campaigns.
4. **Analyst Personas**:
   * All student and employee identifiers are converted into synthetic security team identities (`analyst.chen`, `analyst.vance`, `analyst.ross`).

---

## 4. Detection Engineering & Integrations Suite

### Wazuh Custom Rulesets (`detection-engineering/wazuh/rules/`)
* **`01_suppression_rules.xml`**:
  * Rule `100010`: CrowdStrike catch-all tuned to Level 0 (suppresses null-hostname log floods).
  * Rule `86611`: Suricata low-severity ethertype noise dropped from Level 5 to Level 0.
  * Rule `100550`: Cloudflare validation loops silenced to Level 0.
  * Rule `100700`: Barracuda generic heartbeats tuned to Level 0.
* **`02_proxy_egress_tuning.xml`**:
  * Rule `91578`: Overwrites default O365 MailItemsAccessed rule. Detects logins originating from untrusted autonomous systems while whitelisting authenticated company egress proxies.
* **`03_threat_intel_rules.xml`**:
  * High-confidence alerts retained at Level 8 to Level 12 (rules `100011`, `100019`, `100013`, `86601`, `100400`, `100800`, `100031`) with automated severity mapping into DFIR-IRIS.

### Python Integration Middleware (`integrations/custom-iris/`)
* **`custom-iris.py`**:
  * Resolves Wazuh's default 400-character log truncation by configuring a 4000-character payload buffer.
  * Enriches raw alerts with GeoIP lookups, IOC blocklist checks, and MITRE ATT&CK technique IDs.
  * Maps SIEM severity to IRIS status (Level 12+ to Critical, Level 9-11 to High, Level 6-8 to Medium, Level 3-5 to Low).
  * Delivers enriched payloads over authenticated REST API to `/alerts/add`.
* **`iris_status_daemon.py`**:
  * Background daemon polling IRIS status transitions (`OPEN`, `IN_PROGRESS`, `CLOSED`).
  * Emits status updates to synchronize triage gates and analyst metrics in real time.

---

## 5. Deployment & Orchestration Suite (`deployment/`)

Provides zero-touch provisioning for deploying BLUSOC on a clean Ubuntu 22.04/24.04 server.

### Scripts & Responsibilities
1. `deploy.sh`: Entrypoint orchestrator. Validates `.env`, checks root permissions, runs provisioning scripts in sequence, and performs final health validation.
2. `01_system_prereqs.sh`: Configures sysctl limits, installs Docker Engine, Docker Compose v2, Python 3.11+, uv, jq, curl, and openssl.
3. `02_wazuh_provision.sh`: Installs Wazuh Manager, generates self-signed certificates, configures ossec.conf from templates, and enables File Integrity Monitoring (FIM).
4. `03_iris_provision.sh`: Launches DFIR-IRIS container stack (`app`, `db`, `worker`, `nginx`, `rabbitmq`), binds persistent storage volumes, and mounts overlay patches.
5. `04_bind_integrations.sh`: Deploys `custom-iris.py` to `/var/ossec/integrations/custom-iris`, sets permissions to `0750` owned by `root:ossec`, and registers integration hooks in `ossec.conf`.
6. `05_sensor_forwarders.sh`: Configures rsyslog listeners on UDP/TCP 514 and 6514 for edge firewall logs (Barracuda, Sophos) and connects Suricata eve.json sockets.
7. `06_health_check.sh`: Automated diagnostic test verifying manager service status, IRIS API responsiveness, webhook injection, and database persistence.

### Configuration (`deployment/.env.example`)
Template covering all operational keys without hardcoding private values:
* Wazuh API connection credentials and ports
* DFIR-IRIS API keys and organization identifiers
* CrowdStrike Falcon API client credentials
* Sophos Central API credentials
* Barracuda CloudGen syslog configuration
* Cloudflare WAF webhook tokens
* Threat intelligence API endpoints (VirusTotal, MISP)
* Neon PostgreSQL connection strings

---

## 6. Light-Themed Web Showcase Architecture (`web/`)

Built strictly following `ui-ux-pro-max`, `design-taste-frontend`, and `impeccable` design principles.

### Aesthetic Foundation
* **Theme**: Modern Swiss / Clinical Light.
* **Canvas Background**: `#F8FAFC` (Slate 50).
* **Surfaces**: `#FFFFFF` (Pure White) with 1px borders in `#E2E8F0` (Slate 200). Zero arbitrary drop-shadows.
* **Typography**:
  * Primary UI: **Plus Jakarta Sans** (clean, high-density corporate sans).
  * Telemetry, IPs, and Code: **JetBrains Mono** (crisp tabular monospace).
* **Color Usage**: Color is strictly reserved for data meaning, not UI decoration.
  * Critical / Malicious: `#DC2626` (Red 600) with `#FEF2F2` badge background.
  * Medium / In Progress: `#D97706` (Amber 600) with `#FFFBEB` badge background.
  * Low / Informational: `#2563EB` (Blue 600) with `#EFF6FF` badge background.
  * Closed / Clean / Verified: `#059669` (Emerald 600) with `#ECFDF5` badge background.

### Core Modules
1. **Command Center (`/`)**:
   * Architecture overview with live platform stats: 67 validated incidents, 84% noise reduction, 4 integrated telemetry sources, 0 leaked credentials.
   * Quick-launch cards into the Pipeline Visualizer, Triage Workbench, and Fatigue Lab.
2. **Visual Pipeline Orchestrator (`/pipeline`)**:
   * Interactive SVG node diagram showing live telemetry movement:
     * Sensor Ingestion -> Wazuh Analysis Engine -> Python Enricher -> DFIR-IRIS Ticketing -> Analyst Workbench.
   * Clickable nodes opening technical inspect sheets with raw XML rules, Python code snippets, and active latency metrics.
   * Animated packet pulse toggles simulating live incident flow.
3. **Analyst Triage Workbench (`/workbench`)**:
   * Real-world incident queue featuring the 67 confirmed attack alerts.
   * Full search, category filter (Threat Intel, Brute Force, Web Exploit, Recon), and severity badges.
   * Incident inspection pane showing raw event JSON, GeoIP origin, attack taxonomy, and interactive ticket gating.
   * Integrated ticket verdict submission persisted to Neon PostgreSQL.
4. **Alert Fatigue Reduction Lab (`/fatigue-lab`)**:
   * Interactive Before vs After toggle demonstrating the impact of rule tuning.
   * Live comparative metrics: 14,280 daily alerts reduced to 184 high-fidelity alerts, 42 min MTTR cut to 8 min, and 32 analyst hours saved daily.
   * Interactive rule switches allowing visitors to toggle individual suppression filters and watch volume graphs update dynamically.

### Database & Session Model (Neon PostgreSQL)
* **Client**: `@neondatabase/serverless` with Drizzle ORM.
* **Ephemeral Guest Sessions**: Every visitor receives an automatic guest session token stored in an HTTP-only cookie.
* **Database Schema**:
  * `alerts`: Master table holding the 67 sanitized incident records.
  * `tuning_rules`: Ruleset definitions with suppression metrics.
  * `guest_workspaces`: Ephemeral visitor state tracking triaged alerts and custom rule toggles.
  * `triage_verdicts`: Visitor-submitted incident analyses.
* **Factory Reset**: A "Reset Workspace" action allowing visitors to clear their session data back to the clean baseline.

---

## 7. Flagship Portfolio Documentation (`README.md`)

The root `README.md` is crafted to read like a top-tier security engineering repository:
1. **Hero Section**: High-level value proposition, live demo link, and architecture badge row.
2. **Interactive Showcase Highlights**: Screenshots and walkthroughs of the Pipeline Visualizer, Workbench, and Fatigue Lab.
3. **Architecture Deep Dive**: Clean ASCII and SVG architecture diagrams detailing packet flows from sensors to IRIS.
4. **Detection Engineering Teardown**: Code walkthrough of false-positive suppression rules with before/after event counts.
5. **Zero-Touch Deployment Guide**: Step-by-step instructions for running `deploy.sh` on fresh infrastructure.
6. **Hardware & Sizing Matrix**: Recommended CPU, RAM, and disk allocations for SOC manager, database, and sensor nodes.
7. **Security & Sanitization Statement**: Explanation of data anonymization and privacy compliance.
