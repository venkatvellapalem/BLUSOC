export interface StageMetric {
  throughput: string;
  latency: string;
  dropRate: string;
  buffer: string;
}

export interface StageLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'DROP' | 'ALERT' | 'CRITICAL';
  message: string;
}

export interface StageSpec {
  label: string;
  value: string;
}

export interface PipelineStageData {
  id: string;
  stageNumber: number;
  title: string;
  shortTitle: string;
  role: string;
  description: string;
  technology: string;
  metrics: StageMetric;
  components: string[];
  configTitle: string;
  configLanguage: string;
  configSnippet: string;
  logs: StageLog[];
  specs: StageSpec[];
}

export interface SimulationStepLog {
  step: number;
  stage: string;
  tag: string;
  text: string;
}

export interface SimulationPreset {
  id: string;
  name: string;
  category: string;
  outcome: 'suppressed' | 'forwarded';
  severity: 'INFORMATIONAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ruleId: string;
  ruleLevel: number;
  source: string;
  clientIp: string;
  targetAsset: string;
  description: string;
  pathStages: number[];
  terminalLogs: SimulationStepLog[];
}

export const PIPELINE_STAGES: PipelineStageData[] = [
  {
    id: "stage-sensors",
    stageNumber: 1,
    title: "Perimeter Ingestion & Distributed Sensors",
    shortTitle: "Perimeter Sensors",
    role: "Multi-Source Distributed Telemetry Ingress",
    description: "Captures 14,280 daily security telemetry events from perimeter network taps, endpoint EDR agents, mail gateways, and edge WAF proxies across the BLUSOC network.",
    technology: "Suricata 7.0 DPI, CrowdStrike Falcon, Barracuda ESG, Cloudflare WAF",
    metrics: {
      throughput: "14,280 eps",
      latency: "0.4 ms",
      dropRate: "0.0%",
      buffer: "12% heap",
    },
    components: [
      "Suricata 7.0 DPI (enp2s0 tap)",
      "CrowdStrike Falcon Sensor (EDR stream)",
      "Barracuda CloudGen Gateway",
      "Cloudflare WAF Edge Proxy",
    ],
    configTitle: "/etc/suricata/suricata.yaml & rsyslog.conf",
    configLanguage: "yaml",
    configSnippet: `# /etc/suricata/suricata.yaml (EVE JSON Telemetry Stream)
outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: /var/log/suricata/eve.json
      types:
        - alert:
            payload: yes
            payload-buffer-size: 4096
            metadata: yes
            http-body: yes
        - flow
        - dns

# /etc/rsyslog.d/30-blusoc-sensors.conf
$ModLoad imudp
$UDPServerRun 514
$ModLoad imtcp
$InputTCPServerRun 514
template(name="WazuhJsonFormat" type="string" string="%rawmsg%\\n")
if $programname == 'suricata' or $programname == 'crowdstrike' then {
    action(type="omfile" file="/var/log/remote/sensors.log" template="WazuhJsonFormat")
}`,
    logs: [
      { timestamp: "17:14:02.102", level: "INFO", message: "suricata[1942]: Ingress mirror frame accepted on enp2s0 (10.240.0.10:20443)" },
      { timestamp: "17:14:02.148", level: "INFO", message: "crowdstrike-stream: Agent telemetry burst received from corp-endpoint-115" },
      { timestamp: "17:14:02.210", level: "INFO", message: "cloudflare-waf: Ingress edge log batch received (42 requests)" },
      { timestamp: "17:14:02.390", level: "WARN", message: "barracuda-gw: Ingress rate spike detected on DMZ interface eth0" },
    ],
    specs: [
      { label: "Interface Hardware", value: "Intel X520 Dual-Port 10GbE SFP+" },
      { label: "Capture Ring Buffer", value: "2,048 MB AF_PACKET ring buffer" },
      { label: "Ingress Protocol", value: "Syslog over TLS (RFC 5425) & EVE JSON" },
      { label: "Daily Volume", value: "14,280 events (avg 165 eps)" },
    ],
  },
  {
    id: "stage-wazuh",
    stageNumber: 2,
    title: "Wazuh SIEM Analysis Engine",
    shortTitle: "Wazuh SIEM Engine",
    role: "Decoders, Rule Evaluation & Suppression Matrix",
    description: "Evaluates normalized events against 1,400+ custom detection rules. Aggressive Level 0 suppression eliminates 14,096 benign events per day (98.7% noise filter) before SOAR dispatch.",
    technology: "Wazuh Manager 4.9, ossec-analysisd, blusoc-ruleset",
    metrics: {
      throughput: "14,280 in -> 184 out",
      latency: "0.8 ms",
      dropRate: "98.7%",
      buffer: "24% heap",
    },
    components: [
      "JSON & Syslog Pre-Decoders",
      "Rule Evaluation Matrix (Level 0 - 12)",
      "Suppression Engine (Rules 100010, 86611, 91578)",
      "Suppressed Noise Sink (14,096 dropped)",
    ],
    configTitle: "/var/ossec/etc/rules/01_suppression_rules.xml",
    configLanguage: "xml",
    configSnippet: `<group name="blusoc,suppression,noise_reduction,">
  <!-- Rule 100010: CrowdStrike Falcon parent telemetry and null-hostname suppression -->
  <rule id="100010" level="0">
    <decoded_as>json</decoded_as>
    <field name="vendor">^CrowdStrike$</field>
    <field name="hostname">^$|^-$|^UNKNOWN$|^null$</field>
    <description>CrowdStrike Falcon: Suppress parent telemetry stream and null-hostname floods</description>
    <group>crowdstrike,noise_suppression,parent_rule,</group>
  </rule>

  <!-- Rule 86611: Suricata ethertype unknown framing anomaly suppression -->
  <rule id="86611" level="0">
    <match>SURICATA Ethertype unknown</match>
    <description>Suricata: Suppress benign ethertype unknown and link-layer frame warnings</description>
    <group>suricata,noise_suppression,link_layer,</group>
  </rule>

  <!-- Rule 91578: Office 365 benign egress proxy filter -->
  <rule id="91578" level="0">
    <if_sid>91577</if_sid>
    <field name="office365.ClientIP">^198\\.51\\.100\\.</field>
    <description>Office 365: Filter benign logins from corporate proxy egress IP pool</description>
    <group>office365,proxy_egress,tuning,</group>
  </rule>
</group>`,
    logs: [
      { timestamp: "17:14:02.250", level: "DROP", message: "ossec-analysisd: Rule 100010 matched (Level 0) -> CrowdStrike null hostname dropped" },
      { timestamp: "17:14:02.312", level: "DROP", message: "ossec-analysisd: Rule 91578 matched (Level 0) -> Egress proxy 198.51.100.14 dropped" },
      { timestamp: "17:14:02.404", level: "ALERT", message: "ossec-analysisd: Rule 86601 matched (Level 10) -> ET CINS Threat Intel forwarded" },
      { timestamp: "17:14:02.510", level: "CRITICAL", message: "ossec-analysisd: Rule 100400 matched (Level 12) -> GPL RCE id check root forwarded" },
    ],
    specs: [
      { label: "Active Rules Count", value: "1,420 rules loaded" },
      { label: "Suppression Filter", value: "98.7% noise dropped at engine" },
      { label: "Execution Threads", value: "8 parallel worker threads" },
      { label: "Forwarding Threshold", value: "Rule Level >= 6 (Actionable only)" },
    ],
  },
  {
    id: "stage-enricher",
    stageNumber: 3,
    title: "Custom Python Enrichment Middleware",
    shortTitle: "Python Enricher",
    role: "custom-iris.py Buffer Protection & GeoIP Enrichment",
    description: "Invoked by Wazuh integratord daemon. Enforces 4,000-character payload retention to prevent log clipping, decorates public IPs with ASN/GeoIP data, and normalizes severity.",
    technology: "Python 3.11, custom-iris.py, MaxMind GeoIP2",
    metrics: {
      throughput: "184 alerts/day",
      latency: "1.1 ms",
      dropRate: "0.0%",
      buffer: "18% heap",
    },
    components: [
      "4,000-char Buffer Manager (Truncation Fix)",
      "MaxMind GeoIP & ASN Decorator",
      "Dynamic Severity Translator (Wazuh -> IRIS)",
      "Payload Sanitizer & RFC 1918 Validator",
    ],
    configTitle: "/var/ossec/integrations/custom-iris.py",
    configLanguage: "python",
    configSnippet: `# /var/ossec/integrations/custom-iris.py (Key Enrichment Logic)
MAX_LOG_LENGTH = 4000

def truncate_log(log_text: str, max_chars: int = MAX_LOG_LENGTH) -> str:
    """
    Preserves log text up to max_chars characters.
    Expands default 400-char truncation cap to 4000 characters to ensure
    deep packet inspection and PowerShell execution payloads are intact.
    """
    if not isinstance(log_text, str):
        log_text = str(log_text)
    if len(log_text) <= max_chars:
        return log_text
    return log_text[: max_chars - 3] + "..."

def map_severity(wazuh_level: int) -> int:
    """
    Translates Wazuh rule levels into DFIR-IRIS severity IDs.
    Level >= 12: Critical (6), 9-11: High (5), 6-8: Medium (1), 3-5: Low (4)
    """
    if wazuh_level >= 12: return 6
    if wazuh_level >= 9: return 5
    if wazuh_level >= 6: return 1
    if wazuh_level >= 3: return 4
    return 3`,
    logs: [
      { timestamp: "17:14:02.420", level: "INFO", message: "custom-iris: Alert #9182 received from Wazuh integratord" },
      { timestamp: "17:14:02.435", level: "INFO", message: "custom-iris: Truncation check passed (length 3,842 chars <= 4,000 cap)" },
      { timestamp: "17:14:02.450", level: "INFO", message: "custom-iris: GeoIP resolved: 64.62.156.159 -> San Jose, US (AS6939 Hurricane Electric)" },
      { timestamp: "17:14:02.465", level: "INFO", message: "custom-iris: Severity mapped: Wazuh L10 -> IRIS Severity ID 5 (High)" },
    ],
    specs: [
      { label: "Truncation Limit", value: "4,000 chars (10x expansion from default)" },
      { label: "GeoIP Resolution", value: "Local MaxMind City & ASN database" },
      { label: "Transport Security", value: "HTTPS with TLS 1.3 verification" },
      { label: "Average Execution", value: "1.1 ms per invocation" },
    ],
  },
  {
    id: "stage-soar",
    stageNumber: 4,
    title: "DFIR-IRIS SOAR & Case Management",
    shortTitle: "DFIR-IRIS SOAR",
    role: "Automated Case Ingestion & Dynamic SLA Dispatch",
    description: "Receives enriched JSON alerts via authenticated REST API /alerts/add, generates structured IRIS cases, links IOC indicators, and starts dynamic SLA countdown timers.",
    technology: "DFIR-IRIS 2.4, PostgreSQL, Redis, Celery",
    metrics: {
      throughput: "184 cases/day",
      latency: "0.5 ms",
      dropRate: "0.0%",
      buffer: "8% heap",
    },
    components: [
      "REST Webhook Endpoint (/alerts/add)",
      "Automated Case & Alert Deduplication",
      "Dynamic SLA Timer Engine (15m - 4h)",
      "IOC Indicator Linking (IP, Domain, Hash)",
    ],
    configTitle: "REST API Alert Schema Payload",
    configLanguage: "json",
    configSnippet: `POST https://soar-iris-01.blusoc.internal/alerts/add
Authorization: Bearer <BLUSOC_IRIS_API_KEY>
Content-Type: application/json

{
  "alert_title": "[Wazuh L10] Suricata DPI: ET DROP Blocklisted IP",
  "alert_description": "Perimeter ingress match on CINS/DROP IP 64.62.156.159 targeting 10.240.0.10:20443",
  "alert_source": "Wazuh-SOC",
  "alert_source_ref": "alert-1724479219-9128",
  "alert_severity_id": 5,
  "alert_status_id": 1,
  "alert_customer_id": 1,
  "alert_iocs": [
    { "ioc_value": "64.62.156.159", "ioc_type": "ip-dst", "ioc_description": "External Attacker IP" }
  ],
  "alert_context": {
    "geoip_asn": "AS6939 Hurricane Electric LLC",
    "geoip_country": "US",
    "wazuh_rule_id": 86601,
    "wazuh_level": 10,
    "sensor": "corp-gateway-01.blusoc.internal"
  }
}`,
    logs: [
      { timestamp: "17:14:02.480", level: "INFO", message: "iris-api: POST /alerts/add 201 Created in 4.8ms" },
      { timestamp: "17:14:02.495", level: "INFO", message: "iris-case: Incident case IRIS-2026-104 initialized" },
      { timestamp: "17:14:02.502", level: "INFO", message: "iris-ioc: Extracted IOC 64.62.156.159 added to evidence pool" },
      { timestamp: "17:14:02.510", level: "ALERT", message: "iris-sla: Tier 2 High SLA engaged: 60-minute resolution timer active" },
    ],
    specs: [
      { label: "API Ingestion Latency", value: "< 5 ms per payload" },
      { label: "SLA Matrix", value: "P1: 15m | P2: 60m | P3: 4h" },
      { label: "Evidence Store", value: "PostgreSQL 16 with WAL archiving" },
      { label: "Sync Daemon", value: "iris_status_daemon.py polling every 10s" },
    ],
  },
  {
    id: "stage-workbench",
    stageNumber: 5,
    title: "Analyst Triage Workbench",
    shortTitle: "Analyst Workbench",
    role: "Tier 1/2 Queue Dispatch & Ticket Closing Gate",
    description: "Dispatches actionable cases to Tier 1 and Tier 2 analysts. Enforces closing gate validation requiring confirmed True/False positive verdicts and forensic notes.",
    technology: "BLUSOC Next.js Workbench, Neon PostgreSQL, RBAC",
    metrics: {
      throughput: "184 tickets/day",
      latency: "8 min MTTR",
      dropRate: "0.0%",
      buffer: "0% lag",
    },
    components: [
      "Role-Based Queue Dispatch (Tier 1/2/3)",
      "Raw Log Forensic Viewer & Diff Inspector",
      "Strict Closing Gate Validation Engine",
      "Investigative Feedback & Metric Feedback Loop",
    ],
    configTitle: "/etc/blusoc/triage-policy.yaml",
    configLanguage: "yaml",
    configSnippet: `# /etc/blusoc/triage-policy.yaml (Analyst Workflow & Closing Gate)
sla_thresholds:
  critical_p1: 15m   # Wazuh L12+, GPL RCE, Ransomware execution
  high_p2: 60m       # Wazuh L9-L11, Threat intel match, Account takeover
  medium_p3: 4h      # Wazuh L6-L8, Suspicious recon, anomalous user-agent

closing_gate_requirements:
  root_cause_classification: mandatory (True Positive | False Positive | Suspicious)
  investigative_notes: min_length 20 chars
  containment_actions:
    - block_ip
    - isolate_endpoint
    - revoke_token
    - tuning_proposal
  signoff_analyst_tier: Tier 1 triage, Tier 2 escalation for P1/P2`,
    logs: [
      { timestamp: "17:14:02.520", level: "INFO", message: "workbench-queue: Alert IRIS-2026-104 dispatched to analyst.vance (Tier 2)" },
      { timestamp: "17:14:02.750", level: "INFO", message: "workbench-triage: Raw JSON event inspection opened by analyst" },
      { timestamp: "17:14:05.110", level: "ALERT", message: "workbench-verdict: Verdict 'True Positive' submitted for alert IRIS-2026-104" },
      { timestamp: "17:14:05.220", level: "INFO", message: "workbench-close: Closing gate validated. Ticket closed in 2m 42s." },
    ],
    specs: [
      { label: "Active Analyt Queue", value: "Tier 1 (Ross), Tier 2 (Vance), Tier 3 (Chen)" },
      { label: "Average MTTR", value: "8 minutes (reduced from 42 minutes)" },
      { label: "Closing Gate Enforcement", value: "100% compliance mandatory" },
      { label: "Dataset Coverage", value: "67 sanitized confirmed attack scenarios" },
    ],
  },
];

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: "o365-proxy",
    name: "O365 Proxy Egress Login",
    category: "Noise Suppression",
    outcome: "suppressed",
    severity: "INFORMATIONAL",
    ruleId: "91578",
    ruleLevel: 0,
    source: "Office 365 / Azure AD",
    clientIp: "198.51.100.14",
    targetAsset: "auth.blusoc.internal",
    description: "Corporate SaaS login from verified egress proxy gateway 198.51.100.14. Filtered at Wazuh engine.",
    pathStages: [1, 2],
    terminalLogs: [
      { step: 1, stage: "Perimeter Ingestion", tag: "INGEST", text: "Ingress proxy telemetry received from 198.51.100.14 (Azure AD login, user=sarah.connor@blusoc.internal)" },
      { step: 2, stage: "Wazuh SIEM", tag: "DECODER", text: "JSON decoder parsed Office 365 authentication event. Evaluating rule hierarchy..." },
      { step: 2, stage: "Wazuh SIEM", tag: "RULE-MATCH", text: "Rule 91578 triggered: ClientIP matches corporate egress proxy subnet 198.51.100.0/24" },
      { step: 2, stage: "Suppression Engine", tag: "SUPPRESSED", text: "Rule level set to 0. Event dropped to noise sink. ZERO false ticket noise forwarded to IRIS SOAR." },
    ],
  },
  {
    id: "et-drop-cins",
    name: "ET DROP CINS Blocklisted IP",
    category: "Threat Intelligence",
    outcome: "forwarded",
    severity: "HIGH",
    ruleId: "86601",
    ruleLevel: 10,
    source: "Suricata DPI Tap",
    clientIp: "64.62.156.159",
    targetAsset: "corp-gateway-01.blusoc.internal",
    description: "Inbound probe from CINS Army reputation blocklist. Evaluated at L10, GeoIP enriched, ticket created.",
    pathStages: [1, 2, 3, 4, 5],
    terminalLogs: [
      { step: 1, stage: "Perimeter Ingestion", tag: "INGEST", text: "Suricata DPI sensor enp2s0 intercepted TCP SYN packet from 64.62.156.159 targeting 10.240.0.10:20443" },
      { step: 2, stage: "Wazuh SIEM", tag: "RULE-MATCH", text: "Rule 86601 matched: ET CINS Active Threat Intelligence Poor Reputation IP group 127 (Level 10)" },
      { step: 3, stage: "Python Enricher", tag: "ENRICH", text: "custom-iris.py invoked. GeoIP resolved: San Jose, US (AS6939 Hurricane Electric). 4,000-char buffer intact." },
      { step: 4, stage: "DFIR-IRIS SOAR", tag: "SOAR-DISPATCH", text: "HTTP POST /alerts/add succeeded (201 Created). Initialized Case IRIS-2026-104 (Severity High, 60m SLA)." },
      { step: 5, stage: "Analyst Workbench", tag: "TRIAGE-QUEUE", text: "Dispatched to Tier 2 SOC Analyst queue. Awaiting IOC verification and closing verdict." },
    ],
  },
  {
    id: "crowdstrike-null",
    name: "CrowdStrike Null-Hostname Ping",
    category: "Noise Suppression",
    outcome: "suppressed",
    severity: "INFORMATIONAL",
    ruleId: "100010",
    ruleLevel: 0,
    source: "CrowdStrike Falcon Sensor",
    clientIp: "10.240.10.201",
    targetAsset: "corp-endpoint-unassigned",
    description: "Unassigned endpoint sensor heartbeat flood with null hostname. Filtered at Wazuh engine.",
    pathStages: [1, 2],
    terminalLogs: [
      { step: 1, stage: "Perimeter Ingestion", tag: "INGEST", text: "CrowdStrike syslog listener received unassigned endpoint heartbeat from 10.240.10.201" },
      { step: 2, stage: "Wazuh SIEM", tag: "DECODER", text: "JSON decoder extracted vendor='CrowdStrike', hostname='null'" },
      { step: 2, stage: "Wazuh SIEM", tag: "RULE-MATCH", text: "Rule 100010 matched: Vendor CrowdStrike with null/hyphen hostname regex filter" },
      { step: 2, stage: "Suppression Engine", tag: "SUPPRESSED", text: "Rule level set to 0. Suppressed 100+ events/min storm. Zero ticket noise generated." },
    ],
  },
  {
    id: "gpl-rce",
    name: "GPL Web Server RCE Attempt",
    category: "Critical Incident",
    outcome: "forwarded",
    severity: "CRITICAL",
    ruleId: "100400",
    ruleLevel: 12,
    source: "Suricata DPI / Web Server",
    clientIp: "108.157.238.122",
    targetAsset: "corp-linux-07.blusoc.internal",
    description: "Remote code execution exploit response (id check returned root). L12 Critical case created with 15m SLA.",
    pathStages: [1, 2, 3, 4, 5],
    terminalLogs: [
      { step: 1, stage: "Perimeter Ingestion", tag: "INGEST", text: "Suricata DPI on dmz-gw-01 detected inbound HTTP exploit payload against corp-linux-07.blusoc.internal" },
      { step: 2, stage: "Wazuh SIEM", tag: "RULE-MATCH", text: "Rule 100400 matched: GPL ATTACK_RESPONSE id check returned root (Level 12 CRITICAL)" },
      { step: 3, stage: "Python Enricher", tag: "ENRICH", text: "custom-iris.py invoked. Preserved 3,920-byte attack payload with shell commands. GeoIP: US (AS16509)." },
      { step: 4, stage: "DFIR-IRIS SOAR", tag: "SOAR-DISPATCH", text: "HTTP POST /alerts/add created Incident IRIS-2026-088. Severity Critical (6), 15-minute P1 SLA countdown engaged." },
      { step: 5, stage: "Analyst Workbench", tag: "TRIAGE-QUEUE", text: "Escalated to Tier 3 Lead Blue Team Engineer (Marcus Chen). Containment action mandatory." },
    ],
  },
];
