'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Overview</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Pipeline Online
              </span>
              <span className="font-mono text-xs text-brand-text-muted">
                v2026.11-PROD
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shadow-subtle">
                  <GitFork className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary">
                    Visual Pipeline Orchestrator
                  </h1>
                  <p className="text-xs text-brand-text-secondary">
                    Five-stage distributed telemetry DAG, XML suppression matrix, and interactive packet flow engine
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/workbench"
                className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-3.5 py-2 text-xs font-semibold text-brand-text-primary hover:bg-brand-muted transition-colors shadow-subtle"
              >
                <Shield className="h-4 w-4 text-blue-600" />
                <span>Analyst Workbench</span>
                <ArrowRight className="h-3.5 w-3.5 text-brand-text-muted" />
              </Link>
              <Link
                href="/fatigue-lab"
                className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-3.5 py-2 text-xs font-semibold text-brand-text-primary hover:bg-brand-muted transition-colors shadow-subtle"
              >
                <Sliders className="h-4 w-4 text-amber-600" />
                <span>Fatigue Lab</span>
                <ArrowRight className="h-3.5 w-3.5 text-brand-text-muted" />
              </Link>
            </div>
          </div>
        </div>

        {/* SEC-OPS DIAL INSTRUMENTATION DECK */}
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 uppercase tracking-wider">
                LIVE PIPELINE TELEMETRY INSTRUMENTS
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                CALIBRATED SENSORS
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              FIFO QUEUE: 142/65536 PKTS
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
            <SecOpsDial
              value={14280}
              min={0}
              max={15000}
              label="Ingress Volume"
              unit="EPS"
              sublabel="14,280 Daily Ingress"
              size={175}
            />
            <SecOpsDial
              value={14096}
              min={0}
              max={15000}
              label="Suppressed Noise"
              unit="EPS"
              sublabel="14,096 Dropped L0"
              size={175}
            />
            <SecOpsDial
              value={184}
              min={0}
              max={500}
              label="Actionable SOAR"
              unit="ALERTS"
              sublabel="184 Clean Incidents"
              size={175}
            />
            <SecOpsDial
              value={2.8}
              min={0}
              max={10}
              label="Pipeline Latency"
              unit="MS"
              sublabel="< 2.8ms Wire to IRIS"
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
            <div className="rounded-xl border border-brand-border bg-brand-canvas p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">Stage 01</span>
                <span className="text-[11px] text-brand-text-muted">14,280 eps</span>
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">
                Distributed Ingestion & Sensor Grid
              </h3>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Ingests multi-vendor telemetry from Suricata 7.0 DPI taps on 10GbE interfaces, CrowdStrike Falcon EDR streams, Barracuda perimeter firewalls, and Cloudflare edge WAF logpush endpoints.
              </p>
            </div>

            {/* Stage 2 card */}
            <div className="rounded-xl border border-brand-border bg-brand-canvas p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-amber-600">Stage 02</span>
                <span className="text-[11px] text-amber-700 font-semibold">98.7% Suppressed</span>
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">
                Wazuh Decoders & Level 0 Noise Suppression
              </h3>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Evaluates events against 1,420 detection rules. Aggressive suppression filters (Rules 100010, 91578, 86611) eliminate 14,096 benign events per day directly in the analysisd engine, protecting indexers.
              </p>
            </div>

            {/* Stage 3 card */}
            <div className="rounded-xl border border-brand-border bg-brand-canvas p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-600">Stage 03</span>
                <span className="text-[11px] text-brand-text-muted">4,000 Chars Cap</span>
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">
                custom-iris.py Buffer Protection & GeoIP
              </h3>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                The Python middleware replaces Wazuh default 400-char truncation with a 4,000-character preservation buffer. Enriches external attacker IPs with local MaxMind City and ASN intelligence in 1.1ms.
              </p>
            </div>

            {/* Stage 4 card */}
            <div className="rounded-xl border border-brand-border bg-brand-canvas p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-600">Stage 04</span>
                <span className="text-[11px] text-brand-text-muted">15m to 4h SLAs</span>
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">
                DFIR-IRIS SOAR & Dynamic SLA Engine
              </h3>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Enriched payloads hit the REST API /alerts/add. High-severity threats automatically generate cases with deduplicated IOC linkages and engage dynamic SLA countdown timers based on severity.
              </p>
            </div>

            {/* Stage 5 card */}
            <div className="rounded-xl border border-brand-border bg-brand-canvas p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">Stage 05</span>
                <span className="text-[11px] text-brand-text-muted">8 min MTTR</span>
              </div>
              <h3 className="text-sm font-bold text-brand-text-primary">
                Analyst Triage & Ticket Closing Gate
              </h3>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Tickets route to Tier 1, 2, and 3 analyst queues. Strict closing gate policies prevent ticket dismissal without a verified True/False positive classification, containment actions, and investigative notes.
              </p>
            </div>

            {/* Zero Fatigue Impact Card */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-800">Operational ROI</span>
                <span className="text-[11px] text-emerald-700 font-bold">32 hrs/day saved</span>
              </div>
              <h3 className="text-sm font-bold text-emerald-950">
                Measurable Fatigue Reduction
              </h3>
              <p className="text-xs text-emerald-900 leading-relaxed">
                By tuning out 14,096 noise events per day, analyst mean time to respond (MTTR) dropped from 42 minutes down to 8 minutes, with 100% triage coverage of real threats.
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
