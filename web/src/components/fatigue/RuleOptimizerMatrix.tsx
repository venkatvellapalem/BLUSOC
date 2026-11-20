"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Copy, FileCode, Info, Layers, Sliders } from "lucide-react";
import { useState } from "react";

export interface SuppressionRule {
  id: string;
  ruleNumber: number;
  name: string;
  component: string;
  eventsPerDay: number;
  percentage: number;
  sensor: string;
  level: number;
  xmlPath: string;
  summary: string;
  rationale: string;
  rawXml: string;
  tags: string[];
  color: {
    bg: string;
    border: string;
    text: string;
    pill: string;
    bar: string;
  };
}

export const SUPPRESSION_RULES: SuppressionRule[] = [
  {
    id: "rule-100010",
    ruleNumber: 100010,
    name: "CrowdStrike Null-Hostname Suppression",
    component: "CrowdStrike Falcon EDR",
    eventsPerDay: 6840,
    percentage: 47.9,
    sensor: "Workstation & Server Endpoints",
    level: 0,
    xmlPath: "detection-engineering/wazuh/rules/01_suppression_rules.xml",
    summary: "Filters AgentPing and Heartbeat events with an empty or placeholder hostname.",
    rationale:
      "The rule checks the vendor, hostname, and heartbeat event name together. An empty hostname alone does not suppress a threat event. Its modeled contribution is 6,840 events per day.",
    rawXml: `<rule id="100010" level="0">
  <decoded_as>json</decoded_as>
  <field name="vendor">^CrowdStrike$</field>
  <field name="hostname">^$|^-$|^UNKNOWN$|^null$</field>
  <field name="event_simpleName">^AgentPing$|^Heartbeat$</field>
  <description>CrowdStrike Falcon: Suppress parent telemetry stream and null-hostname agent status floods</description>
  <group>crowdstrike,noise_suppression,parent_rule,</group>
</rule>`,
    tags: ["crowdstrike", "noise_suppression", "parent_rule", "endpoint"],
    color: {
      bg: "bg-indigo-50/50",
      border: "border-indigo-200",
      text: "text-indigo-900",
      pill: "bg-indigo-100 text-indigo-800 border-indigo-200",
      bar: "bg-indigo-500",
    },
  },
  {
    id: "rule-110011",
    ruleNumber: 110011,
    name: "Suricata Ethertype Unknown Suppression",
    component: "Suricata network telemetry",
    eventsPerDay: 3210,
    percentage: 22.5,
    sensor: "Mirrored network traffic",
    level: 0,
    xmlPath: "detection-engineering/wazuh/rules/01_suppression_rules.xml",
    summary:
      "Filters known link-layer framing warnings; inspect the XML for the companion checksum rule.",
    rationale:
      "This example filters the specific Suricata diagnostic strings shown below. Confirm these patterns are benign for your own sensor before enabling suppression. The model assigns this group 3,210 daily events.",
    rawXml: `<rule id="110011" level="0">
  <match>SURICATA Ethertype unknown</match>
  <description>Suricata: Suppress benign ethertype unknown and non-standard link-layer frame warnings</description>
  <group>suricata,noise_suppression,link_layer,</group>
</rule>

<rule id="110012" level="0">
  <match>SURICATA TCP invalid checksum|SURICATA UDP invalid checksum</match>
  <description>Suricata: Suppress hardware checksum offload artifacts on high-throughput sensor interfaces</description>
  <group>suricata,noise_suppression,interface_artifacts,</group>
</rule>`,
    tags: ["suricata", "noise_suppression", "link_layer", "dpi"],
    color: {
      bg: "bg-violet-50/50",
      border: "border-violet-200",
      text: "text-violet-900",
      pill: "bg-violet-100 text-violet-800 border-violet-200",
      bar: "bg-violet-500",
    },
  },
  {
    id: "rule-110078",
    ruleNumber: 110078,
    name: "O365 Corporate Egress Proxy Whitelist",
    component: "Microsoft 365 / Azure AD",
    eventsPerDay: 2980,
    percentage: 20.9,
    sensor: "Corporate SaaS Egress Gateway",
    level: 0,
    xmlPath: "detection-engineering/wazuh/rules/02_proxy_egress_tuning.xml",
    summary:
      "Distinguishes sanctioned corporate egress proxies (198.51.100.14, 198.51.100.242) from external credential stuffing.",
    rationale:
      "The example matches two sanitized corporate proxy addresses exactly. Replace them with your verified egress addresses and assess the event scope before use. This model assigns the rule 2,980 daily events.",
    rawXml: `<rule id="110078" level="0">
  <decoded_as>json</decoded_as>
  <field name="integration">^office365$</field>
  <field name="office365.ClientIP">^198\\.51\\.100\\.14$|^198\\.51\\.100\\.242$</field>
  <description>Office 365: Benign corporate egress login from authorized proxy (198.51.100.14, 198.51.100.242) silenced to level 0</description>
  <group>office365,proxy_tuning,suppression,</group>
</rule>`,
    tags: ["office365", "proxy_tuning", "suppression", "identity"],
    color: {
      bg: "bg-sky-50/50",
      border: "border-sky-200",
      text: "text-sky-900",
      pill: "bg-sky-100 text-sky-800 border-sky-200",
      bar: "bg-sky-500",
    },
  },
  {
    id: "rule-100550",
    ruleNumber: 100550,
    name: "Cloudflare Synthetic Probe Silence",
    component: "Cloudflare Edge WAF",
    eventsPerDay: 1066,
    percentage: 7.5,
    sensor: "Edge Reverse Proxy",
    level: 0,
    xmlPath: "detection-engineering/wazuh/rules/01_suppression_rules.xml",
    summary:
      "Drops automated edge health checks and synthetic uptime monitoring probes from triggering perimeter alarms.",
    rationale:
      "The rule matches the configured source and known probe user-agent prefixes. Validate those identifiers against your own traffic. Its modeled contribution is 1,066 daily events.",
    rawXml: `<rule id="100550" level="0">
  <decoded_as>json</decoded_as>
  <field name="source">^cloudflare$|^CLOUDFLARE WAF$</field>
  <field name="user_agent">^Cloudflare-Health-Checks|^synthetic-probe|^UptimeRobot|^BetterUptime</field>
  <description>Cloudflare: Silence automated edge health checks and synthetic validation probe loops</description>
  <group>cloudflare,noise_suppression,synthetic_monitoring,</group>
</rule>`,
    tags: ["cloudflare", "noise_suppression", "synthetic_monitoring", "waf"],
    color: {
      bg: "bg-amber-50/50",
      border: "border-amber-200",
      text: "text-amber-900",
      pill: "bg-amber-100 text-amber-800 border-amber-200",
      bar: "bg-amber-500",
    },
  },
];

export interface RuleOptimizerMatrixProps {
  activeRules: Record<string, boolean>;
  onToggleRule: (ruleId: string) => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
}

export function RuleOptimizerMatrix({
  activeRules,
  onToggleRule,
  onEnableAll,
  onDisableAll,
}: RuleOptimizerMatrixProps) {
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState(false);

  const totalBaseline = 14280;
  const actionableBase = 184;

  // Calculate Suppressed Volume
  const suppressedVolume = SUPPRESSION_RULES.reduce((acc, rule) => {
    return activeRules[rule.id] ? acc + rule.eventsPerDay : acc;
  }, 0);

  // Current Ingested Volume
  const currentVolume = totalBaseline - suppressedVolume;
  const remainingNoise = Math.max(0, currentVolume - actionableBase);
  const totalNoiseMax = totalBaseline - actionableBase; // 14,096
  const noiseReductionPercent = ((suppressedVolume / totalNoiseMax) * 100).toFixed(1);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setCopyError(false);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div className="space-y-6">
      {copyError && (
        <p role="status" className="text-sm text-rose-700">
          Copy unavailable. Select the rule text to copy it manually.
        </p>
      )}
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Sliders className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-brand-text-primary tracking-tight">
              Choose what reaches the queue
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-brand-text-secondary mt-1">
            Toggle individual detection rules to model their illustrative impact on daily noise and
            analyst workload.
          </p>
        </div>

        {/* Global Batch Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onEnableAll}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            Enable All Rules
          </button>
          <button
            type="button"
            onClick={onDisableAll}
            className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition-colors"
          >
            Disable All Rules
          </button>
        </div>
      </div>

      {/* Proportional Volume Comparison Bar Card */}
      <div className="rounded-xl border border-brand-border bg-brand-surface p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand-text-muted" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                Daily queue composition
              </h4>
            </div>
            <p className="text-xs text-brand-text-muted">
              Visual proportional breakdown of suppressed noise, remaining un-tuned noise, and
              alerts for review.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] text-brand-text-muted block font-mono">
                Current queue:
              </span>
              <span className="font-mono text-sm font-bold text-brand-text-primary">
                {currentVolume.toLocaleString()} / 14,280 alerts
              </span>
            </div>
            <div className="rounded-md border border-brand-border bg-brand-muted px-2.5 py-1 text-center">
              <span className="block text-[10px] text-brand-text-muted font-mono uppercase">
                Known noise filtered
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700">
                {noiseReductionPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Proportional Bar */}
        <div className="space-y-2">
          <div className="h-6 w-full rounded-lg overflow-hidden flex bg-slate-100 border border-brand-border p-0.5 gap-0.5">
            {/* Active Rules Segments */}
            {SUPPRESSION_RULES.map((rule) => {
              const isActive = activeRules[rule.id];
              if (!isActive) return null;
              const widthPct = (rule.eventsPerDay / totalBaseline) * 100;

              return (
                <div
                  key={rule.id}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full ${rule.color.bar} rounded-sm transition-all duration-300 relative group cursor-pointer`}
                  title={`${rule.name}: -${rule.eventsPerDay.toLocaleString()} alerts/day (${rule.percentage}%)`}
                />
              );
            })}

            {/* Remaining Noise Segment */}
            {remainingNoise > 0 && (
              <div
                style={{ width: `${(remainingNoise / totalBaseline) * 100}%` }}
                className="h-full bg-rose-400/80 rounded-sm transition-all duration-300 relative group cursor-pointer"
                title={`Unfiltered Noise: ${remainingNoise.toLocaleString()} alerts/day`}
              />
            )}

            {/* Preserved Actionable Alerts Segment */}
            <div
              style={{ width: `${(actionableBase / totalBaseline) * 100}%`, minWidth: "14px" }}
              className="h-full bg-emerald-600 rounded-sm transition-all duration-300 relative group cursor-pointer"
              title={`Review queue: ${actionableBase} alerts/day (180 threat signals and four benign events)`}
            />
          </div>

          {/* Bar Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[11px] font-mono text-brand-text-secondary">
            {SUPPRESSION_RULES.map((rule) => {
              const isActive = activeRules[rule.id];
              return (
                <div key={rule.id} className="flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-sm ${
                      isActive ? rule.color.bar : "bg-slate-300 opacity-60"
                    }`}
                  />
                  <span
                    className={
                      isActive
                        ? "text-brand-text-primary font-medium"
                        : "text-brand-text-muted line-through"
                    }
                  >
                    Rule {rule.ruleNumber} ({rule.eventsPerDay.toLocaleString()})
                  </span>
                </div>
              );
            })}

            {remainingNoise > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />
                <span className="text-rose-700 font-medium">
                  Unfiltered Noise ({remainingNoise.toLocaleString()})
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
              <span className="text-emerald-800 font-bold">
                Alerts for review ({actionableBase})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 gap-4">
        {SUPPRESSION_RULES.map((rule) => {
          const isActive = !!activeRules[rule.id];
          const isExpanded = expandedRuleId === rule.id;

          return (
            <motion.div
              key={rule.id}
              layout
              className={`rounded-xl border transition-all duration-200 bg-brand-surface ${
                isActive
                  ? "border-brand-border shadow-card"
                  : "border-slate-200/80 bg-slate-50/50 opacity-80"
              }`}
            >
              {/* Card Header & Switch */}
              <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Toggle Switch */}
                  <div className="pt-0.5 shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      onClick={() => onToggleRule(rule.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                        isActive ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                    >
                      <span className="sr-only">Toggle {rule.name}</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Rule Metadata */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-text-primary">
                        Rule ID {rule.ruleNumber}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold border ${rule.color.pill}`}
                      >
                        {rule.component}
                      </span>
                      <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                        Level {rule.level} (Suppressed)
                      </span>
                      <span className="text-[11px] font-mono text-brand-text-muted">
                        Sensor: {rule.sensor}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-brand-text-primary">{rule.name}</h4>

                    <p className="text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
                      {rule.summary}
                    </p>
                  </div>
                </div>

                {/* Right Side Impact Metric & Accordion Toggle */}
                <div className="flex sm:flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-brand-border">
                  <div className="text-left md:text-right">
                    <span className="block text-[10px] uppercase font-mono text-brand-text-muted">
                      Modeled daily impact
                    </span>
                    <div className="flex items-baseline gap-1.5 md:justify-end">
                      <span
                        className={`font-mono text-base font-extrabold ${
                          isActive ? "text-emerald-700" : "text-slate-400 line-through"
                        }`}
                      >
                        -{rule.eventsPerDay.toLocaleString()}
                      </span>
                      <span className="text-xs font-mono text-brand-text-muted">
                        / day ({rule.percentage}%)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary hover:bg-slate-50 transition-colors shadow-subtle"
                  >
                    <FileCode className="h-3.5 w-3.5 text-blue-600" />
                    <span>{isExpanded ? "Hide XML Code" : "Inspect Rule XML"}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-brand-text-muted" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-brand-text-muted" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable XML & Engineering Rationale Drawer */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-brand-border bg-slate-50/70 p-5 sm:p-6 space-y-4"
                  >
                    {/* Engineering Rationale Callout */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-700 shrink-0" />
                        <span className="font-mono text-xs font-bold text-blue-900 uppercase tracking-wide">
                          Detection Engineering Rationale
                        </span>
                      </div>
                      <p className="text-xs text-blue-950/85 leading-relaxed pl-6">
                        {rule.rationale}
                      </p>
                    </div>

                    {/* Code Container */}
                    <div className="rounded-lg border border-slate-300 bg-slate-900 text-slate-100 overflow-hidden shadow-card">
                      {/* Code Header Bar */}
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="font-mono text-[11px] text-slate-300">
                            {rule.xmlPath}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(rule.id, rule.rawXml)}
                          className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] font-mono text-slate-200 transition-colors"
                        >
                          {copiedId === rule.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 text-slate-400" />
                              <span>Copy XML</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Code Body */}
                      <pre className="p-4 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed">
                        <code>{rule.rawXml}</code>
                      </pre>
                    </div>

                    {/* Rule Parameter Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-mono text-brand-text-muted">
                        Rule Groups:
                      </span>
                      {rule.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-white px-2 py-0.5 font-mono text-[10px] text-slate-700 border border-slate-200 shadow-subtle"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
