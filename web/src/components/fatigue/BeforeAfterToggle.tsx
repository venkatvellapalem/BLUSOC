"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Shield, Activity, RefreshCw } from "lucide-react";

export interface BeforeAfterToggleProps {
  mode: "raw" | "tuned" | "custom";
  onSelectMode: (mode: "raw" | "tuned") => void;
  activeRuleCount: number;
  totalRuleCount: number;
}

export function BeforeAfterToggle({
  mode,
  onSelectMode,
  activeRuleCount,
  totalRuleCount,
}: BeforeAfterToggleProps) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 sm:p-8 shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-brand-border">
        {/* Title and Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Activity className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-brand-text-primary tracking-tight">
              Operational Pipeline Mode
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-brand-text-secondary">
            Switch between raw un-tuned SIEM telemetry and the production BLUSOC suppression pipeline.
          </p>
        </div>

        {/* Master Segmented Switch */}
        <div className="inline-flex p-1.5 rounded-xl border border-brand-border bg-brand-muted/70 shadow-inner">
          <button
            type="button"
            onClick={() => onSelectMode("raw")}
            className={`relative flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
              mode === "raw"
                ? "bg-white text-rose-700 shadow-card border border-rose-200"
                : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-white/50"
            }`}
          >
            <AlertTriangle className={`h-4 w-4 ${mode === "raw" ? "text-rose-600" : "text-brand-text-muted"}`} />
            <span>Raw Telemetry (Unoptimized)</span>
            {mode === "raw" && (
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectMode("tuned")}
            className={`relative flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
              mode === "tuned"
                ? "bg-white text-emerald-700 shadow-card border border-emerald-200"
                : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-white/50"
            }`}
          >
            <Shield className={`h-4 w-4 ${mode === "tuned" ? "text-emerald-600" : "text-brand-text-muted"}`} />
            <span>BLUSOC Tuned (Optimized)</span>
            {mode === "tuned" && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* Operational State Banner */}
      <div className="mt-6">
        {mode === "raw" && (
          <motion.div
            key="raw-state"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-rose-200 bg-rose-50/60 p-5 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 tracking-wide">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                    BASELINE OPERATING STATE: SEVERE ALERT FATIGUE
                  </span>
                  <span className="text-xs font-mono font-medium text-rose-700">
                    0 / {totalRuleCount} Rules Active
                  </span>
                </div>
                <h3 className="text-base font-bold text-rose-950">
                  Un-tuned Telemetry Ingestion (14,280 Daily Alerts)
                </h3>
                <p className="text-xs sm:text-sm text-rose-900/85 leading-relaxed max-w-3xl">
                  Central Wazuh analysis engine receives unfiltered telemetry from perimeter wire sniffers,
                  ephemeral cloud containers, and corporate proxy gateways. Tier-1 analysts are flooded with
                  3,500+ tickets per shift: 98.7% are false positives. Critical intrusion alerts suffer an average
                  42-minute response latency.
                </p>
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0">
                <div className="rounded-lg border border-rose-200 bg-white/90 px-3.5 py-2 text-center shadow-subtle">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-rose-600">
                    Mean Response Time
                  </span>
                  <span className="font-mono text-base font-bold text-rose-900">42 min</span>
                </div>
                <div className="rounded-lg border border-rose-200 bg-white/90 px-3.5 py-2 text-center shadow-subtle">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-rose-600">
                    Noise Ingestion Floor
                  </span>
                  <span className="font-mono text-base font-bold text-rose-900">98.7%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {mode === "tuned" && (
          <motion.div
            key="tuned-state"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 tracking-wide">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    PRODUCTION TUNED STATE: HIGH-FIDELITY PIPELINE
                  </span>
                  <span className="text-xs font-mono font-medium text-emerald-700">
                    {totalRuleCount} / {totalRuleCount} Rules Active (100%)
                  </span>
                </div>
                <h3 className="text-base font-bold text-emerald-950">
                  Targeted In-Memory Level 0 Noise Suppression (184 Daily Alerts)
                </h3>
                <p className="text-xs sm:text-sm text-emerald-900/85 leading-relaxed max-w-3xl">
                  Level 0 suppression rules silence 14,096 benign events in memory without writing to disk or dispatching
                  to ticketing queues. Corporate proxy allowlisting isolates legitimate internal logins while escalating
                  foreign brute-force campaigns. Mean response time drops to 8 minutes, recovering 32.5 analyst hours daily.
                </p>
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0">
                <div className="rounded-lg border border-emerald-200 bg-white/90 px-3.5 py-2 text-center shadow-subtle">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                    Response Speed
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-900">8 min MTTR</span>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-white/90 px-3.5 py-2 text-center shadow-subtle">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                    Noise Elimination
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-900">-98.7%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {mode === "custom" && (
          <motion.div
            key="custom-state"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 tracking-wide">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    INCREMENTAL EVALUATION MODE: PARTIALLY TUNED
                  </span>
                  <span className="text-xs font-mono font-medium text-amber-700">
                    {activeRuleCount} / {totalRuleCount} Rules Active
                  </span>
                </div>
                <h3 className="text-base font-bold text-amber-950">
                  Custom Suppression Configuration ({activeRuleCount} of {totalRuleCount} Rules Active)
                </h3>
                <p className="text-xs sm:text-sm text-amber-900/85 leading-relaxed max-w-3xl">
                  You are evaluating incremental rule suppression. Toggle individual switches in the matrix below to
                  quantify how each detection rule impacts daily ticket volume, false positive ratios, and analyst workload.
                </p>
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectMode("tuned")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-subtle transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Activate All Rules</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectMode("raw")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-2 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset to Raw Baseline</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
