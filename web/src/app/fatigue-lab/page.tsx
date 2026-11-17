"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sliders,
  ArrowLeft,
  ArrowRight,
  Shield,
  Layers,
  GitFork,
  Sparkles,
  Database,
  Terminal,
  CheckCircle2,
  Workflow,
  Gauge,
} from "lucide-react";
import { BeforeAfterToggle } from "@/components/fatigue/BeforeAfterToggle";
import { NoiseStormSimulator } from "@/components/fatigue/NoiseStormSimulator";
import { ImpactCounterGrid } from "@/components/fatigue/ImpactCounterGrid";
import { RuleOptimizerMatrix, SUPPRESSION_RULES } from "@/components/fatigue/RuleOptimizerMatrix";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function FatigueLabPage() {
  const [activeRules, setActiveRules] = useState<Record<string, boolean>>({
    "rule-100010": true,
    "rule-86611": true,
    "rule-91578": true,
    "rule-100550": true,
  });

  const totalBaseline = 14280;
  const actionableBase = 184;
  const totalNoiseMax = totalBaseline - actionableBase;

  const activeRuleCount = Object.values(activeRules).filter(Boolean).length;
  const totalRuleCount = SUPPRESSION_RULES.length;

  const mode: "raw" | "tuned" | "custom" =
    activeRuleCount === totalRuleCount ? "tuned" : activeRuleCount === 0 ? "raw" : "custom";

  const suppressedVolume = SUPPRESSION_RULES.reduce(
    (acc, rule) => (activeRules[rule.id] ? acc + rule.eventsPerDay : acc),
    0
  );
  const dailyVolume = totalBaseline - suppressedVolume;
  const isTuned = mode === "tuned";

  const falsePositiveRate =
    dailyVolume === actionableBase
      ? 2.1
      : dailyVolume === totalBaseline
      ? 98.7
      : Math.max(2.1, Math.min(98.7, Number((((dailyVolume - 180) / dailyVolume) * 100).toFixed(1))));

  const mttrMinutes =
    dailyVolume === actionableBase
      ? 8
      : dailyVolume === totalBaseline
      ? 42
      : Math.round(8 + ((dailyVolume - actionableBase) / totalNoiseMax) * 34);

  const hoursSaved =
    dailyVolume === totalBaseline
      ? 0.0
      : dailyVolume === actionableBase
      ? 32.5
      : Number(((suppressedVolume / totalNoiseMax) * 32.5).toFixed(1));

  let signalToNoiseRatio = "48 : 1";
  if (dailyVolume === totalBaseline) signalToNoiseRatio = "1 : 77";
  else if (dailyVolume !== actionableBase) {
    const signal = 180;
    const noise = dailyVolume - 180;
    signalToNoiseRatio =
      noise > signal ? `1 : ${Math.round(noise / signal)}` : `${Math.round(signal / Math.max(1, noise))} : 1`;
  }

  const handleSelectMode = (newMode: "raw" | "tuned") => {
    const on = newMode === "tuned";
    setActiveRules({ "rule-100010": on, "rule-86611": on, "rule-91578": on, "rule-100550": on });
  };
  const handleToggleRule = (ruleId: string) =>
    setActiveRules((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }));
  const handleEnableAll = () =>
    setActiveRules({ "rule-100010": true, "rule-86611": true, "rule-91578": true, "rule-100550": true });
  const handleDisableAll = () =>
    setActiveRules({ "rule-100010": false, "rule-86611": false, "rule-91578": false, "rule-100550": false });

  const suppressionPct = Number(((suppressedVolume / totalNoiseMax) * 100).toFixed(1));

  return (
    <div className="min-h-screen bg-brand-canvas py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Overview
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-[11px] font-semibold text-blue-700">
              Fatigue Lab
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1 font-mono text-[11px] text-brand-text-secondary shadow-subtle">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isTuned ? "bg-emerald-500 animate-pulse" : mode === "raw" ? "bg-rose-500" : "bg-amber-500"
                }`}
              />
              {mode.toUpperCase()} MODE
            </span>
          </div>
        </motion.div>

        <motion.section
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="relative overflow-hidden rounded-3xl border border-brand-border bg-gradient-to-br from-white via-white to-blue-50/40 p-6 sm:p-8 lg:p-10 shadow-sm"
        >
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-emerald-100/30 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <motion.div variants={fadeUp} custom={0} className="flex items-center gap-4">
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.6)]">
                  <Sliders className="h-6 w-6" />
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
                </span>
                <div>
                  <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-brand-text-muted">Detection Engineering</p>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-brand-text-primary">Alert Fatigue Reduction Lab</h1>
                </div>
              </motion.div>
              <motion.p variants={fadeUp} custom={1} className="text-sm sm:text-[15px] leading-relaxed text-brand-text-secondary max-w-2xl">
                Interactively tune Wazuh suppression rules and watch noise collapse into signal. Model the impact on alert volume, analyst response time, and SOC capacity  -  with qualifying alerts enriched by n8n and triaged by Laya.
              </motion.p>
              <motion.div variants={fadeUp} custom={2} className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/wazuh.svg" alt="Wazuh" width={14} height={14} className="h-3.5 w-3.5" /> Wazuh 4.x
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/n8n.png" alt="n8n" width={14} height={14} className="h-3.5 w-3.5" /> n8n SOAR
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/laya.svg" alt="Laya" width={14} height={14} className="h-3.5 w-3.5" /> Laya
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/suricata.png" alt="Suricata" width={14} height={14} className="h-3.5 w-3.5 object-contain" /> Suricata
                </span>
              </motion.div>
            </div>
            <motion.div variants={fadeUp} custom={3} className="grid grid-cols-2 gap-3 min-w-[280px]">
              <HeroStat label="Baseline" value="14,280" sub="alerts / day" tone="slate" />
              <HeroStat label="Actionable" value={dailyVolume.toLocaleString()} sub="after tuning" tone={isTuned ? "emerald" : mode === "raw" ? "rose" : "amber"} />
              <HeroStat label="Noise cut" value={`${suppressionPct}%`} sub="suppressed volume" tone="blue" />
              <HeroStat label="MTTR" value={`${mttrMinutes}m`} sub="mean response" tone="violet" />
            </motion.div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}>
          <BeforeAfterToggle mode={mode} onSelectMode={handleSelectMode} activeRuleCount={activeRuleCount} totalRuleCount={totalRuleCount} />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
          <NoiseStormSimulator
            isTuned={isTuned}
            suppressionRatio={isTuned ? 87.1 : Number(((suppressedVolume / totalNoiseMax) * 87.1).toFixed(1))}
          />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }}>
          <ImpactCounterGrid
            dailyVolume={dailyVolume}
            falsePositiveRate={falsePositiveRate}
            mttrMinutes={mttrMinutes}
            hoursSaved={hoursSaved}
            signalToNoiseRatio={signalToNoiseRatio}
            isTuned={isTuned}
            mode={mode}
          />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}>
          <RuleOptimizerMatrix
            activeRules={activeRules}
            onToggleRule={handleToggleRule}
            onEnableAll={handleEnableAll}
            onDisableAll={handleDisableAll}
          />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.25 }} className="space-y-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-[-0.02em] text-brand-text-primary">How the noise was engineered out</h2>
              <p className="mt-1 text-sm text-brand-text-secondary max-w-3xl">
                A concise view of the suppression strategy, routing, and measurable ROI  -  without drowning in raw telemetry.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <InsightCard
              icon={Layers}
              title="3-tier suppression strategy"
              accent="text-blue-600 bg-blue-50 border-blue-200"
              items={[
                "Level 0 drops (heartbeat/null-host, link-layer artifacts, synthetic probes) silenced in-memory.",
                "Proxy-aware egress tuning separates authorized corporate logins from real credential abuse.",
                "High-fidelity threat intel (ET DROP/CINS, malware, RCE) stays actionable for triage.",
              ]}
            />
            <InsightCard
              icon={Workflow}
              title="Qualifying alert flow"
              accent="text-violet-600 bg-violet-50 border-violet-200"
              items={[
                "Wazuh correlates and forwards only qualifying alerts to n8n for enrichment (VT/AbuseIPDB/OTX-style).",
                "Laya assigns verdict and confidence, then routes outcomes deterministically.",
                "TP + high confidence → DFIR-IRIS ticket; alerts → Discord/Slack; containment → FortiGate.",
              ]}
            />
            <InsightCard
              icon={Gauge}
              title="Measured outcome"
              accent="text-emerald-600 bg-emerald-50 border-emerald-200"
              items={[
                "14,280/day baseline reduced by targeted suppression while preserving 184 actionable incidents.",
                "MTTR improved from ~42m to ~8m with ~32.5 analyst hours recovered daily.",
                "Analysts investigate IRIS tickets  -  not raw Wazuh noise.",
              ]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-brand-text-primary">Noise sources vs preserved signal</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: "CrowdStrike null-host / heartbeat noise", value: 6840, pct: 47.9, color: "bg-indigo-500" },
                  { label: "Suricata link-layer & checksum artifacts", value: 3210, pct: 22.5, color: "bg-violet-500" },
                  { label: "O365 authorized egress proxy logins", value: 2980, pct: 20.9, color: "bg-sky-500" },
                  { label: "Cloudflare synthetic health checks", value: 1066, pct: 7.5, color: "bg-amber-500" },
                  { label: "Actionable attack telemetry (preserved)", value: 184, pct: 1.3, color: "bg-emerald-600" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-3">
                      <span className="text-brand-text-secondary truncate">{row.label}</span>
                      <span className="font-mono font-semibold text-brand-text-primary shrink-0">
                        {row.value.toLocaleString()} ({row.pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(row.pct, 1.8)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${row.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-brand-border bg-[#0B1220] p-5 text-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Validation harness</h3>
                </div>
                <div className="font-mono text-[11px] leading-relaxed space-y-1.5">
                  <div className="text-emerald-400">$ python detection-engineering/wazuh/tests/validate_rules.py</div>
                  <div className="text-slate-400">[XML] Parsed suppression/correlation rules ... OK</div>
                  <div className="text-slate-400">[SAMPLES] sample_events.json coverage ... 20/20 PASS</div>
                  <div className="text-slate-400">[ROUTING] qualifying → n8n → Laya → IRIS/Notify/Contain ... OK</div>
                  <div className="text-emerald-400 font-semibold">STATUS: regression checks passing</div>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-brand-text-primary mb-3">Explore related views</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Link href="/pipeline" className="group flex items-center justify-between rounded-xl border border-brand-border p-3 hover:bg-slate-50 hover:border-slate-300 transition-all">
                    <span className="flex items-center gap-2 text-sm font-semibold text-brand-text-primary"><GitFork className="h-4 w-4 text-blue-600" />Pipeline</span>
                    <ArrowRight className="h-4 w-4 text-brand-text-muted group-hover:text-blue-600" />
                  </Link>
                  <Link href="/workbench" className="group flex items-center justify-between rounded-xl border border-brand-border p-3 hover:bg-slate-50 hover:border-slate-300 transition-all">
                    <span className="flex items-center gap-2 text-sm font-semibold text-brand-text-primary"><Shield className="h-4 w-4 text-emerald-600" />Sample</span>
                    <ArrowRight className="h-4 w-4 text-brand-text-muted group-hover:text-emerald-600" />
                  </Link>
                  <Link href="/tech-stack" className="group flex items-center justify-between rounded-xl border border-brand-border p-3 hover:bg-slate-50 hover:border-slate-300 transition-all sm:col-span-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-brand-text-primary"><Layers className="h-4 w-4 text-violet-600" />Full Tech Stack</span>
                    <ArrowRight className="h-4 w-4 text-brand-text-muted group-hover:text-violet-600" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "slate" | "emerald" | "rose" | "amber" | "blue" | "violet";
}) {
  const tones: Record<string, string> = {
    slate: "border-slate-200 bg-white text-slate-900",
    emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-900",
    rose: "border-rose-200 bg-rose-50/60 text-rose-900",
    amber: "border-amber-200 bg-amber-50/60 text-amber-900",
    blue: "border-blue-200 bg-blue-50/60 text-blue-900",
    violet: "border-violet-200 bg-violet-50/60 text-violet-900",
  };
  return (
    <div className={`rounded-xl border p-3.5 shadow-subtle ${tones[tone]}`}>
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-600">{label}</div>
      <div className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight">{value}</div>
      <div className="text-[11px] text-slate-600">{sub}</div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  accent,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  accent: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${accent}`}>
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-bold text-brand-text-primary">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it} className="flex gap-2.5 text-sm text-brand-text-secondary leading-relaxed">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
