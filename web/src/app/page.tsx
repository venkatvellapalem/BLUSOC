"use client";

import React, { useState } from "react";
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
  Clock,
  Cpu,
} from "lucide-react";
import { SecOpsInstrumentCluster } from "@/components/dials/SecOpsInstrumentCluster";
import { LiveOscilloscopeStream } from "@/components/dials/LiveOscilloscopeStream";
import { NetworkTopologyRadar } from "@/components/home/NetworkTopologyRadar";

export default function HomePage() {
  const [isTuned, setIsTuned] = useState(true);

  return (
    <div className="space-y-12 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Master SecOps Hardware Console Header */}
      <section className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-sm">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-lg font-bold text-slate-900 tracking-tight">
                  BLUSOC SEC-OPS MASTER CONSOLE
                </h1>
                <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 border border-blue-200">
                  RACK-01 • CHASSIS A
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Production Blue-Team Telemetry, Ingestion Dials, and 67 Confirmed Attack Investigations
              </p>
            </div>
          </div>

          {/* Master Operational Clock & Hardware Specs */}
          <div className="flex items-center gap-4 text-xs font-mono text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/70">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Manager OS</span>
              <span className="font-bold text-slate-800">Ubuntu 24.04 LTS</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">SIEM Kernel</span>
              <span className="font-bold text-slate-800">Wazuh 4.8.x</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">SOAR Engine</span>
              <span className="font-bold text-slate-800">DFIR-IRIS 2.4</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-slate-800">LIVE INGESTION ACTIVE</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">67 Attack Vectors Correlated</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-700 font-semibold">87.1% Alert Fatigue Eliminated</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <GitFork className="h-3.5 w-3.5 text-blue-400" />
              <span>Pipeline DAG</span>
              <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
            <Link
              href="/workbench"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              <span>Analyst Workbench</span>
            </Link>
            <Link
              href="/fatigue-lab"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
            >
              <Sliders className="h-3.5 w-3.5 text-emerald-600" />
              <span>Fatigue Lab</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SecOps Instrument Cluster: 4 Physical Circular Dials */}
      <section aria-label="Calibrated Telemetry Dials">
        <SecOpsInstrumentCluster onTuningChange={setIsTuned} />
      </section>

      {/* Live Oscilloscope Trace & Kernel Telemetry Stream */}
      <section aria-label="Live Telemetry Stream">
        <LiveOscilloscopeStream isSuppressionActive={isTuned} />
      </section>

      {/* Interactive Network Topology Mesh */}
      <section aria-label="Enterprise Topology">
        <NetworkTopologyRadar />
      </section>

      {/* Deep-Dive Technical Rationale Card */}
      <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-8 shadow-[0_4px_24px_rgb(0,0,0,0.03)] backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>ENGINEERED BY PRACTITIONERS FOR PRODUCTION</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Why We Built BLUSOC This Way
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Standard commercial SIEM installations bombard analysts with 14,000+ alerts daily, the vast majority being benign corporate proxy egress traffic, CrowdStrike agent keepalives, and Suricata framing noise. BLUSOC solves this through deterministic Wazuh XML suppression rules, expanding the Python integratord buffer to 4,000 characters to prevent packet payload truncation, and synchronizing verified alerts into DFIR-IRIS case tickets.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Noise Cut</span>
                <span className="text-xl font-extrabold font-mono text-emerald-600">87.1%</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">MTTR Speed</span>
                <span className="text-xl font-extrabold font-mono text-blue-600">42m &rarr; 8m</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Hours Recovered</span>
                <span className="text-xl font-extrabold font-mono text-indigo-600">32.5 hrs/day</span>
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
              href="/workbench"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white py-2 text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <span>Investigate Alerts in Workbench</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
