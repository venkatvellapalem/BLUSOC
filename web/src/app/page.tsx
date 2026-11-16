"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GitFork, Shield, Sliders, ArrowRight, ArrowUpRight } from "lucide-react";
import { CorrelationConsole } from "@/components/home/CorrelationGraph";
import { AnimatedCounter } from "@/components/home/AnimatedCounter";
import { Reveal } from "@/components/home/Reveal";

const METRICS = [
  { value: 3410000, suffix: "", label: "Raw events", accent: "text-blue-600", bar: "bg-blue-500" },
  { value: 87.1, decimals: 1, suffix: "%", label: "Noise suppressed", accent: "text-emerald-600", bar: "bg-emerald-500" },
  { value: 68, suffix: "%", label: "Faster MTTR", accent: "text-amber-600", bar: "bg-amber-500" },
  { value: 67, suffix: "", label: "Attacks surfaced", accent: "text-rose-600", bar: "bg-rose-500" },
];

const MODULES = [
  {
    title: "Pipeline",
    path: "/pipeline",
    icon: GitFork,
    line: "Tap to ticket, five stages.",
    hoverTitle: "group-hover:text-blue-600",
    hoverIcon: "group-hover:border-blue-300 group-hover:text-blue-600",
  },
  {
    title: "Workbench",
    path: "/workbench",
    icon: Shield,
    line: "Investigate the 67.",
    hoverTitle: "group-hover:text-emerald-600",
    hoverIcon: "group-hover:border-emerald-300 group-hover:text-emerald-600",
  },
  {
    title: "Fatigue Lab",
    path: "/fatigue-lab",
    icon: Sliders,
    line: "Watch the noise vanish.",
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
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-8">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p variants={item} className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.22em] text-brand-text-secondary">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            DETECTION OPERATIONS
          </motion.p>
          <motion.h1 variants={item} className="mt-6 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.035em] leading-[1.02] text-brand-text-primary max-w-4xl">
            Detection that silences the noise.
          </motion.h1>
          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-glow"
            >
              <GitFork className="h-4 w-4" />
              Explore Pipeline
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/workbench"
              className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-5 py-3 text-sm font-semibold text-brand-text-primary hover:border-slate-300 transition-colors"
            >
              <Shield className="h-4 w-4 text-emerald-600" />
              Triage 67 Attacks
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Live correlation console */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative rounded-xl panel overflow-hidden">
            <CorrelationConsole />
          </div>
        </Reveal>
      </section>

      {/* Metrics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-brand-border rounded-xl overflow-hidden border border-brand-border">
            {METRICS.map((m) => (
              <div key={m.label} className="bg-white p-6 lg:p-8">
                <div className={`text-3xl lg:text-5xl font-bold tracking-tight tabular ${m.accent}`}>
                  <AnimatedCounter value={m.value} decimals={m.decimals ?? 0} suffix={m.suffix} />
                </div>
                <div className="mt-2 text-sm text-brand-text-secondary">{m.label}</div>
                <div className="mt-5 h-px w-10 bg-brand-border">
                  <div className={`h-px ${m.bar}`} style={{ width: "100%" }} />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Modules */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-20">
        <div className="border-t border-brand-border">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <Reveal key={mod.path} delay={i}>
                <Link
                  href={mod.path}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 py-7 border-b border-brand-border transition-colors hover:bg-brand-surface px-2 -mx-2 rounded-lg"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg border border-brand-border bg-white text-brand-text-muted ${mod.hoverIcon} transition-colors`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-xl sm:text-2xl font-bold tracking-tight text-brand-text-primary ${mod.hoverTitle} transition-colors`}>
                      {mod.title}
                    </h3>
                    <p className="mt-1 text-sm text-brand-text-muted">{mod.line}</p>
                  </div>
                  <ArrowUpRight className={`h-5 w-5 text-brand-text-muted ${mod.hoverIcon} transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5`} />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <Reveal>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-xl panel p-8 lg:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-text-primary">
              Ship the full stack.
            </h2>
            <a
              href="https://github.com/blusoc/blusoc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-glow"
            >
              View Repository
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
