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
  Radio,
  FileCode,
  Sparkles,
} from "lucide-react";
import { NetworkTopologyRadar } from "@/components/home/NetworkTopologyRadar";

const HEADLINE_METRICS = [
  {
    value: "67",
    label: "Confirmed True Positives",
    detail: "High-fidelity attack IOCs preserved from CINS, DROP, GPL RCE, and Cloudflare WAF",
    badge: "Verified Attacks",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    gradient: "from-rose-500/10 to-transparent",
  },
  {
    value: "14,280 → 184",
    label: "Daily Alert Volume",
    detail: "Dramatic reduction of unactionable noise floods via 3-tier Wazuh XML ruleset tuning",
    badge: "-98.7% Fatigue",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    gradient: "from-amber-500/10 to-transparent",
  },
  {
    value: "87.1%",
    label: "Noise Suppression Ratio",
    detail: "Calculated event reduction across CrowdStrike null-hosts and Suricata QinQ frames",
    badge: "Active Filter",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    gradient: "from-emerald-500/10 to-transparent",
  },
  {
    value: "4",
    label: "Integrated Telemetry Feeds",
    detail: "Suricata DPI, CrowdStrike Falcon, Wazuh HIDS, and DFIR-IRIS SOAR platform",
    badge: "Synchronized",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    gradient: "from-blue-500/10 to-transparent",
  },
];

const MODULE_SPOTLIGHTS = [
  {
    title: "Visual Pipeline Orchestrator",
    path: "/pipeline",
    icon: GitFork,
    badge: "Interactive Topology",
    tagline: "Live Telemetry Flow Engine",
    description:
      "Inspect the live 5-stage telemetry ingestion DAG. Trace packet streams from network taps through Wazuh XML decoders and custom Python middleware into DFIR-IRIS case tickets.",
    highlights: [
      "Animated packet flow simulator with live packet injection",
      "Inspectable Wazuh XML rules (91578, 100010, 86611)",
      "4000-char buffer overflow prevention logic",
      "Per-stage latency and drop telemetry monitors",
    ],
    actionText: "Launch Pipeline Canvas",
  },
  {
    title: "Analyst Triage Workbench",
    path: "/workbench",
    icon: Shield,
    badge: "67 Attack Incidents",
    tagline: "Forensic Investigation HUD",
    description:
      "Step into the shoes of a Tier-2 SOC Analyst. Investigate sanitized real-world attacks, inspect complete raw JSON event logs, review MITRE tactics, and submit ticket classifications.",
    highlights: [
      "67 confirmed attacks across 4 major threat categories",
      "Full raw JSON logs with GeoIP origin attribution",
      "Zero-friction guest session sandbox with factory reset",
      "Interactive 3-question investigative triage checks",
    ],
    actionText: "Open Triage Workbench",
  },
  {
    title: "Alert Fatigue Reduction Lab",
    path: "/fatigue-lab",
    icon: Sliders,
    badge: "Impact Simulation",
    tagline: "Rule Optimization Studio",
    description:
      "Quantify the operational ROI of precision detection engineering. Toggle custom suppression rules and watch alert volume, MTTR, and analyst work hours update in real time.",
    highlights: [
      "Interactive Before vs After master comparison switch",
      "Toggle individual Wazuh suppression rules dynamically",
      "Live MTTR reduction modeling (42 min down to 8 min)",
      "Interactive Noise Storm visual particle simulator",
    ],
    actionText: "Explore Fatigue Lab",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative text-center pt-8 pb-4">
        {/* Modern Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-4 py-1.5 shadow-xs mb-6 backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span className="font-mono text-xs font-bold text-slate-800 tracking-tight">
            BLUE-TEAM DETECTION OPERATIONS &amp; SIEM OPTIMIZATION
          </span>
        </div>

        {/* Display Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.12]">
          Enterprise Detection Engineering.{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
            Zero Alert Fatigue.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Production-grade Wazuh rules, Python middleware integrations with 4000-character payload expansion, and an interactive light-themed SOC telemetry lab built on 67 confirmed real-world attack incidents.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 hover:shadow-lg transition-all"
          >
            <GitFork className="h-4 w-4 text-blue-400" />
            <span>Explore Pipeline DAG</span>
            <ArrowRight className="h-4 w-4 ml-0.5" />
          </Link>
          <Link
            href="/workbench"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-xs hover:border-slate-400 hover:bg-slate-50 transition-all"
          >
            <Shield className="h-4 w-4 text-blue-600" />
            <span>Launch Triage Workbench</span>
          </Link>
          <Link
            href="/fatigue-lab"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-5 py-3 text-sm font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100/80 transition-all"
          >
            <Sliders className="h-4 w-4 text-emerald-600" />
            <span>Fatigue Lab (-87% Noise)</span>
          </Link>
        </div>
      </section>

      {/* Interactive Network Topology Radar Component */}
      <section>
        <NetworkTopologyRadar />
      </section>

      {/* KPI Headline Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {HEADLINE_METRICS.map((metric, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] backdrop-blur-md overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${metric.badgeColor}`}>
                {metric.badge}
              </span>
              <span className="text-xs font-mono text-slate-400">0{idx + 1}</span>
            </div>
            <div className="text-2xl lg:text-3xl font-extrabold font-mono tracking-tight text-slate-900">
              {metric.value}
            </div>
            <div className="text-xs font-bold text-slate-800 mt-1">
              {metric.label}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              {metric.detail}
            </p>
          </div>
        ))}
      </section>

      {/* Interactive Module Showcase Cards */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-mono font-bold text-blue-600 tracking-wider uppercase">
            LIVE SHOWCASE CAPABILITIES
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Explore the BLUSOC Architecture
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Click into any of the interactive operational modules to evaluate real telemetry and triage real incidents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MODULE_SPOTLIGHTS.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.path}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-md hover:border-blue-400/80 hover:shadow-xl transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {module.badge}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-blue-600 font-semibold uppercase tracking-wider block">
                    {module.tagline}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                    {module.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {module.description}
                  </p>

                  <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    {module.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={module.path}
                  className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-800 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all"
                >
                  <span>{module.actionText}</span>
                  <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Forensic Case Study Highlight: How We Tuned Out 14,096 Noisy Logs */}
      <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-8 shadow-[0_4px_24px_rgb(0,0,0,0.03)] backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>MEASURED ENGINEERING IMPACT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Eliminating Alert Fatigue via 3-Tier Rule Correlation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              When standard SIEM deployments ingest raw firewall and endpoint feeds, analysts drown in repetitive false positives. BLUSOC tackled 14,280 daily noisy events by deploying custom parent-level suppression rules in Wazuh, whitelisting corporate egress proxy IPs in Microsoft 365 login rules, and enforcing a 4000-character payload transport buffer into DFIR-IRIS.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Noise Reduction</span>
                <span className="text-xl font-extrabold font-mono text-emerald-600">87.1%</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">MTTR Reduction</span>
                <span className="text-xl font-extrabold font-mono text-blue-600">42m &rarr; 8m</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Daily Hours Saved</span>
                <span className="text-xl font-extrabold font-mono text-indigo-600">32.5 hrs</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm w-full lg:w-96 shrink-0 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-mono font-bold text-slate-800">Rule 91578 Tuning</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                L0 Egress Filter
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Whitelists sanitized egress IPs (198.51.100.14, 198.51.100.242) so authenticated internal staff logins never alert as brute force, while escalating real credential stuffing to Level 10.
            </p>
            <div className="flex items-center justify-between text-xs font-mono text-slate-600 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <span>Saved Alerts/Day:</span>
              <span className="font-bold text-slate-900">+2,980 alerts</span>
            </div>
            <Link
              href="/fatigue-lab"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white py-2 text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <span>Test in Fatigue Lab</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
