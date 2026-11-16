"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Copy, ShieldCheck } from "lucide-react";
import alerts from "@/data/alerts_sanitized.json";

const FEATURED_ID = "521799";

const SEVERITY: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: "CRITICAL", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  HIGH: { label: "HIGH", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  MEDIUM: { label: "MEDIUM", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  LOW: { label: "LOW", cls: "bg-blue-50 text-blue-700 border-blue-200" },
};

function formatTs(ts: string) {
  return ts.replace("T", " ").slice(0, 19);
}

export default function TriageSamplePage() {
  const [copied, setCopied] = useState(false);
  const alert = alerts.find((a) => a.id === FEATURED_ID) ?? alerts[0];
  const sev = SEVERITY[alert.severity] ?? SEVERITY.LOW;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(alert.raw_log);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Overview
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-text-primary">
          Triage Sample
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-brand-muted px-2.5 py-1 text-[11px] font-mono font-medium text-brand-text-secondary">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          READ-ONLY
        </span>
      </div>
      <p className="mt-2 text-sm text-brand-text-secondary max-w-xl">
        A single sanitized incident, shown as a static reference for how BLUSOC surfaces
        confirmed attacks. Not an interactive training tool.
      </p>

      <div className="mt-8 rounded-xl panel overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-4 border-b border-brand-border">
          <span className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${sev.cls}`}>
            {sev.label}
          </span>
          <span className="rounded-md border border-brand-border bg-brand-muted px-2 py-0.5 font-mono text-[11px] text-brand-text-secondary">
            {alert.category.replace("_", " ")}
          </span>
          <span className="font-mono text-[11px] text-brand-text-muted">{alert.provider}</span>
          <span className="ml-auto font-mono text-[11px] text-brand-text-muted">
            #{alert.id} · {formatTs(alert.timestamp)}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-brand-text-primary leading-snug">
            {alert.short_title}
          </h2>
          <p className="mt-1.5 text-xs text-brand-text-muted leading-relaxed">{alert.title}</p>

          {/* Facts */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-brand-border bg-brand-canvas p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Source</div>
              <div className="mt-1 font-mono text-sm font-semibold text-brand-text-primary tabular">
                {alert.src_ip}:{alert.src_port}
              </div>
            </div>
            <div className="rounded-lg border border-brand-border bg-brand-canvas p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Destination</div>
              <div className="mt-1 font-mono text-sm font-semibold text-brand-text-primary tabular">
                {alert.dest_ip}:{alert.dest_port}
              </div>
            </div>
            <div className="rounded-lg border border-brand-border bg-brand-canvas p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-brand-text-muted">Sensor</div>
              <div className="mt-1 font-mono text-sm font-semibold text-brand-text-primary truncate">
                {alert.sensor}
              </div>
            </div>
          </div>

          {/* MITRE + verdict */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {alert.mitre_attack.map((t) => (
              <span key={t} className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700">
                {t}
              </span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              <Check className="h-3 w-3" />
              {alert.expected_verdict} — resolved
            </span>
          </div>

          {/* Raw log */}
          <div className="mt-6">
            <div className="flex items-center justify-between pb-2">
              <span className="font-mono text-[11px] font-bold tracking-wider text-brand-text-secondary">
                RAW EVENT PAYLOAD
              </span>
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-white px-2.5 py-1 text-[11px] font-medium text-brand-text-secondary hover:border-slate-300 hover:text-brand-text-primary transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="rounded-lg border border-brand-border bg-brand-canvas p-4 text-[11px] leading-relaxed font-mono text-brand-text-secondary overflow-x-auto whitespace-pre-wrap break-all">
              {alert.raw_log}
            </pre>
          </div>
        </div>
      </div>

      <p className="mt-5 text-xs text-brand-text-muted">
        The full dataset holds 67 sanitized incidents across 4 attack categories, published in
        the repository&apos;s <code className="font-mono">data/alerts_sanitized.json</code>.
      </p>
    </div>
  );
}
