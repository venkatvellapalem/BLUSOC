"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Filter,
  Clock,
  Zap,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";

export interface ImpactCounterGridProps {
  dailyVolume: number;
  falsePositiveRate: number;
  mttrMinutes: number;
  hoursSaved: number;
  signalToNoiseRatio: string;
  isTuned: boolean;
  mode: "raw" | "tuned" | "custom";
}

export function ImpactCounterGrid({
  dailyVolume,
  falsePositiveRate,
  mttrMinutes,
  hoursSaved,
  signalToNoiseRatio,
  isTuned,
  mode,
}: ImpactCounterGridProps) {
  const cards = [
    {
      id: "volume",
      title: "Daily Alert Volume",
      value: dailyVolume.toLocaleString(),
      unit: "alerts / day",
      baseline: "14,280 alerts / day",
      target: "184 alerts / day",
      delta:
        dailyVolume === 14280
          ? "Baseline (Unfiltered)"
          : `-${(((14280 - dailyVolume) / 14280) * 100).toFixed(1)}% volume`,
      deltaType: dailyVolume < 14280 ? "positive" : "neutral",
      icon: Activity,
      iconBg: "bg-blue-50 text-blue-600 border-blue-200",
      description: "Events reaching Tier-1 triage after engine rule processing.",
    },
    {
      id: "fp-rate",
      title: "False Positive Ratio",
      value: `${falsePositiveRate.toFixed(1)}%`,
      unit: "benign tickets",
      baseline: "98.7%",
      target: "2.1%",
      delta:
        dailyVolume === 14280
          ? "Critical Noise Floor"
          : `-${(98.7 - falsePositiveRate).toFixed(1)}% benign chatter`,
      deltaType: falsePositiveRate < 90 ? "positive" : "negative",
      icon: Filter,
      iconBg: "bg-purple-50 text-purple-600 border-purple-200",
      description: "Share of tickets that resolve as benign health checks or framing artifacts.",
    },
    {
      id: "mttr",
      title: "Mean Time to Respond",
      value: `${mttrMinutes} min`,
      unit: "triage latency",
      baseline: "42 min",
      target: "8 min",
      delta:
        mttrMinutes === 42
          ? "Extended Queue Latency"
          : `-${Math.round(((42 - mttrMinutes) / 42) * 100)}% faster response`,
      deltaType: mttrMinutes <= 15 ? "positive" : mttrMinutes < 30 ? "neutral" : "negative",
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600 border-amber-200",
      description: "Average minutes from sensor packet capture to analyst investigation.",
    },
    {
      id: "hours-saved",
      title: "Analyst Hours Saved",
      value: `${hoursSaved.toFixed(1)} hrs`,
      unit: "daily capacity",
      baseline: "0.0 hrs",
      target: "32.5 hrs / day",
      delta:
        hoursSaved === 0
          ? "0.0 hrs recovered"
          : `+${(hoursSaved / 8).toFixed(1)} FTE equivalent capacity`,
      deltaType: hoursSaved > 0 ? "positive" : "neutral",
      icon: Zap,
      iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
      description: "Direct operational labor redirected from noise to proactive threat hunting.",
    },
    {
      id: "snr",
      title: "Signal to Noise Ratio",
      value: signalToNoiseRatio,
      unit: "signal : noise",
      baseline: "1 : 77",
      target: "48 : 1",
      delta:
        signalToNoiseRatio === "1:77" || signalToNoiseRatio === "1 : 77"
          ? "Adversary Activity Masked"
          : isTuned
          ? "+3,696% fidelity gain"
          : "Fidelity improving",
      deltaType: isTuned ? "positive" : dailyVolume < 10000 ? "neutral" : "negative",
      icon: ShieldAlert,
      iconBg: "bg-sky-50 text-sky-600 border-sky-200",
      description: "Ratio of high-severity threat IOCs to non-actionable operational events.",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-text-muted">
            SOC Operational Impact Metrics
          </h3>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Real-time recalculation of key performance indicators based on active suppression rules
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] font-mono text-brand-text-muted">
            Active Mode:
          </span>
          <span
            className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold border ${
              mode === "tuned"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : mode === "raw"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {mode.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Grid of 5 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className="relative flex flex-col justify-between rounded-xl border border-brand-border bg-brand-surface p-5 shadow-card hover:border-slate-300 transition-colors"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${card.iconBg}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {/* Delta Pill */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                      card.deltaType === "positive"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : card.deltaType === "negative"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {card.deltaType === "positive" && <ArrowUpRight className="h-3 w-3" />}
                    {card.deltaType === "negative" && <ArrowDownRight className="h-3 w-3" />}
                    {card.deltaType === "neutral" && <Minus className="h-3 w-3" />}
                    <span>{card.delta}</span>
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-brand-text-secondary">
                    {card.title}
                  </h4>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-extrabold tracking-tight text-brand-text-primary">
                      {card.value}
                    </span>
                    <span className="text-[11px] font-medium text-brand-text-muted">
                      {card.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="mt-4 pt-3 border-t border-brand-border/70 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-brand-text-muted">
                  <span>Baseline:</span>
                  <span className="font-semibold text-brand-text-secondary">{card.baseline}</span>
                </div>
                <p className="text-[11px] text-brand-text-muted leading-snug line-clamp-2">
                  {card.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
