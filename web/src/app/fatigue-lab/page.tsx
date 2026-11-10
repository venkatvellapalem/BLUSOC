"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  ArrowLeft,
  ArrowRight,
  Shield,
  Activity,
  Layers,
  GitFork,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Database,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { BeforeAfterToggle } from "@/components/fatigue/BeforeAfterToggle";
import { NoiseStormSimulator } from "@/components/fatigue/NoiseStormSimulator";
import { ImpactCounterGrid } from "@/components/fatigue/ImpactCounterGrid";
import {
  RuleOptimizerMatrix,
  SUPPRESSION_RULES,
} from "@/components/fatigue/RuleOptimizerMatrix";

export default function FatigueLabPage() {
  // State for active suppression rules: defaults to fully tuned
  const [activeRules, setActiveRules] = useState<Record<string, boolean>>({
    "rule-100010": true,
    "rule-86611": true,
    "rule-91578": true,
    "rule-100550": true,
  });

  const totalBaseline = 14280;
  const actionableBase = 184;
  const totalNoiseMax = totalBaseline - actionableBase; // 14,096

  // Count active rules
  const activeRuleCount = Object.values(activeRules).filter(Boolean).length;
  const totalRuleCount = SUPPRESSION_RULES.length;

  // Determine active mode
  const mode: "raw" | "tuned" | "custom" =
    activeRuleCount === totalRuleCount
      ? "tuned"
      : activeRuleCount === 0
      ? "raw"
      : "custom";

  // Calculate volume and metric values
  const suppressedVolume = SUPPRESSION_RULES.reduce((acc, rule) => {
    return activeRules[rule.id] ? acc + rule.eventsPerDay : acc;
  }, 0);

  const dailyVolume = totalBaseline - suppressedVolume;
  const isTuned = mode === "tuned";

  // False Positive Ratio calculation
  const falsePositiveRate =
    dailyVolume === actionableBase
      ? 2.1
      : dailyVolume === totalBaseline
      ? 98.7
      : Math.max(
          2.1,
          Math.min(
            98.7,
            Number((((dailyVolume - 180) / dailyVolume) * 100).toFixed(1))
          )
        );

  // MTTR calculation
  const mttrMinutes =
    dailyVolume === actionableBase
      ? 8
      : dailyVolume === totalBaseline
      ? 42
      : Math.round(8 + ((dailyVolume - actionableBase) / totalNoiseMax) * 34);

  // Hours Saved calculation
  const hoursSaved =
    dailyVolume === totalBaseline
      ? 0.0
      : dailyVolume === actionableBase
      ? 32.5
      : Number(((suppressedVolume / totalNoiseMax) * 32.5).toFixed(1));

  // Signal to Noise Ratio calculation
  let signalToNoiseRatio = "48 : 1";
  if (dailyVolume === totalBaseline) {
    signalToNoiseRatio = "1 : 77";
  } else if (dailyVolume === actionableBase) {
    signalToNoiseRatio = "48 : 1";
  } else {
    const signal = 180;
    const noise = dailyVolume - 180;
    if (noise > signal) {
      signalToNoiseRatio = `1 : ${Math.round(noise / signal)}`;
    } else {
      signalToNoiseRatio = `${Math.round(signal / Math.max(1, noise))} : 1`;
    }
  }

  // Handlers
  const handleSelectMode = (newMode: "raw" | "tuned") => {
    if (newMode === "raw") {
      setActiveRules({
        "rule-100010": false,
        "rule-86611": false,
        "rule-91578": false,
        "rule-100550": false,
      });
    } else {
      setActiveRules({
        "rule-100010": true,
        "rule-86611": true,
        "rule-91578": true,
        "rule-100550": true,
      });
    }
  };

  const handleToggleRule = (ruleId: string) => {
    setActiveRules((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  const handleEnableAll = () => {
    setActiveRules({
      "rule-100010": true,
      "rule-86611": true,
      "rule-91578": true,
      "rule-100550": true,
    });
  };

  const handleDisableAll = () => {
    setActiveRules({
      "rule-100010": false,
      "rule-86611": false,
      "rule-91578": false,
      "rule-100550": false,
    });
  };

  return (
    <div className="min-h-screen bg-brand-canvas py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation Breadcrumbs & Top Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Enterprise Overview</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-xs font-semibold text-blue-700">
              Module: Alert Fatigue Reduction Lab
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs text-brand-text-muted shadow-subtle">
              SIEM Core: Wazuh 4.x
            </span>
          </div>
        </div>

        {/* Hero Title Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shadow-subtle">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-text-primary">
                Alert Fatigue Reduction Lab
              </h1>
              <p className="text-xs sm:text-sm text-brand-text-secondary mt-0.5">
                Dynamic telemetry noise modeling, interactive rule optimizer matrix, and quantified SOC capacity ROI.
              </p>
            </div>
          </div>
        </div>

        {/* Deliverable 1: Master Before / After Toggle */}
        <section aria-labelledby="toggle-heading">
          <h2 id="toggle-heading" className="sr-only">
            Operational State Mode Toggle
          </h2>
          <BeforeAfterToggle
            mode={mode}
            onSelectMode={handleSelectMode}
            activeRuleCount={activeRuleCount}
            totalRuleCount={totalRuleCount}
          />
        </section>

        {/* Deliverable 1B: Real-Time Noise Deflection & Particle Simulator */}
        <section aria-labelledby="simulator-heading">
          <h2 id="simulator-heading" className="sr-only">
            Noise Deflection Particle Simulator
          </h2>
          <NoiseStormSimulator
            isTuned={isTuned}
            suppressionRatio={isTuned ? 87.1 : Number(((suppressedVolume / totalNoiseMax) * 87.1).toFixed(1))}
          />
        </section>

        {/* Deliverable 2: 5 KPI Metric Cards Grid */}
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="sr-only">
            Operational Impact Metrics
          </h2>
          <ImpactCounterGrid
            dailyVolume={dailyVolume}
            falsePositiveRate={falsePositiveRate}
            mttrMinutes={mttrMinutes}
            hoursSaved={hoursSaved}
            signalToNoiseRatio={signalToNoiseRatio}
            isTuned={isTuned}
            mode={mode}
          />
        </section>

        {/* Deliverable 3: Interactive Rule Optimizer Matrix */}
        <section aria-labelledby="matrix-heading">
          <h2 id="matrix-heading" className="sr-only">
            Suppression Rule Matrix and Code Drawer
          </h2>
          <RuleOptimizerMatrix
            activeRules={activeRules}
            onToggleRule={handleToggleRule}
            onEnableAll={handleEnableAll}
            onDisableAll={handleDisableAll}
          />
        </section>

        {/* Deliverable 4: Engineering Deep-Dive Case Study */}
        <section className="space-y-8 pt-6 border-t border-brand-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                <FileCheck2 className="h-4 w-4" />
              </span>
              <h2 className="text-xl font-bold text-brand-text-primary tracking-tight">
                Engineering Case Study: Telemetry De-noising Architecture
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-brand-text-secondary">
              Exhaustive analysis of the technical interventions, rule hierarchies, and operational results achieved on the BLUSOC production infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Deep Dive Text & Tables */}
            <div className="lg:col-span-2 space-y-6">
              {/* Crisis Card */}
              <div className="rounded-xl border border-brand-border bg-brand-surface p-6 sm:p-7 shadow-card space-y-4">
                <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>1. The Operational Crisis: Tier-1 Analyst Exhaustion</span>
                </div>
                <p className="text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
                  Prior to detection engineering intervention, the centralized analysis cluster ingested 14,280 raw alert events every 24 hours. With four Tier-1 analysts on active duty, each engineer was forced to review over 3,500 events per shift. Over 98% of incoming alerts were non-actionable operational artifacts: benign agent status polls, precision time protocol frames, and synthetic uptime heartbeats.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-center">
                    <span className="text-[11px] font-mono text-brand-text-muted block">Shift Load</span>
                    <span className="font-mono text-sm font-bold text-brand-text-primary">3,570 alerts / analyst</span>
                  </div>
                  <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-center">
                    <span className="text-[11px] font-mono text-rose-700 block">Baseline MTTR</span>
                    <span className="font-mono text-sm font-bold text-rose-900">42 minutes</span>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-center">
                    <span className="text-[11px] font-mono text-amber-700 block">False Positive Floor</span>
                    <span className="font-mono text-sm font-bold text-amber-900">98.7% noise</span>
                  </div>
                </div>
              </div>

              {/* Baseline Telemetry Breakdown Table */}
              <div className="rounded-xl border border-brand-border bg-brand-surface p-6 sm:p-7 shadow-card space-y-4">
                <div className="flex items-center gap-2 text-brand-text-primary font-semibold text-sm">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span>2. Root Cause Telemetry Distribution (14,280 Daily Events)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-brand-border bg-slate-50/80 text-brand-text-secondary">
                        <th className="py-2.5 px-3 font-semibold">Telemetry Source</th>
                        <th className="py-2.5 px-3 font-semibold">Sensor Component</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Daily Volume</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Noise Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/60">
                      <tr>
                        <td className="py-2 px-3 font-medium text-brand-text-primary">CrowdStrike Null Hostnames</td>
                        <td className="py-2 px-3 text-brand-text-muted">Falcon Endpoint Agent</td>
                        <td className="py-2 px-3 text-right font-bold text-indigo-700">6,840</td>
                        <td className="py-2 px-3 text-right text-brand-text-secondary">47.9%</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-brand-text-primary">Suricata Link-Layer Warnings</td>
                        <td className="py-2 px-3 text-brand-text-muted">Perimeter 10G DPI Sniffer</td>
                        <td className="py-2 px-3 text-right font-bold text-violet-700">3,210</td>
                        <td className="py-2 px-3 text-right text-brand-text-secondary">22.5%</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-brand-text-primary">O365 Corporate Egress Logins</td>
                        <td className="py-2 px-3 text-brand-text-muted">Dual Proxy Pool (198.51.100.x)</td>
                        <td className="py-2 px-3 text-right font-bold text-sky-700">2,980</td>
                        <td className="py-2 px-3 text-right text-brand-text-secondary">20.9%</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-medium text-brand-text-primary">Cloudflare Synthetic Checks</td>
                        <td className="py-2 px-3 text-brand-text-muted">Edge Reverse Proxy WAF</td>
                        <td className="py-2 px-3 text-right font-bold text-amber-700">1,066</td>
                        <td className="py-2 px-3 text-right text-brand-text-secondary">7.5%</td>
                      </tr>
                      <tr className="bg-emerald-50/60 font-semibold text-emerald-950">
                        <td className="py-2.5 px-3 text-emerald-900">Confirmed Attack IOCs (Preserved)</td>
                        <td className="py-2.5 px-3 text-emerald-800">CINS, DROP, RCE, Malware</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">184</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700">1.3%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3-Tier Architecture Card */}
              <div className="rounded-xl border border-brand-border bg-brand-surface p-6 sm:p-7 shadow-card space-y-4">
                <div className="flex items-center gap-2 text-brand-text-primary font-semibold text-sm">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <span>3. The BLUSOC 3-Tier Rule Hierarchy</span>
                </div>
                <div className="space-y-3 text-xs sm:text-sm text-brand-text-secondary leading-relaxed">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 block">
                      Tier 1: Telemetry Noise Suppression (Level 0)
                    </span>
                    <p className="text-xs text-brand-text-secondary">
                      Rules 100010, 86611, 86612, 86613, and 100550 match benign operational packets and discard them in memory. In Wazuh, Level 0 rules bypass disk indexing and SOAR dispatch, eliminating 14,096 alerts with zero compute overhead.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                    <span className="font-mono text-xs font-bold text-sky-700 block">
                      Tier 2: Proxy-Aware Egress Tuning (Rule Overwrite 91578)
                    </span>
                    <p className="text-xs text-brand-text-secondary">
                      Corporate workstations authenticate to SaaS apps via authorized proxy IPs (198.51.100.14, 198.51.100.242). Default SIEM rules interpret this as brute-force concurrency. Overwriting rule 91578 silences authorized proxies, while companion rule 91580 immediately escalates foreign untrusted ASNs to Level 10.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2">
                    <span className="font-mono text-xs font-bold text-emerald-700 block">
                      Tier 3: High-Fidelity Threat Intelligence (Levels 8 to 12)
                    </span>
                    <p className="text-xs text-brand-text-secondary">
                      Rules 100011 (malware binaries), 86601 (ET DROP / CINS Army), and 100400 (GPL Apache RCE) tag MITRE ATT&CK techniques and automatically dispatch high-priority incident tickets to the DFIR-IRIS SOAR platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Comparative Metrics & Validation Summary */}
            <div className="space-y-6">
              {/* Quantified ROI Card */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-card space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-700" />
                  <h3 className="font-bold text-sm text-emerald-950">
                    Quantified Operational ROI
                  </h3>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-emerald-200/60">
                    <span className="text-emerald-900">Daily Noise Dropped:</span>
                    <span className="font-bold text-emerald-800">14,096 alerts (87.1%+)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-emerald-200/60">
                    <span className="text-emerald-900">Actionable Incidents:</span>
                    <span className="font-bold text-emerald-800">184 / day</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-emerald-200/60">
                    <span className="text-emerald-900">MTTR Reduction:</span>
                    <span className="font-bold text-emerald-800">42m down to 8m (-81%)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-emerald-200/60">
                    <span className="text-emerald-900">Daily Hours Saved:</span>
                    <span className="font-bold text-emerald-800">32.5 hours / day</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-emerald-200/60">
                    <span className="text-emerald-900">FTE Capacity Gain:</span>
                    <span className="font-bold text-emerald-800">+4.1 FTE Analysts</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-emerald-900">Attack Dwell Time:</span>
                    <span className="font-bold text-emerald-800">38m down to 80s</span>
                  </div>
                </div>
              </div>

              {/* Automated QA Verification Card */}
              <div className="rounded-xl border border-brand-border bg-brand-surface p-6 shadow-card space-y-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-brand-text-primary" />
                  <h3 className="font-bold text-sm text-brand-text-primary">
                    Automated Test Harness QA
                  </h3>
                </div>
                <p className="text-xs text-brand-text-secondary leading-relaxed">
                  Every detection rule undergoes automated parsing via Python test harnesses before deployment to the production Wazuh engine.
                </p>
                <div className="rounded-lg border border-slate-300 bg-slate-900 p-3 font-mono text-[11px] text-slate-200 space-y-1">
                  <div className="text-emerald-400">$ python validate_rules.py</div>
                  <div className="text-slate-400">[CHECK 1] Em dash scan: PASS (0 found)</div>
                  <div className="text-slate-400">[CHECK 2] XML Syntax: PASS (15 rules)</div>
                  <div className="text-slate-400">[CHECK 3] Sample Event Tests: 20/20 PASS</div>
                  <div className="text-emerald-400 font-bold">STATUS: 100% SUCCESS</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Regression testing integrated into git hooks</span>
                </span>
              </div>

              {/* Navigation CTAs */}
              <div className="rounded-xl border border-brand-border bg-brand-surface p-6 shadow-card space-y-3">
                <h3 className="font-bold text-sm text-brand-text-primary">
                  Explore Live SOC Modules
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/pipeline"
                    className="flex items-center justify-between rounded-lg border border-brand-border p-3 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <GitFork className="h-4 w-4 text-blue-600" />
                      <div>
                        <span className="block text-xs font-bold text-brand-text-primary">
                          Pipeline Orchestrator
                        </span>
                        <span className="block text-[11px] text-brand-text-muted">
                          Inspect DAG nodes and packet simulation
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-brand-text-muted group-hover:text-blue-600 transition-colors" />
                  </Link>

                  <Link
                    href="/workbench"
                    className="flex items-center justify-between rounded-lg border border-brand-border p-3 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <div>
                        <span className="block text-xs font-bold text-brand-text-primary">
                          Analyst Workbench
                        </span>
                        <span className="block text-[11px] text-brand-text-muted">
                          Triage 67 confirmed attack alerts
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-brand-text-muted group-hover:text-emerald-600 transition-colors" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
