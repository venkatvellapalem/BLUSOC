# BLUSOC Project Engineering Handoff

This document provides complete instructions for publishing, deploying, operating, and maintaining the BLUSOC repository and web showcase.

---

## 1. Monorepo Overview and Architecture

BLUSOC is an enterprise-grade blue-team detection engineering monorepo and interactive threat intelligence platform. The repository unifies detection engineering, security integration pipelines, zero-touch server orchestration, and an executive web showcase.

```
BLUSOC/
├── data/                               # Sanitized datasets and schemas
│   ├── alerts_sanitized.json           # 67 confirmed attack alerts (RFC 1918 / RFC 5737)
│   ├── alert_taxonomy.json             # MITRE ATT&CK mapping and severity matrix
│   └── enterprise_topology.json        # 6 corporate subnets, 15 synthetic assets
├── detection-engineering/              # Detection engineering artifacts and test harness
│   ├── docs/alert_fatigue_study.md     # 87.1 percent noise reduction research paper
│   └── wazuh/
│       ├── rules/                      # XML rule sets (suppression, proxy, threat intel)
│       └── tests/                      # 20-scenario automated rule validation harness
├── integrations/                       # Production SIEM to SOAR middleware
│   ├── custom-iris/custom-iris.py      # Wazuh-to-IRIS integrator with 4000-char buffer fix
│   ├── sync-daemon/                    # Real-time bi-directional ticket state sync daemon
│   ├── docker/                         # Mock IRIS sandbox for offline verification
│   └── tests/test_integrations.py      # 21-test integration test harness
├── deployment/                         # Zero-touch Linux server orchestration suite
│   ├── deploy.sh                       # Master provisioning runner with dry-run support
│   ├── .env.example                    # 23-key sanitized enterprise environment template
│   ├── scripts/                        # 6 modular provisioning scripts (01 to 06)
│   ├── systemd/blusoc-sync.service     # Production systemd service unit
│   ├── templates/                      # ossec.conf and docker-compose.iris.yml templates
│   └── tests/                          # 6-suite automated deployment validator
├── web/                                # Next.js 14 App Router interactive showcase
│   ├── src/app/                        # Routes: /, /pipeline, /workbench, /fatigue-lab
│   ├── src/components/                 # Light-aesthetic UI, SVG DAG, Radar, Simulators
│   ├── src/data/                       # Local bundled fallback datasets
│   ├── src/lib/                        # Resilient Neon database client and schema
│   ├── vercel.json                     # Vercel deployment headers and routing rules
│   └── package.json                    # Workspace dependencies and scripts
├── docs/                               # Engineering blueprints and operational runbooks
│   ├── architecture.md                 # Full end-to-end architecture specification
│   └── incident_response_playbook.md   # Standard operating procedures for SOC tier 1-3
├── scripts/                            # Monorepo verification and compliance audit scripts
│   ├── audit_repository_sanitization.py# Scans 80 files for zero corporate leaks and zero em dashes
│   ├── verify_data.py                  # JSON data schema validator
│   └── verify_docs.py                  # Documentation integrity checker
├── package.json                        # Root monorepo orchestrator and test runner
└── README.md                           # Flagship repository presentation
```

---

## 2. GitHub Repository Setup and Publishing

The repository is fully initialized, sanitized, and committed locally on branch `main`.

### Prerequisites
- Git installed on your system.
- GitHub account with permissions to create a new repository.
- GitHub CLI (`gh`) or standard HTTPS/SSH authentication.

### Steps to Push to GitHub

1. Create a new empty repository on GitHub:
   - Name: `blusoc` (or `blusoc-enterprise-platform`)
   - Visibility: Public (recommended for portfolio) or Private
   - Do NOT initialize with a README, license, or .gitignore (these already exist locally).

2. Link your local repository to the remote origin:
   ```bash
   cd C:\Users\keert\Desktop\Projects\BLUSOC
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/blusoc.git
   ```

3. Confirm the current branch is `main`:
   ```bash
   git branch -M main
   ```

4. Push all commits and branches:
   ```bash
   git push -u origin main
   ```

---

## 3. Vercel Web Showcase Deployment

The Next.js 14 web application is designed for zero-config deployment on Vercel with optional serverless database persistence.

### Deployment Method A: Deploy via Vercel Dashboard (Recommended)

1. Navigate to [https://vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository (`<YOUR_GITHUB_USERNAME>/blusoc`).
3. Configure the project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web` (click Edit and select the `web` folder)
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
4. Environment Variables (Optional):
   - `DATABASE_URL`: Your Neon PostgreSQL connection string (`postgres://...`).
     - *Note*: If `DATABASE_URL` is omitted, the web application runs in resilient offline fallback mode, serving the 67 sanitized alerts from local JSON with in-memory session persistence.
   - `NEXT_PUBLIC_APP_ENV`: `production`
5. Click **Deploy**. The site will build in approximately 45 seconds and provide a production `.vercel.app` URL.

### Deployment Method B: Deploy via Vercel CLI

```bash
cd C:\Users\keert\Desktop\Projects\BLUSOC\web
npm install -g vercel
vercel
# Follow prompts: Link to existing project (N), Set root directory (./), Deploy
vercel --prod
```

---

## 4. Bare-Metal and Cloud Server Deployment (Zero-Touch)

For hosting the full SOC backend (Wazuh Manager, DFIR-IRIS, and Bi-Directional Sync Daemon) on Ubuntu or Debian Linux:

### Target Host Specifications
- Operating System: Ubuntu 22.04 LTS, Ubuntu 24.04 LTS, or Debian 12
- Resources: Minimum 4 vCPUs, 8 GB RAM, 60 GB SSD storage
- Network Access: Inbound ports 443 (DFIR-IRIS Web UI), 1514/1515 (Wazuh Agent registration and events)

### Execution Steps

1. Clone repository to server:
   ```bash
   git clone https://github.com/<YOUR_GITHUB_USERNAME>/blusoc.git /opt/blusoc
   cd /opt/blusoc
   ```

2. Configure environment credentials:
   ```bash
   cp deployment/.env.example deployment/.env
   nano deployment/.env
   ```
   Fill in your actual production tokens (DFIR-IRIS API key, Wazuh server IP, CrowdStrike and sensor webhooks).

3. Make scripts executable:
   ```bash
   chmod +x deployment/deploy.sh deployment/scripts/*.sh
   ```

4. Run dry run simulation (non-destructive validation):
   ```bash
   bash deployment/deploy.sh --dry-run
   ```

5. Execute master deployment:
   ```bash
   sudo bash deployment/deploy.sh
   ```

6. Verify operational health:
   ```bash
   bash deployment/scripts/06_health_check.sh
   systemctl status blusoc-sync.service
   ```

---

## 5. Local Development and Verification Commands

All development tasks can be run directly from the repository root using the npm script harness:

### Run Development Server
```bash
# Starts Next.js development server on http://localhost:3000
npm run dev
```

### Run Full Verification Suite
```bash
# Executes all detection tests, integration tests, deployment audits, sanitization checks, typechecks, and builds
npm run verify:all
```

### Run Individual Test Suites
```bash
# 1. Detection Engineering (20 scenarios against Wazuh XML rules)
npm run test:rules

# 2. Integration Pipeline (21 tests verifying custom-iris and sync daemon)
npm run test:integrations

# 3. Deployment Suite (Validates bash syntax, templates, and systemd units)
npm run test:deployment

# 4. Repository Sanitization Audit (Scans 80 files for leaks and em dashes)
npm run verify:sanitization

# 5. TypeScript Strict Typecheck
npm run typecheck

# 6. Production Next.js Build
npm run build
```

---

## 6. Key Engineering Decisions and Solutions

1. **Wazuh Integrator Buffer Expansion (4000 Characters)**:
   - Default Wazuh `integratord` truncates alert payloads at 1024 bytes, corrupting deep packet inspection JSON data from Suricata.
   - Our `custom-iris.py` implementation dynamically streams up to 4000 characters without memory leakage, guaranteeing complete forensic metadata inside DFIR-IRIS tickets.

2. **87.1 Percent Alert Fatigue Reduction**:
   - Noise suppression rules (100010, 86611, 86612, 86613, 100550, 100700) eliminate benign telemetry at Level 0 before stateful alert creation.
   - Tested and proven against 20 attack and benign telemetry scenarios.

3. **Dual-Mode Resilient Database Client**:
   - `@neondatabase/serverless` is configured to gracefully fall back to local seed data (`web/src/data/alerts_sanitized.json`) whenever PostgreSQL is unreachable or unconfigured.
   - Enables instant portfolio demonstrations on static hosts with zero database dependencies while supporting production databases when available.

4. **100 Percent Data Sanitization**:
   - All private corporate IP subnets mapped to RFC 1918 (`10.240.0.0/16`) and RFC 5737 (`198.51.100.0/24`).
   - Authentic external threat indicators (CINS Army, ET DROP, Spamhaus, Mimikatz, GPL RCE) preserved to maintain real-world detection engineering fidelity.
