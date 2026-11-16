'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  GitFork,
  ArrowLeft,
  ArrowRight,
  Shield,
  Activity,
  Sliders,
  Filter,
  CheckCircle2,
  Clock,
  Database,
  Layers,
  Zap,
  Cpu,
  Info,
} from 'lucide-react';
import PipelineCanvas from '@/components/pipeline/PipelineCanvas';
import NodeDetailDrawer from '@/components/pipeline/NodeDetailDrawer';
import TelemetryPacketSimulator from '@/components/pipeline/TelemetryPacketSimulator';
import { SecOpsDial } from '@/components/dials/SecOpsDial';
import {
  SIMULATION_PRESETS,
  PIPELINE_STAGES,
  SimulationPreset,
  SimulationStepLog,
} from '@/components/pipeline/pipelineData';

export default function PipelinePage() {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('et-drop-cins');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<SimulationStepLog[]>([]);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const activePreset =
    SIMULATION_PRESETS.find((p) => p.id === selectedPresetId) || SIMULATION_PRESETS[0];

  const handleStartSimulation = () => {
    if (isSimulating) return;
    clearTimers();
    setIsSimulating(true);
    setSimulationStep(1);
    setTerminalLogs([]);

    const preset = activePreset;
    const isSuppressed = preset.outcome === 'suppressed';

    // Step 1: Perimeter Ingest
    const t1 = setTimeout(() => {
      setSimulationStep(1);
      const step1Logs = preset.terminalLogs.filter((l) => l.step === 1);
      setTerminalLogs((prev) => [...prev, ...step1Logs]);
    }, 150);
    timersRef.current.push(t1);

    // Step 2: Wazuh Evaluation
    const t2 = setTimeout(() => {
      setSimulationStep(2);
      const step2Logs = preset.terminalLogs.filter((l) => l.step === 2);
      setTerminalLogs((prev) => [...prev, ...step2Logs]);
    }, 750);
    timersRef.current.push(t2);

    if (isSuppressed) {
      // Step 3: Divert to Suppression Sink
      const t3 = setTimeout(() => {
        setSimulationStep(3);
        setIsSimulating(false);
      }, 1450);
      timersRef.current.push(t3);
    } else {
      // Step 3: Python Enricher (GeoIP + 4000-char buffer)
      const t3 = setTimeout(() => {
        setSimulationStep(3);
        const step3Logs = preset.terminalLogs.filter((l) => l.step === 3);
        setTerminalLogs((prev) => [...prev, ...step3Logs]);
      }, 1450);
      timersRef.current.push(t3);

      // Step 4: DFIR-IRIS SOAR (API + Case + SLA)
      const t4 = setTimeout(() => {
        setSimulationStep(4);
        const step4Logs = preset.terminalLogs.filter((l) => l.step === 4);
        setTerminalLogs((prev) => [...prev, ...step4Logs]);
      }, 2150);
      timersRef.current.push(t4);

      // Step 5: Analyst Workbench (Queue Dispatch)
      const t5 = setTimeout(() => {
        setSimulationStep(5);
        const step5Logs = preset.terminalLogs.filter((l) => l.step === 5);
        setTerminalLogs((prev) => [...prev, ...step5Logs]);
        setIsSimulating(false);
      }, 2850);
      timersRef.current.push(t5);
    }
  };

  const handleResetSimulation = () => {
    clearTimers();
    setIsSimulating(false);
    setSimulationStep(0);
    setTerminalLogs([]);
  };

  const handleSelectPreset = (presetId: string) => {
    clearTimers();
    setSelectedPresetId(presetId);
    setIsSimulating(false);
    setSimulationStep(0);
    setTerminalLogs([]);
  };

  return (
    <div className="min-h-screen bg-brand-canvas py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Overview</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Pipeline Online
              </span>
              <span className="font-mono text-[11px] text-brand-text-muted">v2026.1</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-brand-border pb-8">
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.5)]">
                  <GitFork className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-brand-text-primary">
                    Visual Pipeline Orchestrator
                  </h1>
                  <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-brand-text-secondary">
                    Five-stage telemetry DAG from sensor tap to SOAR case, with tuned suppression and interactive packet flow.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/suricata.png" alt="Suricata" width={16} height={16} className="h-4 w-4 object-contain" />
                  Suricata
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/crowdstrike.svg" alt="CrowdStrike" width={60} height={11} className="h-3 w-auto object-contain" />
                  CrowdStrike
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/wazuh.svg" alt="Wazuh" width={16} height={16} className="h-4 w-4 object-contain" />
                  Wazuh
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Database className="h-3.5 w-3.5 text-emerald-600" />
                  DFIR-IRIS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/workbench"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-text-primary hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <Shield className="h-4 w-4 text-emerald-600" />
                <span>Triage Sample</span>
              </Link>
              <Link
                href="/fatigue-lab"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-[0_8px_20px_-10px_rgba(37,99,235,0.5)]"
              >
                <Sliders className="h-4 w-4" />
                <span>Fatigue Lab</span>
              </Link>
            </div>
          </div>
        </div>

        {/* SEC-OPS DIAL INSTRUMENTATION DECK */}
        <div className="rounded-2xl border border-brand-border bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-5 mb-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] font-bold text-blue-600 uppercase tracking-[0.16em]">
                Live Pipeline Telemetry
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                Calibrated
              </span>
            </div>
            <span className="text-[11px] font-mono text-brand-text-muted">
              FIFO Queue: 142 / 65536 pkts
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            <SecOpsDial
              value={14280}
              min={0}
              max={15000}
              label="Ingress Volume"
              unit="EPS"
              sublabel="14,280 daily ingress"
              size={175}
            />
            <SecOpsDial
              value={14096}
              min={0}
              max={15000}
              label="Suppressed Noise"
              unit="EPS"
              sublabel="14,096 dropped L0"
              size={175}
            />
            <SecOpsDial
              value={184}
              min={0}
              max={500}
              label="Actionable SOAR"
              unit="ALERTS"
              sublabel="184 clean incidents"
              size={175}
            />
            <SecOpsDial
              value={2.8}
              min={0}
              max={10}
              label="Pipeline Latency"
              unit="MS"
              sublabel="< 2.8ms wire to IRIS"
              formatValue={(v) => `${v.toFixed(1)}ms`}
              size={175}
            />
          </div>
        </div>

        {/* TELEMETRY PACKET SIMULATOR BAR */}
        <TelemetryPacketSimulator
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectPreset}
          isSimulating={isSimulating}
          simulationStep={simulationStep}
          onStartSimulation={handleStartSimulation}
          onResetSimulation={handleResetSimulation}
          terminalLogs={terminalLogs}
        />

        {/* INTERACTIVE PIPELINE SVG CANVAS */}
        <PipelineCanvas
          selectedStageId={selectedStageId}
          onSelectStage={(id) => setSelectedStageId(id)}
          activePreset={activePreset}
          simulationStep={simulationStep}
          isSimulating={isSimulating}
        />

        {/* ARCHITECTURE SPECIFICATION DEEP DIVE */}
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 sm:p-8 shadow-card space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                Engineering Specification
              </span>
              <h2 className="text-lg font-bold text-brand-text-primary">
                Five-Stage Pipeline Architecture Breakdown
              </h2>
            </div>
            <p className="text-xs text-brand-text-secondary">
              Technical review of the architectural decisions governing ingestion, suppression, and dispatch
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {/* Stage 1 card */}
            <div className="rounded-xl border border-brand-border bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">Stage 01</span>
                <span className="text-[11px] text-brand-text-muted">14,280 eps</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Image src="/logos/suricata.png" alt="Suricata" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                <Image src="/logos/crowdstrike.svg" alt="CrowdStrike" width={64} height={12} className="h-3 w-auto object-contain" />
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">
                Distributed Ingestion & Sensor Grid
              </h3>
              <p className="text-xs leading-relaxed text-brand-text-secondary">
                Multi-vendor telemetry from Suricata 7.0 DPI taps, CrowdStrike Falcon EDR, Barracuda gateways, and Cloudflare WAF.
              </p>
            </div>

            {/* Stage 2 card */}
            <div className="rounded-xl border border-brand-border bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-600">Stage 02</span>
                <span className="text-[11px] text-amber-700 font-semibold">98.7% Suppressed</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Image src="/logos/wazuh.svg" alt="Wazuh" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
                <span className="text-xs font-semibold text-brand-text-secondary">Wazuh 4.8</span>
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">
                Decoders & Level 0 Noise Suppression
              </h3>
              <p className="text-xs leading-relaxed text-brand-text-secondary">
                1,420 detection rules. Suppression (100010, 91578, 86611) drops 14,096 benign events per day at the analysis engine.
              </p>
            </div>

            {/* Stage 3 card */}
            <div className="rounded-xl border border-brand-border bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-600">Stage 03</span>
                <span className="text-[11px] text-brand-text-muted">4,000-char buffer</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 font-mono text-[10px] font-bold">PY</span>
                <span className="text-xs font-semibold text-brand-text-secondary">custom-iris.py</span>
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">
                Buffer Protection & GeoIP Enrichment
              </h3>
              <p className="text-xs leading-relaxed text-brand-text-secondary">
                Expands truncation from 400 to 4,000 chars and decorates external IPs with MaxMind ASN/GeoIP in 1.1ms.
              </p>
            </div>

            {/* Stage 4 card */}
            <div className="rounded-xl border border-brand-border bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-600">Stage 04</span>
                <span className="text-[11px] text-brand-text-muted">15m - 4h SLAs</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-purple-50 border border-purple-100">
                  <Database className="h-3.5 w-3.5 text-purple-700" />
                </span>
                <span className="text-xs font-semibold text-brand-text-secondary">DFIR-IRIS 2.4</span>
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">
                SOAR & Dynamic SLA Engine
              </h3>
              <p className="text-xs leading-relaxed text-brand-text-secondary">
                REST ingestion creates cases with deduplicated IOCs and severity-driven SLA timers from 15 minutes to 4 hours.
              </p>
            </div>

            {/* Stage 5 card */}
            <div className="rounded-xl border border-brand-border bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">Stage 05</span>
                <span className="text-[11px] text-brand-text-muted">8 min MTTR</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 border border-blue-100">
                  <Shield className="h-3.5 w-3.5 text-blue-700" />
                </span>
                <span className="text-xs font-semibold text-brand-text-secondary">Triage & Closing Gate</span>
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">
                Analyst Queue & Verdict Gate
              </h3>
              <p className="text-xs leading-relaxed text-brand-text-secondary">
                Tiered routing with enforced verdicts, containment actions, and investigative notes before any ticket closes.
              </p>
            </div>

            {/* Zero Fatigue Impact Card */}
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-800">Operational ROI</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-white/80 border border-emerald-200 rounded-full px-2 py-0.5">32 hrs/day saved</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                </span>
                <span className="text-xs font-semibold text-emerald-800">Measured impact</span>
              </div>
              <h3 className="text-sm font-bold text-emerald-950">
                Measurable Fatigue Reduction
              </h3>
              <p className="text-xs leading-relaxed text-emerald-900/90">
                Tuning out 14,096 noise events per day cut MTTR from 42 to 8 minutes with full triage coverage of real threats.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NODE DETAIL SLIDE-OVER DRAWER */}
      <NodeDetailDrawer
        selectedStageId={selectedStageId}
        onClose={() => setSelectedStageId(null)}
      />
    </div>
  );
}
