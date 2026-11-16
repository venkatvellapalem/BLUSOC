"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Activity, CheckCircle2, RotateCcw, Radio } from "lucide-react";

interface NoiseStormSimulatorProps {
  isTuned: boolean;
  suppressionRatio: number;
}

type Dot = {
  id: number;
  lane: number;
  kind: "noise" | "signal";
  label: string;
  duration: number;
  delay: number;
  size: number;
};

const NOISE_LABELS = ["CS Null Host", "Suricata QinQ", "O365 Proxy", "Cloudflare Health"];
const SIGNAL_LABELS = ["ET DROP IOC", "GPL RCE", "Mimikatz", "WAF SQLi"];

export function NoiseStormSimulator({ isTuned, suppressionRatio }: NoiseStormSimulatorProps) {
  const [dots, setDots] = useState<Dot[]>([]);
  const [absorbed, setAbsorbed] = useState(0);
  const [passed, setPassed] = useState(0);
  const idRef = useRef(1);
  const lanes = 5;

  const targetSuppression = Math.max(0, Math.min(99, suppressionRatio));

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const count = isTuned ? 3 : 2;
      const batch: Dot[] = Array.from({ length: count }).map(() => {
        const isNoise = Math.random() < (isTuned ? 0.9 : 0.82);
        const labels = isNoise ? NOISE_LABELS : SIGNAL_LABELS;
        return {
          id: idRef.current++,
          lane: Math.floor(Math.random() * lanes),
          kind: isNoise ? "noise" : "signal",
          label: labels[Math.floor(Math.random() * labels.length)],
          duration: 2.8 + Math.random() * 1.6,
          delay: Math.random() * 0.25,
          size: isNoise ? 7 : 8,
        };
      });

      setDots((prev) => [...prev.slice(-26), ...batch]);

      batch.forEach((d) => {
        const blocked = d.kind === "noise" && isTuned && Math.random() * 100 < targetSuppression + 8;
        const resolveMs = (d.delay + d.duration * 0.48) * 1000;
        window.setTimeout(() => {
          if (!alive) return;
          if (blocked) setAbsorbed((v) => v + 1);
          else setPassed((v) => v + 1);
        }, resolveMs);
        window.setTimeout(() => {
          if (!alive) return;
          setDots((prev) => prev.filter((x) => x.id !== d.id));
        }, (d.delay + d.duration) * 1000 + 120);
      });
    };

    tick();
    const interval = window.setInterval(tick, isTuned ? 520 : 700);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [isTuned, targetSuppression]);

  const reset = () => {
    setDots([]);
    setAbsorbed(0);
    setPassed(0);
  };

  const fidelity = useMemo(() => {
    const total = absorbed + passed || 1;
    const ratio = passed === 0 ? 0 : Math.min(99, Math.round((absorbed / total) * 100));
    return { total, ratio };
  }, [absorbed, passed]);

  return (
    <div className="rounded-2xl border border-brand-border bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border bg-gradient-to-r from-brand-canvas to-white px-5 sm:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-subtle">
            <Zap className="h-4.5 w-4.5" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping" />
          </div>
          <div>
            <h3 className="text-sm sm:text-[15px] font-bold tracking-tight text-brand-text-primary">
              Real-Time Noise Deflection &amp; Filter Simulator
            </h3>
            <p className="text-xs text-brand-text-secondary">
              Live visualization of Wazuh Level 0 suppression: benign noise is absorbed, actionable signals flow to triage.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isTuned ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isTuned ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            {isTuned ? "SHIELD ACTIVE" : "SHIELD OFFLINE"}
          </span>
          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-text-secondary hover:bg-brand-muted transition-colors">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="relative h-[300px] sm:h-[320px] rounded-2xl border border-slate-800 bg-[#0A1220] overflow-hidden shadow-inner">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(rgba(148,163,184,0.35) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-emerald-500/5" />

          {/* flow lanes */}
          <div className="absolute inset-x-0 top-10 bottom-10 px-6 sm:px-10 flex flex-col justify-between">
            {Array.from({ length: lanes }).map((_, i) => (
              <div key={i} className="relative h-px w-full bg-gradient-to-r from-slate-700/20 via-slate-600/40 to-slate-700/20">
                <motion.div
                  className="absolute inset-y-[-1px] left-0 w-24 bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"
                  animate={{ x: ["-10%", "420%"] }}
                  transition={{ duration: 3.2 + i * 0.25, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
                />
              </div>
            ))}
          </div>

          {/* zones */}
          <div className="absolute left-4 top-3 sm:left-6 sm:top-4 flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-slate-400">
            <Radio className="h-3.5 w-3.5 text-blue-400" /> Raw telemetry
          </div>
          <div className="absolute right-4 top-3 sm:right-6 sm:top-4 flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Actionable egress
          </div>

          {/* shield */}
          <motion.div
            className="absolute top-4 bottom-4 left-1/2 -translate-x-1/2 w-[88px] sm:w-[110px] rounded-2xl border flex flex-col items-center justify-center gap-2"
            animate={isTuned ? { boxShadow: ["0 0 0 rgba(16,185,129,0)", "0 0 35px rgba(16,185,129,0.18)", "0 0 0 rgba(16,185,129,0)"] } : { boxShadow: "0 0 0 rgba(244,63,94,0)" }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: isTuned ? "linear-gradient(180deg, rgba(16,185,129,0.16), rgba(16,185,129,0.05), rgba(16,185,129,0.16))" : "linear-gradient(180deg, rgba(244,63,94,0.12), rgba(244,63,94,0.04), rgba(244,63,94,0.12))",
              borderColor: isTuned ? "rgba(52,211,153,0.45)" : "rgba(251,113,133,0.35)",
            }}
          >
            <motion.div
              className={`flex h-11 w-11 items-center justify-center rounded-xl border ${isTuned ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-300" : "border-rose-300/40 bg-rose-500/10 text-rose-300"}`}
              animate={isTuned ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield className="h-5 w-5" />
            </motion.div>
            <span className="font-mono text-[10px] font-bold tracking-wider text-white/90">{isTuned ? "LEVEL 0 SHIELD" : "UNFILTERED"}</span>
            <span className="font-mono text-[10px] text-slate-300/90">{isTuned ? `${targetSuppression.toFixed(1)}%` : "0.0%"}</span>
            {isTuned && (
              <motion.div className="absolute inset-x-3 top-1/2 h-px bg-emerald-300/40" animate={{ opacity: [0.2, 0.8, 0.2], scaleX: [0.8, 1, 0.8] }} transition={{ duration: 1.6, repeat: Infinity }} />
            )}
          </motion.div>

          {/* particles */}
          <AnimatePresence>
            {dots.map((d) => {
              const blocked = d.kind === "noise" && isTuned;
              const y = 48 + d.lane * 46;
              const endX = blocked ? "46%" : "104%";
              const midScale = blocked ? [1, 1, 0.2] : [1, 1, 1];
              const midOpacity = blocked ? [0, 1, 1, 0] : [0, 1, 1, 0];
              return (
                <motion.div
                  key={d.id}
                  initial={{ left: "-6%", top: y, opacity: 0, scale: 0.7 }}
                  animate={{ left: ["-6%", "46%", endX], opacity: midOpacity, scale: midScale }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: d.duration, delay: d.delay, ease: "linear", times: blocked ? [0, 0.45, 1] : [0, 0.45, 1] }}
                  className="absolute -translate-y-1/2 flex items-center gap-1.5 pointer-events-none"
                >
                  <span
                    className={`rounded-full ring-2 ${d.kind === "signal" ? "bg-rose-500 ring-rose-400/30 shadow-[0_0_12px_rgba(244,63,94,0.55)]" : "bg-slate-300 ring-slate-400/20"}`}
                    style={{ width: d.size, height: d.size }}
                  />
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border backdrop-blur-sm whitespace-nowrap ${d.kind === "signal" ? "bg-rose-950/70 text-rose-100 border-rose-500/40" : "bg-slate-900/70 text-slate-300 border-slate-700"}`}>
                    {d.label}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* sink burst */}
          {isTuned && (
            <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" animate={{ opacity: [0.08, 0.18, 0.08] }} transition={{ duration: 1.4, repeat: Infinity }}>
              <div className="h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />
            </motion.div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Noise deflected" value={absorbed.toLocaleString()} sub="Absorbed at Wazuh L0" tone="emerald" />
          <MetricCard label="Signals forwarded" value={passed.toLocaleString()} sub="Qualified for triage path" tone="rose" />
          <MetricCard label="Suppression" value={`${isTuned ? targetSuppression.toFixed(1) : "0.0"}%`} sub="Active noise elimination" tone="blue" />
          <MetricCard label="Flow fidelity" value={isTuned ? "High" : "Low"} sub={`${fidelity.ratio}% filtered in view`} tone="violet" icon={<Activity className="h-4 w-4" />} />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, tone, icon }: { label: string; value: string; sub: string; tone: "emerald" | "rose" | "blue" | "violet"; icon?: React.ReactNode }) {
  const tones: Record<string, string> = {
    emerald: "text-emerald-700 bg-emerald-50/40 border-emerald-100",
    rose: "text-rose-700 bg-rose-50/40 border-rose-100",
    blue: "text-blue-700 bg-blue-50/40 border-blue-100",
    violet: "text-violet-700 bg-violet-50/40 border-violet-100",
  };
  return (
    <div className={`rounded-xl border p-3.5 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className="mt-1 font-mono text-xl font-extrabold tracking-tight text-slate-900">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-600">{sub}</div>
    </div>
  );
}
