"use client";

import { PageIntro } from "@/components/PageIntro";
import alerts from "@/data/alerts_sanitized.json";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  BrainCircuit,
  Check,
  ChevronRight,
  Copy,
  Eye,
  Radar,
  ShieldAlert,
  Sparkles,
  Terminal,
  Ticket,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";

const FEATURED_ID = "521799";

const SEVERITY: Record<string, { label: string; cls: string; bar: string }> = {
  CRITICAL: {
    label: "CRITICAL",
    cls: "bg-rose-50 text-rose-700 border-rose-200",
    bar: "bg-rose-500",
  },
  HIGH: {
    label: "HIGH",
    cls: "bg-orange-50 text-orange-700 border-orange-200",
    bar: "bg-orange-500",
  },
  MEDIUM: {
    label: "MEDIUM",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-amber-500",
  },
  LOW: { label: "LOW", cls: "bg-blue-50 text-blue-700 border-blue-200", bar: "bg-blue-500" },
};

function formatTs(ts: string) {
  return ts.replace("T", " ").slice(0, 19);
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "journey", label: "Triage Journey" },
  { id: "evidence", label: "Raw Evidence" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function TriageSamplePage() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [tab, setTab] = useState<TabId>("overview");
  const alert = alerts.find((a) => a.id === FEATURED_ID) ?? alerts[0];
  const sev = SEVERITY[alert.severity] ?? SEVERITY.LOW;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(alert.raw_log);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
    }
  };

  const confidence = alert.expected_verdict === "True Positive" ? 98 : 72;

  const journey = useMemo(
    () => [
      {
        icon: Activity,
        title: "Ingested by sensors",
        detail:
          "Suricata DPI observed inbound traffic from known threat-intel infrastructure targeting the corporate gateway.",
        color: "text-blue-600 bg-blue-50 border-blue-200",
      },
      {
        icon: Radar,
        title: "Correlated and qualified in Wazuh",
        detail:
          "Rule logic matched ET DROP DShield block-listed source behavior and forwarded only this qualifying alert downstream.",
        color: "text-cyan-700 bg-cyan-50 border-cyan-200",
      },
      {
        icon: Workflow,
        title: "Enriched by n8n SOAR",
        detail:
          "Context and threat-intel signals (VT/AbuseIPDB/OTX-style enrichment path) were normalized and attached before triage.",
        color: "text-violet-700 bg-violet-50 border-violet-200",
      },
      {
        icon: BrainCircuit,
        title: "Triaged by Laya",
        detail: `Verdict assessed as ${alert.expected_verdict} with ${confidence}% confidence based on severity, source reputation, and rule context.`,
        color: "text-indigo-700 bg-indigo-50 border-indigo-200",
      },
      {
        icon: Ticket,
        title: "Routed to response",
        detail:
          "High-confidence true positive created a DFIR-IRIS ticket for analyst investigation, with SOC notifications available to Discord/Slack.",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      },
    ],
    [alert.expected_verdict, confidence],
  );

  return (
    <div className="min-h-screen bg-brand-canvas pb-16">
      <div className="site-container space-y-6">
        <PageIntro
          title="Every incident has a story."
          description="Follow one sanitized alert from the first signal to a response. Explore the evidence and the illustrated triage journey. This walkthrough uses sample outcomes, not a live investigation."
          breadcrumb="Incident walkthrough"
          status="Read-only sample"
        />
        {copyError && (
          <p role="status" className="text-sm text-rose-700">
            Copy unavailable. Select the raw evidence text to copy it manually.
          </p>
        )}
        <div className="rounded-2xl border border-brand-border bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-brand-border bg-brand-canvas/70 px-4 sm:px-6 py-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                aria-pressed={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${tab === t.id ? "text-brand-text-primary" : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-white"}`}
              >
                {tab === t.id && (
                  <motion.span
                    layoutId="sampleTab"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-brand-border/70"
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            ))}
            <span className="ml-auto font-mono text-[11px] text-brand-text-muted">
              #{alert.id} · {formatTs(alert.timestamp)}
            </span>
          </div>

          <div className="p-5 sm:p-7">
            <AnimatePresence mode="wait">
              {tab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${sev.cls}`}
                        >
                          {sev.label}
                        </span>
                        <span className="rounded-md border border-brand-border bg-brand-muted px-2 py-0.5 font-mono text-[11px] text-brand-text-secondary">
                          {alert.category.replace("_", " ")}
                        </span>
                        <span className="font-mono text-[11px] text-brand-text-muted">
                          {alert.provider}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-brand-text-primary leading-snug">
                        {alert.short_title}
                      </h2>
                      <p className="text-sm text-brand-text-secondary leading-relaxed">
                        {alert.title}
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 min-w-[220px]">
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                        <Check className="h-4 w-4" />
                        Resolved outcome
                      </div>
                      <p className="mt-1 text-xs text-emerald-900/80">
                        Routed as a high-confidence true positive for IRIS ticketing and analyst
                        investigation.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: "Source", value: `${alert.src_ip}:${alert.src_port}` },
                      { label: "Destination", value: `${alert.dest_ip}:${alert.dest_port}` },
                      { label: "Sensor", value: alert.sensor },
                      { label: "Alert ID", value: `#${alert.id}` },
                    ].map((f) => (
                      <div
                        key={f.label}
                        className="rounded-xl border border-brand-border bg-brand-canvas p-4"
                      >
                        <div className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">
                          {f.label}
                        </div>
                        <div className="mt-1.5 font-mono text-sm font-semibold text-brand-text-primary break-all">
                          {f.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
                    <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-bold text-brand-text-primary">
                          Why this surfaced
                        </h3>
                      </div>
                      <ul className="space-y-2.5 text-sm text-brand-text-secondary">
                        <li className="flex gap-2">
                          <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <span>
                            Inbound source matched DShield block-listed threat intelligence (ET DROP
                            context).
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <span>
                            Traffic targeted the corporate gateway from an external, untrusted host.
                          </span>
                        </li>
                        <li className="flex gap-2">
                          <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <span>
                            Qualified by Wazuh, enriched via n8n, and triaged by Laya as
                            high-confidence true positive.
                          </span>
                        </li>
                      </ul>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {alert.mitre_attack.map((t) => (
                          <span
                            key={t}
                            className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="h-4 w-4 text-violet-600" />
                        <h3 className="text-sm font-bold text-brand-text-primary">
                          Response snapshot
                        </h3>
                      </div>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                          <span className="text-sky-900">DFIR-IRIS ticket</span>
                          <span className="font-semibold text-sky-700">Created</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                          <span className="text-indigo-900">Discord / Slack</span>
                          <span className="font-semibold text-indigo-700">Notified</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <span className="text-slate-800">Containment</span>
                          <span className="font-semibold text-slate-600">Not required</span>
                        </div>
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-xs text-brand-text-muted mb-1">
                            <span>Triage confidence</span>
                            <span className="font-mono font-semibold text-brand-text-primary">
                              {confidence}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${confidence}%` }}
                              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                              className={`h-full ${sev.bar}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === "journey" && (
                <motion.div
                  key="journey"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
                    <Workflow className="h-4 w-4 text-blue-600" />
                    <span>End-to-end path for this sample (read-only narrative)</span>
                  </div>
                  <div className="relative space-y-4">
                    <div
                      className="absolute left-5 top-3 bottom-3 w-px bg-gradient-to-b from-blue-200 via-violet-200 to-emerald-200"
                      aria-hidden
                    />
                    {journey.map((step, idx) => {
                      const Icon = step.icon;
                      return (
                        <motion.div
                          key={step.title}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="relative flex gap-4 pl-1"
                        >
                          <span
                            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${step.color}`}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </span>
                          <div className="flex-1 rounded-xl border border-brand-border bg-brand-surface p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-brand-text-muted">
                                Step {idx + 1}
                              </span>
                              <h3 className="text-sm font-bold text-brand-text-primary">
                                {step.title}
                              </h3>
                            </div>
                            <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">
                              {step.detail}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                      <div className="flex items-center gap-2 text-sky-800 font-semibold text-sm">
                        <Ticket className="h-4 w-4" />
                        IRIS
                      </div>
                      <p className="mt-1 text-xs text-sky-900/80">
                        Ticket created for true positive, high-confidence alert.
                      </p>
                    </div>
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                      <div className="flex items-center gap-2 text-indigo-800 font-semibold text-sm">
                        <Bell className="h-4 w-4" />
                        Notify
                      </div>
                      <p className="mt-1 text-xs text-indigo-900/80">
                        SOC visibility delivered to Discord and Slack channels.
                      </p>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm">
                        <ShieldAlert className="h-4 w-4" />
                        Contain
                      </div>
                      <p className="mt-1 text-xs text-rose-900/80">
                        FortiGate isolation available when containment is required.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === "evidence" && (
                <motion.div
                  key="evidence"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-blue-600" />
                      <span className="font-mono text-[11px] font-bold tracking-wider text-brand-text-secondary">
                        RAW EVENT PAYLOAD (SANITIZED)
                      </span>
                    </div>
                    <button
                      onClick={copy}
                      className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-white px-3 py-1.5 text-[11px] font-semibold text-brand-text-secondary hover:border-slate-300 hover:text-brand-text-primary transition-colors"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied ? "Copied" : "Copy payload"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
                    <pre className="rounded-xl border border-slate-800 bg-[#0B1220] p-4 sm:p-5 text-[11px] leading-relaxed font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap break-all shadow-inner max-h-[460px]">
                      {alert.raw_log}
                    </pre>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text-muted">
                          Key fields
                        </h3>
                        <dl className="mt-3 space-y-2 text-xs">
                          <div className="flex justify-between gap-3">
                            <dt className="text-brand-text-muted">Provider</dt>
                            <dd className="font-mono font-semibold text-brand-text-primary text-right">
                              {alert.provider}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-brand-text-muted">Category</dt>
                            <dd className="font-mono font-semibold text-brand-text-primary text-right">
                              {alert.category}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-brand-text-muted">Verdict</dt>
                            <dd className="font-mono font-semibold text-emerald-700 text-right">
                              {alert.expected_verdict}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-3">
                            <dt className="text-brand-text-muted">MITRE</dt>
                            <dd className="font-mono font-semibold text-blue-700 text-right">
                              {alert.mitre_attack.join(", ")}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900/90 leading-relaxed">
                        This is a static, sanitized reference view for portfolio demonstration. It
                        does not submit verdicts, modify cases, or trigger actions.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
