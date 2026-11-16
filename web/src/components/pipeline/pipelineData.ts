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

export type SimulationOutcome = 'suppressed' | 'iris' | 'notify' | 'contain';

export interface SimulationPreset {
  id: string;
  name: string;
  category: string;
  outcome: SimulationOutcome;
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
    title: "Telemetry Ingestion & Sensors",
    shortTitle: "Sensors",
    role: "Multi-source security telemetry ingress",
    description:
      "Collects endpoint, network, email, identity, and edge telemetry from CrowdStrike Falcon, Suricata, Barracuda, Sophos, Microsoft 365, and Cloudflare.",
    technology: "Suricata 7, CrowdStrike Falcon, Barracuda, Sophos, Microsoft 365, Cloudflare WAF",
    metrics: {
      throughput: "14,280 eps",
      latency: "0.4 ms",
      dropRate: "0.0%",
      buffer: "12% heap",
    },
    components: [
      "Suricata DPI (enp2s0 tap)",
      "CrowdStrike Falcon EDR telemetry",
      "Barracuda email & gateway logs",
      "Sophos endpoint protection events",
      "Microsoft 365 identity & audit logs",
      "Cloudflare edge/WAF traffic",
    ],
    configTitle: "Sensor ingestion overview",
    configLanguage: "yaml",
    configSnippet: `# Representative multi-source ingestion
sources:
  - crowdstrike_falcon: edr_telemetry
  - suricata: eve_json_alerts
  - barracuda: email_gateway_syslog
  - sophos: endpoint_events
  - microsoft_365: identity_audit_signin
  - cloudflare: edge_waf_logpush
transport:
  - syslog_tls
  - json_stream
  - api_pull
normalization: wazuh_decoders`,
    logs: [
      { timestamp: "17:14:02.102", level: "INFO", message: "suricata: DPI alert ingested from enp2s0 (10.240.0.10:20443)" },
      { timestamp: "17:14:02.148", level: "INFO", message: "crowdstrike: endpoint telemetry batch received from corp-endpoint-115" },
      { timestamp: "17:14:02.210", level: "INFO", message: "m365: sign-in audit event received (analyst.vance@blusoc.internal)" },
      { timestamp: "17:14:02.318", level: "INFO", message: "barracuda: inbound email event queued for correlation" },
    ],
    specs: [
      { label: "Sources", value: "EDR, IDS, email, identity, endpoint, edge" },
      { label: "Daily volume", value: "14,280 events (representative)" },
      { label: "Normalization", value: "Wazuh decoders & field extraction" },
      { label: "Transport", value: "Syslog TLS / JSON streams / APIs" },
    ],
  },
  {
    id: "stage-wazuh",
    stageNumber: 2,
    title: "Wazuh Correlation & Suppression",
    shortTitle: "Wazuh",
    role: "Decode, correlate, score, and suppress noise",
    description:
      "Wazuh normalizes incoming telemetry, applies correlation and detection rules, suppresses known benign noise, and forwards qualifying alerts to Laya.",
    technology: "Wazuh Manager 4.8, ossec-analysisd, custom rules",
    metrics: {
      throughput: "14,280 in / 184 actionable",
      latency: "0.8 ms",
      dropRate: "98.7%",
      buffer: "24% heap",
    },
    components: [
      "Decoders & field extraction",
      "Correlation and rule evaluation (L0-L12)",
      "Level 0 suppression for known benign patterns",
      "Qualifying alert forwarding to Laya",
    ],
    configTitle: "/var/ossec/etc/rules/local_rules.xml (excerpt)",
    configLanguage: "xml",
    configSnippet: `<group name="blusoc,suppression,correlation,">
  <!-- Benign/noise suppression -->
  <rule id="100010" level="0">
    <decoded_as>json</decoded_as>
    <field name="vendor">^CrowdStrike$</field>
    <field name="hostname">^$|^-$|^null$</field>
    <description>Suppress null-host CrowdStrike heartbeat noise</description>
  </rule>

  <!-- Qualifying alert forwarded to Laya -->
  <rule id="86601" level="10">
    <if_group>suricata</if_group>
    <match>ET DROP|CINS|threat intel</match>
    <description>Qualifying threat-intel match forwarded to Laya</description>
    <group>laya_qualifying,</group>
  </rule>
</group>`,
    logs: [
      { timestamp: "17:14:02.250", level: "DROP", message: "rule 100010 (L0): null-host heartbeat suppressed" },
      { timestamp: "17:14:02.312", level: "DROP", message: "rule 91578 (L0): trusted O365 egress login filtered" },
      { timestamp: "17:14:02.404", level: "ALERT", message: "rule 86601 (L10): qualifying alert forwarded to Laya" },
      { timestamp: "17:14:02.510", level: "CRITICAL", message: "rule 100400 (L12): high-severity event forwarded to Laya" },
    ],
    specs: [
      { label: "Rule set", value: "1,400+ tuned detection rules" },
      { label: "Suppression", value: "98.7% benign noise dropped at engine" },
      { label: "Forwarding", value: "Only qualifying alerts sent to Laya" },
      { label: "Workers", value: "8 parallel analysis workers" },
    ],
  },
  {
    id: "stage-enrich",
    stageNumber: 3,
    title: "Enrichment Middleware",
    shortTitle: "Enrichment",
    role: "Context, buffer protection, and normalization",
    description:
      "Qualifying alerts are enriched with GeoIP/ASN context and normalized payloads, preserving full forensic detail before Laya triage.",
    technology: "Python middleware, MaxMind GeoIP, payload normalization",
    metrics: {
      throughput: "184 alerts/day",
      latency: "1.1 ms",
      dropRate: "0.0%",
      buffer: "18% heap",
    },
    components: [
      "4,000-char payload buffer protection",
      "GeoIP and ASN enrichment",
      "Severity and schema normalization",
      "IOC/context extraction for triage",
    ],
    configTitle: "/var/ossec/integrations/custom-iris.py (excerpt)",
    configLanguage: "python",
    configSnippet: `MAX_LOG_LENGTH = 4000

def enrich(alert):
    alert["full_log"] = truncate_log(alert.get("full_log", ""))
    ip = alert.get("data", {}).get("srcip")
    if ip and is_public(ip):
        alert["geo"] = geoip_lookup(ip)
    alert["severity"] = map_severity(alert.get("rule", {}).get("level", 0))
    return alert

# Enriched qualifying alert is forwarded to Laya`,
    logs: [
      { timestamp: "17:14:02.420", level: "INFO", message: "enricher: qualifying alert received from Wazuh" },
      { timestamp: "17:14:02.435", level: "INFO", message: "enricher: payload preserved (3,842 chars <= 4,000)" },
      { timestamp: "17:14:02.450", level: "INFO", message: "enricher: GeoIP resolved 64.62.156.159 -> US (AS6939)" },
      { timestamp: "17:14:02.465", level: "INFO", message: "enricher: normalized alert forwarded to Laya" },
    ],
    specs: [
      { label: "Payload cap", value: "4,000 characters preserved" },
      { label: "Context", value: "GeoIP/ASN and IOC extraction" },
      { label: "Output", value: "Normalized qualifying alert for Laya" },
      { label: "Latency", value: "~1.1 ms per alert" },
    ],
  },
  {
    id: "stage-laya",
    stageNumber: 4,
    title: "Laya Triage & Decision",
    shortTitle: "Laya",
    role: "AI-assisted triage of qualifying alerts",
    description:
      "Laya reviews qualifying alerts from Wazuh, determines confidence and verdict, and routes outcomes: only true positive, high-confidence alerts to DFIR-IRIS for analyst investigation, alerts to Discord/Slack, and containment actions to FortiGate.",
    technology: "Laya triage engine, routing policies",
    metrics: {
      throughput: "184 qualifying/day",
      latency: "0.6 ms",
      dropRate: "0.0%",
      buffer: "10% queue",
    },
    components: [
      "Qualifying alert intake from Wazuh",
      "Confidence and verdict assessment",
      "Routing: IRIS (TP high-confidence), Discord/Slack (alerts), FortiGate (containment)",
      "Policy-driven response orchestration",
    ],
    configTitle: "/etc/blusoc/laya-routing.yaml (excerpt)",
    configLanguage: "yaml",
    configSnippet: `intake:
  source: wazuh_qualifying_alerts

routing:
  - when:
      verdict: true_positive
      confidence: high
    action: create_iris_ticket
    notify: [discord, slack]

  - when:
      verdict: suspicious
      confidence: medium
    action: notify_only
    notify: [discord, slack]

  - when:
      containment_required: true
    action: fortigate_isolate
    target: affected_endpoint

# Only TP + high-confidence alerts become IRIS tickets for analysts`,
    logs: [
      { timestamp: "17:14:02.480", level: "INFO", message: "laya: qualifying alert received (rule 86601, L10)" },
      { timestamp: "17:14:02.495", level: "ALERT", message: "laya: verdict=true_positive confidence=high" },
      { timestamp: "17:14:02.505", level: "INFO", message: "laya: routed -> IRIS ticket + Discord/Slack notification" },
      { timestamp: "17:14:02.515", level: "INFO", message: "laya: containment directive issued to FortiGate for affected system" },
    ],
    specs: [
      { label: "Input", value: "Qualifying alerts forwarded by Wazuh" },
      { label: "IRIS criteria", value: "True positive AND high confidence only" },
      { label: "Notifications", value: "Discord and Slack" },
      { label: "Containment", value: "FortiGate isolation of affected systems" },
    ],
  },
  {
    id: "stage-response",
    stageNumber: 5,
    title: "Response, Ticketing & Containment",
    shortTitle: "Response",
    role: "IRIS tickets, analyst investigation, notifications, containment",
    description:
      "High-confidence true positives are opened in DFIR-IRIS for analyst investigation. Alerts are sent to Discord and Slack, and containment actions isolate affected systems via FortiGate.",
    technology: "DFIR-IRIS, Discord, Slack, FortiGate",
    metrics: {
      throughput: "184 actions/day",
      latency: "2.8 ms e2e",
      dropRate: "0.0%",
      buffer: "0% lag",
    },
    components: [
      "DFIR-IRIS ticket creation (TP, high confidence)",
      "Analyst investigation queue in IRIS",
      "Discord and Slack alert notifications",
      "FortiGate containment to isolate affected systems",
    ],
    configTitle: "Response action payloads (examples)",
    configLanguage: "json",
    configSnippet: `// DFIR-IRIS (true positive, high confidence)
POST /alerts/add
{ "alert_title": "[L10] Threat intel match", "severity": "high", "status": "new" }

// Discord / Slack notification
{ "channel": "soc-alerts", "text": "High-confidence TP forwarded to IRIS" }

// FortiGate containment
{ "action": "quarantine_host", "target": "10.240.0.10", "reason": "confirmed_threat" }`,
    logs: [
      { timestamp: "17:14:02.520", level: "INFO", message: "iris: ticket created for high-confidence true positive" },
      { timestamp: "17:14:02.535", level: "INFO", message: "notify: alert sent to Discord #soc-alerts and Slack #soc-alerts" },
      { timestamp: "17:14:02.548", level: "ALERT", message: "fortigate: containment applied, affected system isolated" },
      { timestamp: "17:14:02.560", level: "INFO", message: "analyst queue: IRIS ticket ready for investigation" },
    ],
    specs: [
      { label: "IRIS", value: "Tickets for true positive, high-confidence alerts only" },
      { label: "Analysts", value: "Investigate IRIS tickets (not direct from Wazuh)" },
      { label: "Notifications", value: "Discord and Slack" },
      { label: "Containment", value: "FortiGate isolation of affected systems" },
    ],
  },
];

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: "m365-benign",
    name: "Trusted Microsoft 365 Login",
    category: "Noise Suppression",
    outcome: "suppressed",
    severity: "INFORMATIONAL",
    ruleId: "91578",
    ruleLevel: 0,
    source: "Microsoft 365",
    clientIp: "198.51.100.14",
    targetAsset: "auth.blusoc.internal",
    description: "Known corporate egress login matched suppression policy and dropped at Wazuh (never sent to Laya).",
    pathStages: [1, 2],
    terminalLogs: [
      { step: 1, stage: "Sensors", tag: "INGEST", text: "Microsoft 365 sign-in event from 198.51.100.14 (corporate egress)" },
      { step: 2, stage: "Wazuh", tag: "RULE-MATCH", text: "Rule 91578 matched trusted egress pattern" },
      { step: 2, stage: "Wazuh", tag: "SUPPRESSED", text: "Level 0 suppression applied. No qualifying alert forwarded to Laya." },
    ],
  },
  {
    id: "intel-tp-iris",
    name: "Threat Intel Match (TP, High Confidence)",
    category: "IRIS Ticket",
    outcome: "iris",
    severity: "HIGH",
    ruleId: "86601",
    ruleLevel: 10,
    source: "Suricata DPI",
    clientIp: "64.62.156.159",
    targetAsset: "corp-gateway-01.blusoc.internal",
    description: "Qualifying alert triaged by Laya as true positive/high confidence; IRIS ticket created for analyst investigation.",
    pathStages: [1, 2, 3, 4, 5],
    terminalLogs: [
      { step: 1, stage: "Sensors", tag: "INGEST", text: "Suricata DPI detected inbound probe from 64.62.156.159" },
      { step: 2, stage: "Wazuh", tag: "RULE-MATCH", text: "Rule 86601 (L10) threat-intel match; qualifying alert forwarded to Laya" },
      { step: 3, stage: "Enrichment", tag: "ENRICH", text: "GeoIP/ASN added, payload preserved (4,000-char buffer)" },
      { step: 4, stage: "Laya", tag: "TRIAGE", text: "Verdict: true positive, confidence: high -> route to DFIR-IRIS" },
      { step: 5, stage: "Response", tag: "IRIS", text: "DFIR-IRIS ticket created for analyst investigation (not direct from Wazuh)" },
    ],
  },
  {
    id: "phish-notify",
    name: "Suspicious Phishing Signal",
    category: "Notification",
    outcome: "notify",
    severity: "MEDIUM",
    ruleId: "100701",
    ruleLevel: 7,
    source: "Barracuda",
    clientIp: "203.0.113.44",
    targetAsset: "mail.blusoc.internal",
    description: "Qualifying alert reviewed by Laya; SOC alerted via Discord and Slack for visibility.",
    pathStages: [1, 2, 3, 4, 5],
    terminalLogs: [
      { step: 1, stage: "Sensors", tag: "INGEST", text: "Barracuda flagged suspicious inbound message" },
      { step: 2, stage: "Wazuh", tag: "RULE-MATCH", text: "Rule 100701 (L7) phishing indicator; qualifying alert forwarded to Laya" },
      { step: 3, stage: "Enrichment", tag: "ENRICH", text: "Sender/domain context normalized for triage" },
      { step: 4, stage: "Laya", tag: "TRIAGE", text: "Verdict: suspicious, confidence: medium -> notify SOC channels" },
      { step: 5, stage: "Response", tag: "NOTIFY", text: "Alert delivered to Discord and Slack (#soc-alerts)" },
    ],
  },
  {
    id: "rce-contain",
    name: "Confirmed RCE & Endpoint Containment",
    category: "Containment",
    outcome: "contain",
    severity: "CRITICAL",
    ruleId: "100400",
    ruleLevel: 12,
    source: "Suricata + CrowdStrike",
    clientIp: "108.157.238.122",
    targetAsset: "corp-endpoint-115",
    description: "Laya confirms high-confidence true positive and triggers IRIS ticketing plus FortiGate isolation of the affected system.",
    pathStages: [1, 2, 3, 4, 5],
    terminalLogs: [
      { step: 1, stage: "Sensors", tag: "INGEST", text: "Suricata/CrowdStrike observed RCE behavior on corp-endpoint-115" },
      { step: 2, stage: "Wazuh", tag: "RULE-MATCH", text: "Rule 100400 (L12) critical exploit; qualifying alert forwarded to Laya" },
      { step: 3, stage: "Enrichment", tag: "ENRICH", text: "Exploit payload and host context preserved for response" },
      { step: 4, stage: "Laya", tag: "TRIAGE", text: "Verdict: true positive, confidence: high + containment required" },
      { step: 5, stage: "Response", tag: "CONTAIN", text: "IRIS ticket created, Discord/Slack notified, FortiGate isolated affected system" },
    ],
  },
];
