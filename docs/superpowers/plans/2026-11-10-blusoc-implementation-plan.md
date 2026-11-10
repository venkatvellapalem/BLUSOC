# BLUSOC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portfolio-grade, sanitized blue-team engineering monorepo and interactive light-themed web showcase at `C:\Users\keert\Desktop\Projects\BLUSOC`.

**Architecture:** Monorepo combining production-grade Wazuh detection rules, Python integration middleware, zero-touch server deployment scripts, and a modern Next.js 14 web application powered by Neon PostgreSQL. The web UI follows Swiss/minimalist light design principles with an interactive pipeline orchestrator, analyst triage workbench, and alert fatigue lab.

**Tech Stack:** Next.js 14 (App Router), React, Tailwind CSS, Framer Motion, Lucide Icons, Neon PostgreSQL (`@neondatabase/serverless`), Drizzle ORM, Python 3.11+, Bash, Wazuh XML.

## Global Constraints
- Target repository root: `C:\Users\keert\Desktop\Projects\BLUSOC`
- Aesthetic: Modern light theme (`#F8FAFC` ground, `#FFFFFF` panels, 1px Slate borders, deep Slate typography)
- Sanitization: All company IPs, hostnames, employee records, and credentials must be masked
- Purity: No em dashes, no AI buzzwords, no boilerplate comments

---

### Task 1: Repository Foundation and Sanitized Threat Intelligence Dataset

**Files:**
- Create: `package.json` (root workspace config)
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `data/alerts_sanitized.json`
- Create: `data/enterprise_topology.json`
- Create: `data/alert_taxonomy.json`

**Interfaces:**
- Produces: Sanitized incident records used by both detection rules and the web triage workbench

- [x] **Step 1: Initialize git repository and root files**
Initialize git repository in `C:\Users\keert\Desktop\Projects\BLUSOC` with `.gitignore` and MIT License.

- [x] **Step 2: Build the sanitized 67-alert dataset**
Extract and sanitize the 67 confirmed attack alerts from the training database. Ensure all internal IPs map to RFC 1918/5737 ranges (`10.240.0.0/16`, `198.51.100.0/24`), hostnames map to synthetic assets (`siem-core-01.blusoc.internal`), and real threat IOCs (CINS, DROP, GPL RCE, Cloudflare WAF) are preserved with full raw logs.

- [x] **Step 3: Define enterprise network topology and alert taxonomy**
Create `data/enterprise_topology.json` mapping sensor locations, firewall interfaces, and internal assets. Create `data/alert_taxonomy.json` mapping categories, severities, and MITRE ATT&CK technique IDs.

- [x] **Step 4: Verify dataset formatting**
Run a validation check ensuring all 67 alerts parse as valid JSON with required fields (`id`, `title`, `category`, `severity`, `timestamp`, `src_ip`, `dest_ip`, `raw_log`, `triage_questions`).

- [x] **Step 5: Commit**
`git add . && git commit -m "feat: initialize repository and sanitized threat telemetry"`

---

### Task 2: Detection Engineering Ruleset and Validation Harness

**Files:**
- Create: `detection-engineering/wazuh/rules/01_suppression_rules.xml`
- Create: `detection-engineering/wazuh/rules/02_proxy_egress_tuning.xml`
- Create: `detection-engineering/wazuh/rules/03_threat_intel_rules.xml`
- Create: `detection-engineering/wazuh/tests/sample_events.json`
- Create: `detection-engineering/wazuh/tests/validate_rules.py`
- Create: `detection-engineering/docs/alert_fatigue_study.md`

**Interfaces:**
- Consumes: Raw event formats and suppression logic
- Produces: Production-ready XML rules for Wazuh Manager

- [x] **Step 1: Author noise suppression ruleset**
Write `01_suppression_rules.xml` containing rule 100010 (CrowdStrike null-hostname storm suppression), rule 86611 (Suricata ethertype noise suppression), and rule 100550 (Cloudflare validation loop suppression).

- [x] **Step 2: Author O365 proxy egress tuning ruleset**
Write `02_proxy_egress_tuning.xml` containing rule 91578 with proxy IP filtering logic that separates authentic corporate egress traffic from legitimate brute-force campaigns.

- [x] **Step 3: Author high-fidelity threat intelligence ruleset**
Write `03_threat_intel_rules.xml` containing rules 100011, 100019, 86601, and 100400 for L8 to L12 confirmed threats.

- [x] **Step 4: Create automated rule validation test script**
Write `validate_rules.py` to parse XML syntax, verify rule IDs, check level thresholds, and evaluate test payloads from `sample_events.json`.

- [x] **Step 5: Run rule validator and commit**
Run `python detection-engineering/wazuh/tests/validate_rules.py` to confirm 100% pass rate. Commit changes.

---

### Task 3: Production Integrations Middleware

**Files:**
- Create: `integrations/custom-iris/custom-iris.py`
- Create: `integrations/custom-iris/config.example.json`
- Create: `integrations/sync-daemon/iris_status_daemon.py`
- Create: `integrations/sync-daemon/requirements.txt`
- Create: `integrations/docker/docker-compose.yml`

**Interfaces:**
- Consumes: Raw Wazuh alert events via stdin/arguments
- Produces: Formatted REST payloads to DFIR-IRIS `/alerts/add`

- [x] **Step 1: Build the custom-iris integration script**
Write `custom-iris.py` with the 4000-character buffer fix to prevent log truncation, GeoIP enrichment, severity mapping, and secure HTTP POST transport.

- [x] **Step 2: Build the bi-directional status synchronization daemon**
Write `iris_status_daemon.py` with resilient error handling, configurable polling intervals, and status broadcast capabilities.

- [x] **Step 3: Create local sandbox docker-compose**
Create `integrations/docker/docker-compose.yml` defining mock Wazuh and IRIS services for local development and testing.

- [x] **Step 4: Test integration script locally**
Run unit tests passing sample Wazuh alert JSON through `custom-iris.py` to verify payload transformation and field integrity.

- [x] **Step 5: Commit**
`git add integrations/ && git commit -m "feat: implement integration daemons and truncation fixes"`

---

### Task 4: Zero-Touch Server Deployment and Orchestration Suite

**Files:**
- Create: `deployment/.env.example`
- Create: `deployment/deploy.sh`
- Create: `deployment/scripts/01_system_prereqs.sh`
- Create: `deployment/scripts/02_wazuh_provision.sh`
- Create: `deployment/scripts/03_iris_provision.sh`
- Create: `deployment/scripts/04_bind_integrations.sh`
- Create: `deployment/scripts/05_sensor_forwarders.sh`
- Create: `deployment/scripts/06_health_check.sh`
- Create: `deployment/systemd/blusoc-sync.service`
- Create: `deployment/templates/ossec.conf.template`
- Create: `deployment/templates/docker-compose.iris.yml`
- Create: `deployment/README.md`

**Interfaces:**
- Consumes: Environment variables from `.env`
- Produces: Fully deployed SOC server running Wazuh, IRIS, integrations, and sensor listeners

- [x] **Step 1: Write comprehensive `.env.example`**
Include documented variables for Wazuh Manager, IRIS API, CrowdStrike Falcon, Sophos Central, Barracuda CloudGen, Cloudflare WAF, and Neon PostgreSQL.

- [x] **Step 2: Author modular provisioning scripts**
Write scripts 01 through 05 covering prerequisite packages, Wazuh manager setup, IRIS container deployment, integration binding (`/var/ossec/integrations`), and syslog forwarders.

- [x] **Step 3: Author health check and master deploy orchestrator**
Write `06_health_check.sh` and `deploy.sh` with interactive flags, root permission validation, step-by-step progress logging, and rollback safety.

- [x] **Step 4: Create systemd unit and templates**
Add `blusoc-sync.service`, `ossec.conf.template`, and `docker-compose.iris.yml`. Document sizing, port maps, and firewall rules in `deployment/README.md`.

- [x] **Step 5: Verify script permissions and syntax**
Verify bash script syntax using dry-run linting. Commit changes.

---

### Task 5: Web Application Shell, Design System, and Neon Database Layer

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/tailwind.config.ts`
- Create: `web/next.config.mjs`
- Create: `web/src/lib/db.ts`
- Create: `web/src/lib/schema.ts`
- Create: `web/src/lib/session.ts`
- Create: `web/src/lib/types.ts`
- Create: `web/src/app/layout.tsx`
- Create: `web/src/app/page.tsx`
- Create: `web/src/components/Navbar.tsx`
- Create: `web/src/components/Footer.tsx`

**Interfaces:**
- Consumes: Neon PostgreSQL connection string and guest cookies
- Produces: Responsive light-themed UI shell and database client

- [x] **Step 1: Scaffold Next.js application**
Initialize `web/` with Next.js 14 App Router, Tailwind CSS, TypeScript, and required packages (`@neondatabase/serverless`, `drizzle-orm`, `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`).

- [x] **Step 2: Configure light design system tokens**
Configure `tailwind.config.ts` with the approved color tokens (`#F8FAFC` background, Slate typography hierarchy, crisp borders, and semantic status accents). Load Plus Jakarta Sans and JetBrains Mono fonts.

- [x] **Step 3: Define database schema and Neon serverless client**
Write `src/lib/schema.ts` defining tables for `alerts`, `tuning_rules`, `guest_sessions`, and `triage_verdicts`. Configure `src/lib/db.ts` with connection pooling and local fallback mode.

- [x] **Step 4: Build guest workspace session manager**
Write `src/lib/session.ts` to issue and verify signed guest workspace cookies for ephemeral visitor state.

- [x] **Step 5: Build global navigation and executive landing page**
Create `Navbar.tsx`, `Footer.tsx`, and `app/page.tsx` featuring platform metrics, architecture summary cards, and quick navigation into the live modules.

- [x] **Step 6: Verify build and commit**
Run `npm run build` in `web/` to confirm zero compilation errors. Commit changes.

---

### Task 6: Interactive Visual Pipeline Orchestrator (`/pipeline`)

**Files:**
- Create: `web/src/app/pipeline/page.tsx`
- Create: `web/src/components/pipeline/PipelineCanvas.tsx`
- Create: `web/src/components/pipeline/NodeDetailDrawer.tsx`
- Create: `web/src/components/pipeline/TelemetryPacketSimulator.tsx`

**Interfaces:**
- Consumes: Pipeline stages, rule definitions, and telemetry states
- Produces: Interactive animated SVG DAG showing packet flows and inspectable nodes

- [ ] **Step 1: Build interactive SVG pipeline canvas**
Create `PipelineCanvas.tsx` rendering five orchestrated stages: Telemetry Ingestion, Wazuh Analysis Engine, Python Enricher, DFIR-IRIS Ticketing, and Analyst Workbench.

- [ ] **Step 2: Implement node inspection slide-over drawer**
Create `NodeDetailDrawer.tsx` displaying real XML decoders, active Python code snippets, payload transformation buffers, and real-time processing metrics when a node is clicked.

- [ ] **Step 3: Add animated event flow simulation**
Create `TelemetryPacketSimulator.tsx` using Framer Motion to visualize live packets traversing the pipeline, highlighting dropped noise vs forwarded alerts.

- [ ] **Step 4: Verify interactive page rendering**
Test node selection, drawer toggles, and animation controls in `web/src/app/pipeline/page.tsx`. Commit changes.

---

### Task 7: Real-World Analyst Triage Workbench (`/workbench`)

**Files:**
- Create: `web/src/app/workbench/page.tsx`
- Create: `web/src/components/workbench/AlertList.tsx`
- Create: `web/src/components/workbench/AlertDetail.tsx`
- Create: `web/src/components/workbench/VerdictModal.tsx`
- Create: `web/src/app/api/workbench/route.ts`

**Interfaces:**
- Consumes: The 67 sanitized attack alerts and guest session tokens
- Produces: Live triage investigation interface and verdict submission endpoints

- [ ] **Step 1: Build alert queue with search and category filters**
Create `AlertList.tsx` featuring real-time search, category tabs (Threat Intel, Brute Force, Web Exploit, Recon), and severity badges.

- [ ] **Step 2: Build comprehensive alert detail inspector**
Create `AlertDetail.tsx` displaying raw JSON event logs, GeoIP origin, attack taxonomy, target ports, and MITRE technique tags.

- [ ] **Step 3: Implement interactive ticket closing and verdict submission**
Create `VerdictModal.tsx` and API route `app/api/workbench/route.ts` allowing visitors to submit True/False positive classifications, record investigative notes, and persist actions to Neon PostgreSQL.

- [ ] **Step 4: Add reset workspace capability**
Implement a "Reset to Factory State" button allowing visitors to clear their submissions and restore the default 67-alert queue.

- [ ] **Step 5: Verify workbench functionality and commit**
Test alert selection, filter switching, payload inspection, and verdict submissions. Commit changes.

---

### Task 8: Alert Fatigue Reduction Lab (`/fatigue-lab`)

**Files:**
- Create: `web/src/app/fatigue-lab/page.tsx`
- Create: `web/src/components/fatigue/BeforeAfterToggle.tsx`
- Create: `web/src/components/fatigue/ImpactCounterGrid.tsx`
- Create: `web/src/components/fatigue/RuleOptimizerMatrix.tsx`

**Interfaces:**
- Consumes: Baseline vs tuned alert metrics and rule suppression parameters
- Produces: Interactive simulation lab proving 80%+ noise reduction

- [ ] **Step 1: Build the Before vs After interactive switch**
Create `BeforeAfterToggle.tsx` with smooth transitions demonstrating the operational difference between the unoptimized SIEM and the tuned BLUSOC pipeline.

- [ ] **Step 2: Build dynamic impact metric counters**
Create `ImpactCounterGrid.tsx` showing daily alert volume (14,280 down to 184), MTTR (42 min down to 8 min), and analyst hours saved (32 hours/day).

- [ ] **Step 3: Build interactive rule optimizer matrix**
Create `RuleOptimizerMatrix.tsx` allowing visitors to toggle individual tuning rules (O365 proxy filter, CrowdStrike null-host filter, Suricata ethertype suppressor) and watch the volume charts adjust dynamically.

- [ ] **Step 4: Verify lab interactivity and commit**
Test toggle interactions, dynamic count recalculations, and mobile responsiveness. Commit changes.

---

### Task 9: Flagship Portfolio Documentation

**Files:**
- Create: `README.md` (root flagship documentation)
- Create: `docs/architecture.md`
- Create: `docs/incident_response_playbook.md`

**Interfaces:**
- Produces: High-impact GitHub repository presentation

- [ ] **Step 1: Write root README.md**
Write an exhaustive, beautifully structured `README.md` featuring architecture diagrams, live demo links, key operational metrics, rule tuning teardowns, and quickstart guides.

- [ ] **Step 2: Write architecture and incident response runbooks**
Write `docs/architecture.md` detailing end-to-end data flow and network isolation. Write `docs/incident_response_playbook.md` documenting L1/L2 standard operating procedures for each alert category.

- [ ] **Step 3: Review documentation formatting**
Verify that all links, badges, diagrams, and tables render cleanly without placeholders or broken references. Commit changes.

---

### Task 10: End-to-End Build Verification and Vercel Readiness

**Files:**
- Modify: `web/package.json`
- Create: `web/vercel.json`

**Interfaces:**
- Produces: Production-ready build artifacts deployable to Vercel

- [ ] **Step 1: Run comprehensive lint and type check**
Run `npm run lint` and `tsc --noEmit` across `web/` to ensure zero errors.

- [ ] **Step 2: Run production Next.js build**
Execute `npm run build` in `web/` and verify that all static and dynamic pages compile cleanly.

- [ ] **Step 3: Verify data masking across entire repository**
Perform an automated regex scan across all files in `C:\Users\keert\Desktop\Projects\BLUSOC` to confirm zero internal emails, passwords, or company private IPs exist.

- [ ] **Step 4: Final repository commit**
Create the final cohesive git commit ready for pushing to GitHub.
