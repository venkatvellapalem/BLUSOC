"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { GitFork, Sliders, ArrowRight, ArrowUpRight, Layers } from "lucide-react";
import { CorrelationConsole } from "@/components/home/CorrelationGraph";
import { AnimatedCounter } from "@/components/home/AnimatedCounter";
import { Reveal } from "@/components/home/Reveal";

const METRICS = [
  { value: 3410000, suffix: "", label: "Events correlated", accent: "text-blue-600", bar: "bg-blue-500" },
  { value: 98.7, decimals: 1, suffix: "%", label: "Noise reduced (tuned)", accent: "text-emerald-600", bar: "bg-emerald-500" },
  { value: 68, suffix: "%", label: "Faster MTTR", accent: "text-amber-600", bar: "bg-amber-500" },
  { value: 13, suffix: "+", label: "Platforms integrated", accent: "text-violet-600", bar: "bg-violet-500" },
];

const STACK = [
  { name: "Wazuh", src: "/logos/wazuh.svg", width: 22, height: 22 },
  { name: "n8n", src: "/logos/n8n.png", width: 22, height: 22 },
  { name: "Suricata", src: "/logos/suricata.png", width: 22, height: 22 },
  { name: "CrowdStrike", src: "/logos/crowdstrike.png", width: 22, height: 22 },
  { name: "Laya", src: "/logos/laya.svg", width: 22, height: 22 },
];

const MODULES = [
  {
    title: "Pipeline",
    path: "/pipeline",
    icon: GitFork,
    line: "Wazuh → n8n enrich → Laya triage → IRIS, Discord/Slack, FortiGate.",
    hoverTitle: "group-hover:text-blue-600",
    hoverIcon: "group-hover:border-blue-300 group-hover:text-blue-600",
  },
  {
    title: "Tech Stack",
    path: "/tech-stack",
    icon: Layers,
    line: "Products, sensors, and response platforms across the stack.",
    hoverTitle: "group-hover:text-violet-600",
    hoverIcon: "group-hover:border-violet-300 group-hover:text-violet-600",
  },
  {
    title: "Fatigue Lab",
    path: "/fatigue-lab",
    icon: Sliders,
    line: "Watch suppression turn noise into signal.",
    hoverTitle: "group-hover:text-amber-600",
    hoverIcon: "group-hover:border-amber-300 group-hover:text-amber-600",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function HomePage() {
  return (
    <div className="relative">
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-28 pb-10">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl">
          <motion.p variants={item} className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.22em] uppercase text-brand-text-secondary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Detection Operations
          </motion.p>
          <motion.h1 variants={item} className="mt-7 text-4xl sm:text-6xl lg:text-[4.5rem] font-bold tracking-[-0.04em] leading-[1.02] text-brand-text-primary">
            Detection that silences the noise.
          </motion.h1>
          <motion.p variants={item} className="mt-6 text-base sm:text-lg leading-relaxed text-brand-text-secondary max-w-2xl">
            Multi-source telemetry correlated in Wazuh, qualifying alerts enriched by n8n, and triaged by Laya. Only true positive, high-confidence alerts become DFIR-IRIS tickets for analyst investigation, while alerts notify Discord/Slack and containment isolates affected systems via FortiGate.
          </motion.p>
          <motion.div variants={item} className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-[0_8px_24px_-10px_rgba(37,99,235,0.55)] hover:shadow-[0_12px_28px_-10px_rgba(37,99,235,0.65)]"
            >
              <GitFork className="h-4 w-4" />
              View Pipeline
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tech-stack"
              className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-6 py-3.5 text-sm font-semibold text-brand-text-primary hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <Layers className="h-4 w-4 text-violet-600" />
              Tech Stack
            </Link>
          </motion.div>

          <motion.div variants={item} className="mt-12 pt-8 border-t border-brand-border">
            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-brand-text-muted mb-4">
              Core platforms
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              {STACK.map((s) => (
                <div key={s.name} className="flex items-center gap-2.5 text-brand-text-primary">
                  <span className="flex h-9 w-auto items-center justify-center">
                    <Image src={s.src} alt={`${s.name} logo`} width={s.width} height={s.height} className="h-[22px] w-auto object-contain" />
                  </span>
                  <span className="text-sm font-semibold tracking-tight">{s.name}</span>
                </div>
              ))}
              <span className="hidden sm:inline h-5 w-px bg-brand-border" aria-hidden="true" />
              <div className="flex items-center gap-2.5 text-brand-text-primary">
                <Image src="/logos/dfir-iris.png" alt="DFIR-IRIS logo" width={22} height={22} className="h-[22px] w-[22px]" />
                <span className="text-sm font-semibold tracking-tight">DFIR-IRIS</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative rounded-xl panel overflow-hidden">
            <CorrelationConsole />
          </div>
        </Reveal>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-brand-border rounded-2xl overflow-hidden border border-brand-border shadow-sm">
            {METRICS.map((m) => (
              <div key={m.label} className="bg-white p-7 lg:p-9 group">
                <div className={`text-3xl lg:text-5xl font-bold tracking-[-0.03em] tabular ${m.accent}`}>
                  <AnimatedCounter value={m.value} decimals={m.decimals ?? 0} suffix={m.suffix} />
                </div>
                <div className="mt-3 text-sm font-medium text-brand-text-secondary">{m.label}</div>
                <div className="mt-6 h-1 w-12 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full ${m.bar} rounded-full`} style={{ width: "100%" }} />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-24">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-mono tracking-[0.18em] uppercase text-brand-text-muted">Response Flow</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-brand-text-primary">
                Qualifying alerts, decided by Laya.
              </h2>
            </div>
            <p className="text-sm text-brand-text-secondary max-w-md leading-relaxed">
              Wazuh correlates and suppresses at scale. n8n enriches qualifying alerts, Laya triages and routes only confirmed, high-confidence threats to IRIS, with notifications and containment handled automatically.
            </p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Reveal delay={0}>
            <div className="h-full rounded-2xl border border-brand-border bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <Image src="/logos/wazuh.svg" alt="Wazuh" width={28} height={28} className="h-7 w-7" />
                <Image src="/logos/n8n.png" alt="n8n" width={22} height={22} className="h-[22px] w-[22px]" />
                <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">Qualify & enrich</span>
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-[-0.02em] text-brand-text-primary">Wazuh → n8n → Laya</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                Wazuh normalizes multi-source telemetry, drops known noise, and forwards qualifying alerts to n8n. n8n enriches context and hands off to Laya. Alerts are not sent directly to IRIS or analysts.
              </p>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="h-full rounded-2xl border border-brand-border bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <Image src="/logos/n8n.png" alt="n8n" width={24} height={24} className="h-6 w-6" />
                <Image src="/logos/laya.svg" alt="Laya" width={28} height={28} className="h-7 w-7" />
                <span className="font-mono text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-2.5 py-1">Enrich & route</span>
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-[-0.02em] text-brand-text-primary">Laya decisioning</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                Laya evaluates enriched alerts for verdict and confidence, creates DFIR-IRIS tickets only for true positive, high-confidence alerts, and dispatches notifications to Discord and Slack.
              </p>
            </div>
          </Reveal>
          <Reveal delay={2}>
            <div className="h-full rounded-2xl border border-brand-border bg-white p-7 shadow-sm">
              <div className="flex items-center gap-3">
                <Image src="/logos/fortinet.svg" alt="FortiGate" width={28} height={28} className="h-7 w-7" />
                <span className="font-mono text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-1">Containment</span>
              </div>
              <h3 className="mt-5 text-xl font-bold tracking-[-0.02em] text-brand-text-primary">IRIS &amp; FortiGate</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                Analysts investigate IRIS tickets, while containment actions are sent to FortiGate to isolate affected systems when threats are confirmed by Laya.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-24">
        <Reveal>
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-sm font-mono tracking-[0.18em] uppercase text-brand-text-muted">Explore</h2>
          </div>
        </Reveal>
        <div className="border-t border-brand-border">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <Reveal key={mod.path} delay={i}>
                <Link href={mod.path} className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 sm:gap-7 py-8 border-b border-brand-border transition-all hover:bg-brand-surface/70 px-3 -mx-3 rounded-xl">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-text-muted shadow-sm ${mod.hoverIcon} transition-all group-hover:shadow-md`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-xl sm:text-2xl font-bold tracking-[-0.02em] text-brand-text-primary ${mod.hoverTitle} transition-colors`}>{mod.title}</h3>
                    <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-brand-text-secondary">{mod.line}</p>
                  </div>
                  <ArrowUpRight className={`h-5 w-5 text-brand-text-muted ${mod.hoverIcon} transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5`} />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28">
        <Reveal>
          <div className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 rounded-2xl border border-brand-border bg-gradient-to-br from-white via-white to-blue-50/40 p-8 lg:p-12 shadow-sm">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-brand-text-primary">Explore the full stack.</h2>
              <p className="mt-2 text-sm text-brand-text-secondary max-w-md">See every integrated platform, from sensors and correlation to triage, ticketing, notifications, and containment.</p>
            </div>
            <Link href="/tech-stack" className="relative inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
              View Tech Stack
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
