# BLUSOC Architectural Specification & Engineering Blueprint

This document specifies the technical architecture, network segmentation, telemetry pipelines, data contracts, and fault tolerance mechanisms of the BLUSOC Blue Team Security Operations platform.

---

## 1. Architectural Principles & Objectives

BLUSOC is engineered to operate under high-throughput enterprise operating conditions, where telemetry ingestion rates reach between 2,500 and 10,000 events per second (EPS). The platform balances high-speed inline event evaluation with rich contextual enrichment and reliable case tracking.

### Core Engineering Requirements

1. **Deterministic Latency**: Sensor-to-ticket ingestion latency must remain under 90 seconds for Critical and High severity intrusions.
2. **Lossless Payload Integrity**: Deep packet inspection payloads, command lines, and encoded shell strings must remain uncorrupted and untruncated up to 4,000 characters.
3. **Decoupled Asynchronous Processing**: Slow downstream external dependencies (SOAR ticket generation, threat intelligence lookups, database indexing) must never block the primary SIEM analysis daemon.
4. **Least-Privilege Network Isolation**: Analysis daemons, database backends, and container networks operate on dedicated VLANs with strict unidirectional egress rules.
5. **Zero Single Point of Telemetry Loss**: Sensor failover, local disk spooling, and integration retry backoffs ensure no security events are lost during network partitions.

---

## 2. Global Component Inventory & Interfaces

The platform comprises five functional tiers: Ingestion, SIEM Analysis, Middleware Integration, Case Management, and Presentation.

```
+---------------------------------------------------------------------------------------------------+
|                                     BLUSOC COMPONENT TOPOLOGY                                     |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [EDGE INGESTION]          [SIEM ENGINE]              [MIDDLEWARE]               [SOAR & STORAGE] |
|                                                                                                   |
|  +-----------------+       +------------------+       +------------------+       +--------------+ |
|  | Suricata DPI    | ----> | wazuh-remoted    | ----> | custom-iris.py   | ----> | DFIR-IRIS    | |
|  | (10Gbps Tap)    |       | (TCP 1514/1515)  |       | (4000-char buf,  |       | (Nginx/App/  | |
|  +-----------------+       +------------------+       |  GeoIP, Level)   |       |  Postgres)   | |
|                                      |                +------------------+       +--------------+ |
|  +-----------------+                 v                         |                        ^         |
|  | rsyslog Listener| ----> | wazuh-analysisd  |                v                        |         |
|  | (UDP/TCP 514)   |       | (Pre-decoders,   |       +------------------+              |         |
|  +-----------------+       |  XML rules engine|       | Local Dead-Letter|              |         |
|                            |  FIM syscheck)   |       | File (/var/ossec)|              |         |
|  +-----------------+                 |                +------------------+              |         |
|  | Cloudflare &    |                 v                                                  |         |
|  | SaaS Webhooks   | ----> | wazuh-integratord| ----------------------------------------+         |
|  +-----------------+       +------------------+          HTTP POST /alerts/add                    |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

### 2.1 Ingestion Layer
- **`sensor-dmz-01` (`10.240.2.5`)**: Suricata 7.x inline DPI appliance capturing raw mirrored frames from edge switch fabrics. Emits structured JSON events to `/var/log/suricata/eve.json` via dedicated AF_PACKET threads.
- **`edge-fw-01` (`10.240.0.1`)**: Next-generation edge gateway streaming syslog over UDP/TCP port 514 and TLS port 6514.
- **rsyslog Daemon (`siem-core-01`)**: Local syslog concentrator running on the Wazuh host. Buffers network syslog packets into `/var/log/blusoc/perimeter.log` with automated logrotate triggers.
- **CrowdStrike Falcon Streaming Connector**: Pulls real-time EDR events from the CrowdStrike Falcon OAuth2 Event Streams API, streaming raw JSON directly into the analysis daemon.
- **Office 365 Audit Log Ingestion**: Scheduled API collector pulling Azure Active Directory sign-in events and mailbox access logs (`MailItemsAccessed`).

### 2.2 SIEM Engine (`siem-core-01.blusoc.internal`)
- **`wazuh-remoted`**: High-concurrency network listener receiving encrypted agent telemetry over TCP port 1514 and handling agent enrollment over TCP port 1515.
- **`wazuh-analysisd`**: Multi-threaded core analysis daemon. Applies decoders, extracts named JSON fields, evaluates parent/child rule dependencies, and assigns severity levels (0 to 16).
- **`wazuh-syscheckd`**: Host File Integrity Monitoring (FIM) and Rootcheck daemon monitoring sensitive OS binaries, configuration files, and registry hives.
- **`wazuh-integratord`**: Integration broker daemon that monitors alert generation. When an alert matches configured severity thresholds (Level 8 or higher), it dispatches external integration scripts asynchronously.

### 2.3 Integration Middleware
- **`custom-iris.py` (`/var/ossec/integrations/custom-iris`)**:
  - Executable wrapper invoked by `wazuh-integratord`.
  - Expands payload inspection buffer from default 400 characters to 4,000 characters.
  - Performs autonomous RFC 1918 / RFC 5737 subnet classification and mock GeoIP enrichment.
  - Translates Wazuh severity numbers into DFIR-IRIS incident severities.
  - Dispatches authenticated REST payloads to `https://soar-iris-01.blusoc.internal/alerts/add`.
- **`iris_status_daemon.py` (`/opt/blusoc/bin/iris_status_daemon.py`)**:
  - Independent systemd background daemon (`blusoc-sync.service`).
  - Polls DFIR-IRIS API every 10 seconds for ticket status updates (`OPEN`, `IN_PROGRESS`, `CLOSED`).
  - Broadcasts case resolution state back to SIEM dashboards and web showcase endpoints.

### 2.4 Case Management & SOAR Stack (`soar-iris-01.blusoc.internal`)
- **`iris-nginx`**: Edge reverse proxy terminating TLS, handling SSL certificates, and serving static frontend assets.
- **`iris-app`**: Django/Gunicorn core application server running DFIR-IRIS v2.4+.
- **`iris-worker`**: Celery worker processes consuming tasks from RabbitMQ for heavy analytical tasks (IOC pivoting, hash lookups, evidence extraction).
- **`iris-rabbitmq`**: AMQP message broker managing Celery queues.
- **`iris-db`**: PostgreSQL 15 database instance persisting cases, evidence artifacts, user comments, and audit trails.

### 2.5 Web Application & Presentation Layer (`web/`)
- **Next.js 14 App Router**: Server-rendered and client-hydrated UI built with Tailwind CSS and Framer Motion.
- **Neon Serverless PostgreSQL**: High-availability cloud PostgreSQL database storing the 67 sanitized incident records, tuning rules, and ephemeral guest workspace state.
- **Drizzle ORM**: Type-safe schema builder and database access layer.

---

## 3. Network Segmentation & Threat Model

The network architecture enforces strict least-privilege boundary routing between six functional zones:

```
+------------------------------------------------------------------------------------+
|                             ENTERPRISE SUBNET BOUNDARIES                           |
+----------------------+-----------------+--------------------+----------------------+
| Subnet Name          | CIDR Range      | Security Zone      | Permitted Egress     |
+----------------------+-----------------+--------------------+----------------------+
| Perimeter Gateway    | 10.240.0.0/24   | Perimeter DMZ      | Egress Proxy only    |
| Core Security Hub    | 10.240.1.0/24   | Secure Core        | Local Core & Proxy   |
| Distributed Sensors  | 10.240.2.0/24   | Sensor DMZ         | SIEM Core (1514,514) |
| Corporate Workstations| 10.240.10.0/24 | Workstation LAN    | Proxy (198.51.100.x) |
| Authorized Proxies   | 198.51.100.0/24 | Public Egress      | Internet (80, 443)   |
| Cloud Interconnect   | 172.16.50.0/24  | Cloud VPC          | SIEM Core only       |
+----------------------+-----------------+--------------------+----------------------+
```

```
                                  PUBLIC INTERNET
                                         |
                                         v
                              +--------------------+
                              |  ASSET-FW-01       |
                              |  (10.240.0.1)      |
                              +--------------------+
                                         |
            +----------------------------+----------------------------+
            |                                                         |
            v                                                         v
   [Perimeter DMZ 10.240.0.0/24]                             [Sensor DMZ 10.240.2.0/24]
   +---------------------------+                             +------------------------+
   | corp-gateway-01           |                             | sensor-dmz-01          |
   | (10.240.0.10)             |                             | (10.240.2.5)           |
   | NGINX Reverse Proxy       |                             | Suricata DPI Sniffer   |
   +---------------------------+                             +------------------------+
                |                                                         |
                +----------------------------+----------------------------+
                                             |  Internal Trunk (VLAN 100)
                                             v
                                  [Secure Core 10.240.1.0/24]
                                  +-------------------------+
                                  | siem-core-01            |
                                  | (10.240.1.10)           |
                                  | Wazuh SIEM Manager      |
                                  +-------------------------+
                                               |
                        +----------------------+----------------------+
                        | HTTPS 443                                   | Internal Bridge
                        v                                             v
           +-------------------------+                   +-------------------------+
           | soar-iris-01            |                   | dc-01                   |
           | (10.240.1.15)           |                   | (10.240.1.20)           |
           | DFIR-IRIS SOAR Engine   |                   | Active Directory DC     |
           +-------------------------+                   +-------------------------+
                        ^
                        | Squid / HAProxy (HTTP 8080)
           +-------------------------+
           | Public Egress Pool      |
           | (198.51.100.14, .242)   |
           +-------------------------+
                        ^
                        | Workstation Web Traffic
           +-------------------------+
           | Workstation LAN         |
           | (10.240.10.0/24)        |
           +-------------------------+
```

### Boundary Firewall Rules

1. **Perimeter DMZ to Secure Core**:
   - Only TCP 1514 (Wazuh Agent), UDP/TCP 514 (rsyslog), and TCP 6514 (TLS syslog) are permitted from Perimeter DMZ to `siem-core-01`.
   - Direct inbound connections from Perimeter DMZ to `soar-iris-01` or `dc-01` are blocked and logged.
2. **Sensor DMZ to Secure Core**:
   - `sensor-dmz-01` streams alerts to `siem-core-01` over authenticated agent channel TCP 1514.
   - All inbound traffic into Sensor DMZ is dropped; sensors operate in promiscuous, passive listening mode.
3. **Secure Core to Public Internet**:
   - Core servers have zero direct internet access.
   - Outbound API requests (e.g., threat intelligence updates, webhook calls) must traverse corporate proxies `198.51.100.14` or `198.51.100.242` on port 8080 with mutual TLS and domain allowlisting.
4. **Workstation LAN Isolation**:
   - Workstation subnets cannot communicate directly with the Secure Core network except on port 1514 to the Wazuh Manager.
   - External web traffic is forced through proxy egress nodes via WPAD / Active Directory group policy.

---

## 4. Telemetry Pipelines, Payload Schemas & Message Queues

### 4.1 Ingestion Pipeline: Wazuh Analysis Daemon
When an event arrives via syslog or agent socket, `wazuh-analysisd` parses the message in three phases:
1. **Pre-Decoding**: Extracts timestamp, hostname, and program name from standard RFC 3164 / 5424 headers.
2. **Decoding**: Dynamic JSON decoders unpack structured fields (e.g., `src_ip`, `dst_port`, `http_user_agent`, `rule_id`).
3. **Rule Matching**: Rules are evaluated in topological order based on parent-child dependencies and regex filters.

```
Raw Sensor Syslog Frame
        |
        v
Pre-Decoder (Extract timestamp, host, daemon)
        |
        v
Decoder Engine (JSON / Syslog regex extractor)
        |
        v
Rule Evaluation Hierarchy:
  - Match Level 0 Noise Rules (100010, 86611, 100550, 91578) -> Drop immediately
  - Match High Severity Rules (86601, 100011, 100400, 91580) -> Trigger Integrator
        |
        v
Write Alert JSON to /var/ossec/logs/alerts/alerts.json
```

### 4.2 Data Contract: Wazuh Alert Schema
When `wazuh-analysisd` triggers an alert, it writes an alert object formatted as:

```json
{
  "timestamp": "2026-11-10T14:22:18.412+0000",
  "rule": {
    "level": 12,
    "description": "Critical: GPL Apache/PHP Remote Code Execution attempt detected",
    "id": "100400",
    "mitre": {
      "id": ["T1190"],
      "tactic": ["Initial Access"],
      "technique": ["Exploit Public-Facing Application"]
    },
    "groups": ["web", "exploit", "rce"]
  },
  "agent": {
    "id": "002",
    "name": "corp-gateway-01",
    "ip": "10.240.0.10"
  },
  "data": {
    "src_ip": "64.62.156.159",
    "dest_ip": "10.240.0.211",
    "dest_port": "443",
    "proto": "TCP",
    "http": {
      "url": "/wp-content/plugins/wp-file-manager/lib/php/connector.minimal.php?cmd=upload",
      "method": "POST",
      "user_agent": "Mozilla/5.0 (Hydra-Exploit-Engine/2.1)",
      "status": 500
    }
  },
  "full_log": "POST /wp-content/plugins/wp-file-manager/lib/php/connector.minimal.php?cmd=upload HTTP/1.1\r\nHost: target.blusoc.internal\r\nUser-Agent: Mozilla/5.0 (Hydra-Exploit-Engine/2.1)\r\nContent-Type: multipart/form-data; boundary=---------------------------974767299852498929531610575\r\n\r\n-----------------------------974767299852498929531610575\r\nContent-Disposition: form-data; name=\"upload[]\"; filename=\"shell.php\"\r\nContent-Type: application/x-php\r\n\r\n<?php system($_GET['e']); ?>\r\n-----------------------------974767299852498929531610575--"
}
```

### 4.3 Data Contract: Enriched DFIR-IRIS Payload
`custom-iris.py` transforms the raw Wazuh alert, expands payload fields up to 4,000 characters, resolves GeoIP metadata, and submits the payload to `/alerts/add`:

```json
{
  "alert_title": "[Wazuh L12] Critical: GPL Apache/PHP Remote Code Execution attempt detected",
  "alert_description": "Rule 100400 fired on corp-gateway-01 (10.240.0.10). Source: 64.62.156.159. Destination: 10.240.0.211:443. MITRE: T1190. Payload captured: 384 chars.",
  "alert_source": "Wazuh SIEM",
  "alert_source_ref": "100400-1762784538",
  "alert_severity_id": 6,
  "alert_status_id": 1,
  "alert_customer_id": 1,
  "alert_source_link": "https://siem-core-01.blusoc.internal/#/rules?id=100400",
  "alert_raw_content": "POST /wp-content/plugins/wp-file-manager/lib/php/connector.minimal.php?cmd=upload HTTP/1.1\r\nHost: target.blusoc.internal\r\n...",
  "alert_iocs": [
    {
      "ioc_value": "64.62.156.159",
      "ioc_type": "ip",
      "ioc_description": "External attacking source IP"
    },
    {
      "ioc_value": "shell.php",
      "ioc_type": "filename",
      "ioc_description": "Uploaded web shell artifact"
    }
  ],
  "alert_context": {
    "geo_country": "United States of America",
    "geo_country_code": "US",
    "geo_city": "San Jose",
    "geo_asn": "AS6939 Hurricane Electric LLC",
    "source_classification": "public_threat_intel",
    "mitre_technique_id": "T1190",
    "wazuh_agent": "corp-gateway-01",
    "target_asset": "corp-linux-02.blusoc.internal"
  }
}
```

### 4.4 DFIR-IRIS Internal Task Broker (RabbitMQ & Celery)
Within the IRIS container stack, the webhook payload is ingested by the Django REST API and placed into RabbitMQ. Celery worker processes execute downstream enrichment asynchronously:
- Task 1: Deduplication hash calculation (`md5(src_ip + dest_ip + rule_id + hour)`).
- Task 2: Case correlation: If an existing case with matching source IP was opened within 4 hours, append the alert as an evidence node rather than spawning a duplicate ticket.
- Task 3: Notification webhook dispatch to analyst Slack/Mattermost channels.

---

## 5. High Availability, Fault Tolerance & Recovery Procedures

```
+-----------------------------------------------------------------------------------+
|                        RESILIENT ERROR HANDLING & RECOVERY                        |
+---------------------+-------------------------------+-----------------------------+
| Failure Mode        | Impact Scope                  | Automated Recovery Path     |
+---------------------+-------------------------------+-----------------------------+
| DFIR-IRIS API Down  | Alert forwarding suspended    | Exponential backoff retry;  |
|                     |                               | Spool to integrations.log   |
+---------------------+-------------------------------+-----------------------------+
| Network Partition   | Edge sensors cannot reach SIEM| Local disk spooling (100MB) |
|                     |                               | on agents; auto-resync      |
+---------------------+-------------------------------+-----------------------------+
| Sync Daemon Crash   | Ticket state stale in UI      | systemd auto-restart (5s)   |
|                     |                               | with journald alerting      |
+---------------------+-------------------------------+-----------------------------+
| Neon DB Cold Start  | Web UI first query delay      | Serverless warm pool +      |
|                     |                               | embedded JSON fallback cache|
+---------------------+-------------------------------+-----------------------------+
```

### 5.1 Local Disk Spooling & Agent Buffering
If network connectivity between remote sensors and `siem-core-01` fails:
- Wazuh agents automatically buffer events in memory and spool to `/var/ossec/queue/ossec/` on disk (configured with a 100 MB circular buffer).
- When the connection restores, agents resume streaming from the exact byte offset without dropping events.

### 5.2 Integration Middleware Retry Backoff
In `integrations/custom-iris/custom-iris.py`, HTTP POST operations to DFIR-IRIS implement an automated retry loop:
- Initial attempt timeout: 10 seconds.
- Upon 502/503/504 HTTP status or connection drop, the script executes up to 3 retry attempts with exponential backoff (`2s`, `4s`, `8s`).
- If IRIS remains unreachable, the raw enriched alert payload is written to `/var/ossec/logs/integrations-failed.json` as a dead-letter queue. A secondary recovery cron scans this file and replays failed alerts when IRIS returns to healthy status.

### 5.3 Systemd Watchdog & Daemon Supervision
The bi-directional synchronization service is monitored by systemd:

```ini
[Unit]
Description=BLUSOC DFIR-IRIS Real-Time Ticket Synchronization Daemon
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=blusoc
WorkingDirectory=/opt/blusoc/bin
ExecStart=/usr/bin/python3 /opt/blusoc/bin/iris_status_daemon.py
Restart=always
RestartSec=5s
StandardOutput=append:/var/log/blusoc/iris_sync.log
StandardError=append:/var/log/blusoc/iris_sync_err.log

[Install]
WantedBy=multi-user.target
```

If the daemon encounters an unhandled exception, systemd restarts the process within 5 seconds, preserving continuous synchronization without human intervention.

### 5.4 Database Resilience & Ephemeral Workspace Fallback
In the web presentation layer:
- The Neon PostgreSQL connection uses connection pooling (`@neondatabase/serverless`).
- If an external database connection failure occurs, `web/src/lib/db.ts` falls back gracefully to embedded local datasets (`web/src/data/fallback_alerts.json`), allowing portfolio visitors to navigate and inspect alerts without experiencing 500 application errors.

---

## 6. Summary

The BLUSOC architectural blueprint provides enterprise security teams with a resilient, scalable blueprint that combines high-throughput packet inspection, deterministic alert reduction, zero payload truncation, and automated case management within a strictly segmented network perimeter.
