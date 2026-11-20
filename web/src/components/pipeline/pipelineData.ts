export interface StageLog {
  timestamp: string;
  level: "INFO" | "WARN" | "DROP" | "ALERT" | "CRITICAL";
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

export type SimulationOutcome = "suppressed" | "iris" | "notify" | "contain";

export interface SimulationPreset {
  id: string;
  name: string;
  category: string;
  outcome: SimulationOutcome;
  severity: "INFORMATIONAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
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
      "Endpoint, network, identity, email, and edge telemetry from CrowdStrike Falcon, Suricata, Sophos, Barracuda, Microsoft 365, and Cloudflare is collected and forwarded for correlation.",
    technology:
      "Suricata, CrowdStrike Falcon, Sophos, Barracuda, Microsoft 365, Cloudflare WAF, rsyslog/syslog",
    components: [
      "CrowdStrike Falcon EDR telemetry",
      "Suricata IDS / DPI alerts (EVE JSON)",
      "Sophos endpoint protection events",
      "Barracuda email & gateway logs",
      "Microsoft 365 identity & audit logs",
      "Cloudflare WAF / edge traffic",
    ],
    configTitle: "Representative ingestion sources",
    configLanguage: "yaml",
    configSnippet: `sources:
  - crowdstrike_falcon: edr_telemetry
  - suricata: eve_json_alerts
  - sophos: endpoint_events
  - barracuda: email_gateway_logs
  - microsoft_365: identity_audit_signin
  - cloudflare: edge_waf_events
transport:
  - syslog / tls
  - json_stream
  - api_pull
normalization: wazuh_decoders`,
    logs: [
      {
        timestamp: "17:14:02.102",
        level: "INFO",
        message: "suricata: DPI alert ingested (corp-gateway-01.blusoc.internal)",
      },
      {
        timestamp: "17:14:02.148",
        level: "INFO",
        message: "crowdstrike: endpoint telemetry batch received",
      },
      { timestamp: "17:14:02.210", level: "INFO", message: "m365: sign-in audit event received" },
      {
        timestamp: "17:14:02.318",
        level: "INFO",
        message: "cloudflare: edge WAF event queued for correlation",
      },
    ],
    specs: [
      { label: "Sources", value: "EDR, IDS, endpoint, email, identity, edge" },
      { label: "Normalization", value: "Wazuh decoders & field extraction" },
      { label: "Transport", value: "Syslog/TLS, JSON streams, APIs" },
      { label: "Pipeline entry", value: "All telemetry enters Wazuh first" },
    ],
  },
  {
    id: "stage-wazuh",
    stageNumber: 2,
    title: "Wazuh Correlation & Suppression",
    shortTitle: "Wazuh",
    role: "Decode, correlate, score, and suppress noise",
    description:
      "Wazuh normalizes telemetry, applies correlation/detection rules, suppresses known benign noise at Level 0, and forwards only qualifying alerts to n8n for orchestration.",
    technology: "Wazuh manager 4.x and custom XML rules",
    components: [
      "Decoders & field extraction",
      "Correlation and rule evaluation (L0-L12)",
      "Level 0 suppression for known benign patterns",
      "Forwarding of qualifying alerts to n8n",
    ],
    configTitle: "01_suppression_rules.xml (excerpt)",
    configLanguage: "xml",
    configSnippet: `<group name="blusoc,suppression,noise_reduction,">
  <rule id="100010" level="0">
    <decoded_as>json</decoded_as>
    <field name="vendor">^CrowdStrike$</field>
    <field name="hostname">^$|^-$|^UNKNOWN$|^null$</field>
    <field name="event_simpleName">^AgentPing$|^Heartbeat$</field>
    <description>CrowdStrike Falcon: Suppress parent telemetry stream and null-hostname agent status floods</description>
    <group>crowdstrike,noise_suppression,parent_rule,</group>
  </rule>
</group>`,
    logs: [
      {
        timestamp: "17:14:02.250",
        level: "DROP",
        message: "rule 100010 (L0): null-host heartbeat suppressed",
      },
      {
        timestamp: "17:14:02.312",
        level: "DROP",
        message: "rule 110078 (L0): trusted O365 egress login filtered",
      },
      {
        timestamp: "17:14:02.404",
        level: "ALERT",
        message: "rule 110001 (L10): qualifying alert forwarded to n8n",
      },
      {
        timestamp: "17:14:02.510",
        level: "CRITICAL",
        message: "rule 100400 (L12): high-severity event forwarded to n8n",
      },
    ],
    specs: [
      { label: "Rule set", value: "Custom suppression & threat-intel rules" },
      { label: "Suppression", value: "Pattern-based suppression" },
      { label: "Forwarding", value: "Only qualifying alerts sent to n8n" },
      { label: "Included deployment", value: "Manager and rules" },
    ],
  },
  {
    id: "stage-n8n",
    stageNumber: 3,
    title: "n8n SOAR Orchestration",
    shortTitle: "n8n",
    role: "Webhook intake, enrichment, and workflow routing",
    description:
      "In the reference design, n8n receives qualifying alerts through a webhook, enriches context, and routes them to Laya. These workflow connectors are illustrated and are not included in the server deployment.",
    technology: "n8n webhooks and threat-intelligence services (reference design)",
    components: [
      "Webhook intake from Wazuh (illustrated)",
      "Normalization and payload handling",
      "Threat-intel enrichment (VT, AbuseIPDB, OTX, etc.)",
      "Workflow routing to Laya triage service",
    ],
    configTitle: "Enrichment workflow (pseudocode)",
    configLanguage: "json",
    configSnippet: `{
  "trigger": "wazuh_alert_webhook",
  "steps": [
    "normalize_alert",
    "enrich_threat_intel",
    "preserve_full_payload",
    "post_to_laya_triage",
    "route_actions_from_verdict"
  ]
}`,
    logs: [
      {
        timestamp: "17:14:02.420",
        level: "INFO",
        message: "webhook: qualifying alert received from Wazuh",
      },
      {
        timestamp: "17:14:02.435",
        level: "INFO",
        message: "n8n: payload normalized and enriched with TI context",
      },
      {
        timestamp: "17:14:02.450",
        level: "INFO",
        message: "n8n: enrichment complete, forwarding to Laya",
      },
      {
        timestamp: "17:14:02.465",
        level: "INFO",
        message: "n8n: workflow awaiting Laya verdict for routing",
      },
    ],
    specs: [
      { label: "Intake", value: "Qualifying alerts only (from Wazuh)" },
      { label: "Enrichment", value: "Multi-feed TI (VT, AbuseIPDB, OTX, etc.)" },
      { label: "Availability", value: "Reference design; connector required" },
      { label: "Output", value: "Enriched alert sent to Laya" },
    ],
  },
  {
    id: "stage-laya",
    stageNumber: 4,
    title: "Laya Triage & Decision",
    shortTitle: "Laya",
    role: "Verdict, confidence, and response routing",
    description:
      "Laya reviews enriched qualifying alerts, assigns verdict and confidence, and drives routing: only true positive, high-confidence alerts create DFIR-IRIS tickets; alerts notify Discord/Slack; containment actions isolate affected systems via FortiGate.",
    technology: "Laya triage service (reference design)",
    components: [
      "Qualifying alert intake from n8n",
      "Verdict and confidence assessment",
      "IRIS ticketing for TP + high confidence",
      "Discord/Slack notifications and FortiGate containment",
    ],
    configTitle: "Triage routing policy (pseudocode)",
    configLanguage: "yaml",
    configSnippet: `intake:
  source: n8n_enriched_alerts

routing:
  - when: { verdict: true_positive, confidence: high }
    actions: [create_iris_ticket, notify_discord_slack]

  - when: { verdict: suspicious, confidence: medium }
    actions: [notify_discord_slack]

  - when: { containment_required: true }
    actions: [fortigate_isolate, create_iris_ticket, notify_discord_slack]

# Analysts investigate IRIS tickets (not direct alerts from Wazuh)`,
    logs: [
      {
        timestamp: "17:14:02.480",
        level: "INFO",
        message: "laya: enriched qualifying alert received",
      },
      {
        timestamp: "17:14:02.495",
        level: "ALERT",
        message: "laya: verdict=true_positive confidence=high",
      },
      {
        timestamp: "17:14:02.505",
        level: "INFO",
        message: "laya: route -> DFIR-IRIS ticket + Discord/Slack",
      },
      {
        timestamp: "17:14:02.515",
        level: "INFO",
        message: "laya: containment directive issued to FortiGate",
      },
    ],
    specs: [
      { label: "Input", value: "Enriched qualifying alerts via n8n" },
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
      "Confirmed, high-confidence threats become DFIR-IRIS tickets for analyst investigation. Laya-driven actions notify Discord/Slack and trigger FortiGate containment to isolate affected systems.",
    technology: "DFIR-IRIS, Discord, Slack, FortiGate",
    components: [
      "DFIR-IRIS ticket creation (TP, high confidence)",
      "Analyst investigation queue in IRIS",
      "Discord and Slack alert notifications",
      "FortiGate containment to isolate affected systems",
    ],
    configTitle: "Response actions (pseudocode)",
    configLanguage: "json",
    configSnippet: `// DFIR-IRIS (true positive, high confidence)
create_iris_alert({ title: "Threat intel match", severity: "high" })

// Discord / Slack
{ "channel": "soc-alerts", "text": "High-confidence TP routed to IRIS" }

// FortiGate containment
{ "action": "quarantine_host", "target": "10.240.0.10", "reason": "confirmed_threat" }`,
    logs: [
      {
        timestamp: "17:14:02.520",
        level: "INFO",
        message: "iris: ticket created for high-confidence true positive",
      },
      {
        timestamp: "17:14:02.535",
        level: "INFO",
        message: "notify: alert sent to Discord and Slack",
      },
      {
        timestamp: "17:14:02.548",
        level: "ALERT",
        message: "fortigate: containment applied, affected system isolated",
      },
      {
        timestamp: "17:14:02.560",
        level: "INFO",
        message: "analyst queue: IRIS ticket ready for investigation",
      },
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
    name: "Trusted login",
    category: "Noise Suppression",
    outcome: "suppressed",
    severity: "INFORMATIONAL",
    ruleId: "110078",
    ruleLevel: 0,
    source: "Microsoft 365",
    clientIp: "198.51.100.14",
    targetAsset: "auth.blusoc.internal",
    description:
      "Known corporate egress login matched suppression policy and dropped at Wazuh (never sent to n8n/Laya).",
    pathStages: [1, 2],
    terminalLogs: [
      {
        step: 1,
        stage: "Sensors",
        tag: "INGEST",
        text: "Microsoft 365 sign-in event from 198.51.100.14 (corporate egress)",
      },
      {
        step: 2,
        stage: "Wazuh",
        tag: "RULE-MATCH",
        text: "Rule 110078 matched trusted egress pattern",
      },
      {
        step: 2,
        stage: "Wazuh",
        tag: "SUPPRESSED",
        text: "Level 0 suppression applied. No qualifying alert forwarded to n8n.",
      },
    ],
  },
  {
    id: "intel-tp-iris",
    name: "Threat-intel match",
    category: "IRIS Ticket",
    outcome: "iris",
    severity: "HIGH",
    ruleId: "110001",
    ruleLevel: 10,
    source: "Suricata DPI",
    clientIp: "64.62.156.159",
    targetAsset: "corp-gateway-01.blusoc.internal",
    description:
      "Qualifying alert enriched in n8n and triaged by Laya as true positive/high confidence; IRIS ticket created for analyst investigation.",
    pathStages: [1, 2, 3, 4, 5],
    terminalLogs: [
      {
        step: 1,
        stage: "Sensors",
        tag: "INGEST",
        text: "Suricata DPI detected inbound probe from 64.62.156.159",
      },
      {
        step: 2,
        stage: "Wazuh",
        tag: "RULE-MATCH",
        text: "Rule 110001 (L10) threat-intel match; qualifying alert forwarded to n8n",
      },
      {
        step: 3,
        stage: "n8n",
        tag: "ENRICH",
        text: "n8n normalized and enriched alert with TI context, forwarded to Laya",
      },
      {
        step: 4,
        stage: "Laya",
        tag: "TRIAGE",
        text: "Verdict: true positive, confidence: high -> route to DFIR-IRIS",
      },
      {
        step: 5,
        stage: "Response",
        tag: "IRIS",
        text: "DFIR-IRIS ticket created for analyst investigation (not direct from Wazuh)",
      },
    ],
  },
  {
    id: "phish-notify",
    name: "Notify the team",
    category: "Notification",
    outcome: "notify",
    severity: "MEDIUM",
    ruleId: "100701",
    ruleLevel: 7,
    source: "Barracuda",
    clientIp: "203.0.113.44",
    targetAsset: "mail.blusoc.internal",
    description:
      "Qualifying alert enriched in n8n; Laya routes notification to Discord and Slack for visibility.",
    pathStages: [1, 2, 3, 4, 5],
    terminalLogs: [
      {
        step: 1,
        stage: "Sensors",
        tag: "INGEST",
        text: "Barracuda flagged suspicious inbound message",
      },
      {
        step: 2,
        stage: "Wazuh",
        tag: "RULE-MATCH",
        text: "Rule 100701 (L7) phishing indicator; qualifying alert forwarded to n8n",
      },
      {
        step: 3,
        stage: "n8n",
        tag: "ENRICH",
        text: "n8n enriched sender/domain context and routed alert to Laya",
      },
      {
        step: 4,
        stage: "Laya",
        tag: "TRIAGE",
        text: "Verdict: suspicious, confidence: medium -> notify SOC channels",
      },
      {
        step: 5,
        stage: "Response",
        tag: "NOTIFY",
        text: "Alert delivered to Discord and Slack (#soc-alerts)",
      },
    ],
  },
  {
    id: "rce-contain",
    name: "Contain a threat",
    category: "Containment",
    outcome: "contain",
    severity: "CRITICAL",
    ruleId: "100400",
    ruleLevel: 12,
    source: "Suricata + CrowdStrike",
    clientIp: "108.157.238.122",
    targetAsset: "corp-endpoint-115",
    description:
      "n8n enrichment and Laya confirmation trigger IRIS ticketing plus FortiGate isolation of the affected system.",
    pathStages: [1, 2, 3, 4, 5],
    terminalLogs: [
      {
        step: 1,
        stage: "Sensors",
        tag: "INGEST",
        text: "Suricata/CrowdStrike observed RCE behavior on corp-endpoint-115",
      },
      {
        step: 2,
        stage: "Wazuh",
        tag: "RULE-MATCH",
        text: "Rule 100400 (L12) critical exploit; qualifying alert forwarded to n8n",
      },
      {
        step: 3,
        stage: "n8n",
        tag: "ENRICH",
        text: "n8n enriched exploit/host context and forwarded to Laya",
      },
      {
        step: 4,
        stage: "Laya",
        tag: "TRIAGE",
        text: "Verdict: true positive, confidence: high + containment required",
      },
      {
        step: 5,
        stage: "Response",
        tag: "CONTAIN",
        text: "IRIS ticket created, Discord/Slack notified, FortiGate isolated affected system",
      },
    ],
  },
];
