import Link from "next/link";
import {
  Shield,
  GitFork,
  Sliders,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  Terminal,
  Activity,
  Layers,
  Lock,
} from "lucide-react";

const HEADLINE_METRICS = [
  {
    value: "67",
    label: "Confirmed True Positives",
    detail: "High-fidelity attacks preserved from CINS, DROP, GPL RCE, and Cloudflare WAF",
    badge: "Verified IOCs",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
  },
  {
    value: "14,280 → 184",
    label: "Daily Alert Volume",
    detail: "Dramatic reduction of daily unactionable alert noise via XML ruleset tuning",
    badge: "-98.7% Fatigue",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    value: "87.1%",
    label: "Noise Suppression Ratio",
    detail: "Calculated event reduction across CrowdStrike storms and Suricata QinQ frames",
    badge: "Active Filter",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "4",
    label: "Integrated Telemetry Feeds",
    detail: "Suricata DPI, CrowdStrike Falcon, Wazuh HIDS, and DFIR-IRIS SOAR platform",
    badge: "Synchronized",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
];

const MODULE_SPOTLIGHTS = [
  {
    title: "Visual Pipeline Orchestrator",
    path: "/pipeline",
    icon: GitFork,
    badge: "Interactive Topology",
    description:
      "Inspect the live 5-stage telemetry ingestion DAG. Trace packet streams from network taps through Wazuh XML decoders and custom Python middleware into DFIR-IRIS case tickets.",
    highlights: [
      "Animated packet flow simulator",
      "Inspectable Wazuh XML rules (91578, 100010)",
      "4,000-char buffer overflow prevention logic",
      "Per-stage latency and drop telemetry",
    ],
    actionText: "Launch Pipeline Canvas",
  },
  {
    title: "Analyst Triage Workbench",
    path: "/workbench",
    icon: Shield,
    badge: "67 Attack Incidents",
    description:
      "Step into the shoes of a Tier-2 SOC Analyst. Investigate sanitized real-world attacks, inspect complete raw JSON event logs, review MITRE tactics, and submit ticket classifications.",
    highlights: [
      "67 real attacks across 5 categories",
      "Full raw JSON logs with GeoIP origin",
      "Zero-friction guest session sandbox",
      "Multi-level investigative triage questions",
    ],
    actionText: "Open Triage Workbench",
  },
  {
    title: "Alert Fatigue Reduction Lab",
    path: "/fatigue-lab",
    icon: Sliders,
    badge: "Impact Simulation",
    description:
      "Quantify the operational ROI of precision detection engineering. Toggle custom suppression rules and watch alert volume, MTTR, and analyst work hours update in real time.",
    highlights: [
      "Interactive Before vs After comparison",
      "Toggle individual Wazuh tuning rules",
      "Calculate saved analyst work hours",
      "Live MTTR reduction modeling",
    ],
    actionText: "Explore Fatigue Lab",
  },
];

const ARCHITECTURE_STAGES = [
  {
    step: "01",
    name: "Telemetry Ingestion",
    role: "Sensor Grid",
    description: "Suricata DPI network sniffers, CrowdStrike Falcon EDR logs, Cloudflare WAF events, and Microsoft 365 cloud audit feeds.",
    tech: "Suricata 7 / Syslog / APIs",
  },
  {
    step: "02",
    name: "Wazuh Analysis Engine",
    role: "Detection and Tuning",
    description: "Multi-tier XML ruleset evaluating threat feeds, suppressing null-host floods, and correlating corporate egress proxy traffic.",
    tech: "Wazuh 4.8 Core Engine",
  },
  {
    step: "03",
    name: "Python Middleware",
    role: "Enrichment & Truncation Fix",
    description: "4,000-character custom stdout buffering script, GeoIP geolocation enrichment, severity mapping, and payload formatting.",
    tech: "custom-iris.py / Python 3.11",
  },
  {
    step: "04",
    name: "DFIR-IRIS SOAR",
    role: "Incident Ticketing",
    description: "Automated case creation, evidence persistence, status synchronization daemon, and student triage assignments.",
    tech: "DFIR-IRIS 2.4 / PostgreSQL",
  },
];

const ENGINEERING_TEARDOWNS = [
  {
    ruleId: "Rule 91578",
    title: "Office 365 Egress Proxy IP Correlation",
    component: "Wazuh / Microsoft 365",
    problem:
      "Corporate employees authenticating to cloud SaaS via egress proxy block 198.51.100.0/24 triggered 3,140 false-positive brute-force alerts every day.",
    solution:
      "Authored custom rule logic in 02_proxy_egress_tuning.xml that whitelists authorized gateway CIDRs from generic velocity thresholds while preserving external credential stuffing rules.",
    outcome: "Eliminated 3,098 false alarms daily (98.7% reduction) with zero missed credential stuffing attacks.",
  },
  {
    ruleId: "Rule 100010",
    title: "CrowdStrike Null-Hostname Heartbeat Storm Suppression",
    component: "Wazuh / CrowdStrike Falcon",
    problem:
      "Unregistered workstation agents and temporary containers generated 8,420 malformed empty hostname registration heartbeats, flooding SIEM memory queues.",
    solution:
      "Implemented rule 100010 in 01_suppression_rules.xml with pre-decoding regex filtering out events with null or empty host attributes at wire speed.",
    outcome: "Dropped 8,408 junk events daily (99.85% suppression) and stabilized manager CPU utilization.",
  },
  {
    ruleId: "custom-iris",
    title: "4,000-Character Raw Log Truncation Fix",
    component: "Integration Middleware",
    problem:
      "Standard Wazuh-to-IRIS integration truncated long Suricata HTTP packet dumps at 1,024 characters, stripping out critical payload hex and exploit headers.",
    solution:
      "Engineered custom-iris.py with a 4,000-character buffered transport handler, robust JSON stream parsing, and graceful error fallback.",
    outcome: "Restored 100% full-fidelity forensic evidence inside DFIR-IRIS alert cases without log truncation.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="space-y-8 pt-4">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-3 py-1 shadow-subtle">
            <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
            <span className="font-mono text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">
              Production SOC Optimization Showcase
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-brand-text-primary leading-tight">
            Enterprise Blue-Team Engineering &amp; Real-World Detection Operations
          </h1>

          <p className="text-base sm:text-lg text-brand-text-secondary leading-relaxed">
            A battle-tested security operations engineering platform demonstrating how precision Wazuh XML rule tuning,
            custom Python integration middleware, and RFC-compliant telemetry correlation transformed an unmanageable
            14,280 daily alert storm into 184 actionable, high-fidelity security incidents with 67 verified true-positive attacks.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-text-primary px-5 py-3 text-sm font-semibold text-white shadow-subtle hover:bg-slate-800 transition-colors"
            >
              <GitFork className="h-4 w-4 text-blue-400" />
              <span>Explore Pipeline Orchestrator</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
            <Link
              href="/workbench"
              className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-brand-surface px-5 py-3 text-sm font-semibold text-brand-text-primary shadow-subtle hover:bg-slate-50 transition-colors"
            >
              <Shield className="h-4 w-4 text-blue-600" />
              <span>Investigate 67 Incidents</span>
            </Link>
            <Link
              href="/fatigue-lab"
              className="inline-flex items-center gap-2 rounded-lg border border-transparent px-4 py-3 text-sm font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            >
              <Sliders className="h-4 w-4" />
              <span>Fatigue Reduction Lab</span>
            </Link>
          </div>
        </div>

        {/* Live Headline Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          {HEADLINE_METRICS.map((metric, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-brand-border bg-brand-surface p-5 shadow-card hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-xs font-semibold border ${metric.badgeColor}`}>
                    {metric.badge}
                  </span>
                  <Activity className="h-4 w-4 text-brand-text-muted" />
                </div>
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-brand-text-primary tracking-tight">
                    {metric.value}
                  </div>
                  <div className="text-sm font-semibold text-brand-text-primary mt-1">
                    {metric.label}
                  </div>
                </div>
              </div>
              <p className="text-xs text-brand-text-secondary mt-3 border-t border-brand-border pt-3 leading-normal">
                {metric.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Feature Spotlight Cards */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-brand-border pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-text-primary tracking-tight">
              Interactive Operational Modules
            </h2>
            <p className="text-sm text-brand-text-secondary mt-1">
              Explore the end-to-end detection lifecycle across interactive simulation environments.
            </p>
          </div>
          <span className="font-mono text-xs text-brand-text-muted">
            3 ACTIVE MODULES
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MODULE_SPOTLIGHTS.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <div
                key={i}
                className="flex flex-col justify-between rounded-xl border border-brand-border bg-brand-surface p-6 shadow-card hover:border-blue-300 hover:shadow-dropdown transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-muted text-brand-text-primary border border-brand-border group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold rounded bg-brand-muted px-2 py-0.5 text-brand-text-secondary border border-brand-border">
                      {mod.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-brand-text-primary group-hover:text-blue-600 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-brand-text-secondary mt-2 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-brand-border">
                    {mod.highlights.map((h, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-brand-text-secondary">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href={mod.path}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2.5 text-xs font-semibold text-brand-text-primary shadow-subtle hover:bg-brand-muted hover:border-slate-300 transition-colors"
                  >
                    <span>{mod.actionText}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-brand-text-muted group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* High-Level Architecture Summary Card */}
      <section className="rounded-xl border border-brand-border bg-brand-surface p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-brand-text-primary">
                End-to-End SOC Architecture: Telemetry to Resolution
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-brand-text-secondary mt-1">
              Deterministic four-stage data pipeline bridging raw sensor taps with automated case ticketing.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold rounded bg-emerald-50 px-2.5 py-1 text-emerald-700 border border-emerald-200">
            ZERO BUFFER TRUNCATION
          </span>
        </div>

        {/* 4-Stage Architecture Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ARCHITECTURE_STAGES.map((stage, idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between rounded-lg border border-brand-border bg-brand-canvas p-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600">
                    STAGE {stage.step}
                  </span>
                  <span className="font-mono text-[10px] text-brand-text-muted">
                    {stage.role}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-brand-text-primary">
                  {stage.name}
                </h4>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  {stage.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-brand-border/60">
                <span className="font-mono text-[11px] font-medium text-brand-text-muted">
                  {stage.tech}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Detection Engineering Case Study Teardowns */}
      <section className="space-y-6">
        <div className="border-b border-brand-border pb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-text-primary tracking-tight">
            Detection Engineering Case Studies
          </h2>
          <p className="text-sm text-brand-text-secondary mt-1">
            Real production challenges solved through precision rule logic and middleware optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ENGINEERING_TEARDOWNS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-brand-border bg-brand-surface p-6 shadow-card space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                  {item.ruleId}
                </span>
                <span className="font-mono text-[11px] text-brand-text-muted">
                  {item.component}
                </span>
              </div>

              <h3 className="text-base font-bold text-brand-text-primary">
                {item.title}
              </h3>

              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <span className="font-semibold text-red-600 block mb-0.5 font-mono uppercase text-[10px]">
                    The Challenge
                  </span>
                  <p className="text-brand-text-secondary">{item.problem}</p>
                </div>
                <div>
                  <span className="font-semibold text-blue-600 block mb-0.5 font-mono uppercase text-[10px]">
                    Engineered Solution
                  </span>
                  <p className="text-brand-text-secondary">{item.solution}</p>
                </div>
                <div className="pt-2 border-t border-brand-border">
                  <span className="font-semibold text-emerald-600 block mb-0.5 font-mono uppercase text-[10px]">
                    Operational Impact
                  </span>
                  <p className="font-medium text-brand-text-primary">{item.outcome}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Launch Callout */}
      <section className="rounded-xl border border-brand-border bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-dropdown">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-bold">Ready to Start Investigating?</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            All 67 real-world attack incidents are pre-loaded in the Analyst Workbench with full raw event logs,
            GeoIP tracking, and interactive verdict submissions. No signup required.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/workbench"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm"
          >
            <span>Launch Workbench</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <span>View Architecture</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
