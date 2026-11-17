'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GitFork, ArrowLeft, Shield, Sliders, Database, Workflow, Sparkles } from 'lucide-react';
import PipelineCanvas from '@/components/pipeline/PipelineCanvas';
import NodeDetailDrawer from '@/components/pipeline/NodeDetailDrawer';
import TelemetryPacketSimulator from '@/components/pipeline/TelemetryPacketSimulator';
import { SIMULATION_PRESETS, SimulationStepLog } from '@/components/pipeline/pipelineData';

export default function PipelinePage() {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('intel-tp-iris');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<SimulationStepLog[]>([]);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const handleStartSimulationRef = useRef<() => void>(() => {});

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const activePreset = SIMULATION_PRESETS.find((p) => p.id === selectedPresetId) || SIMULATION_PRESETS[0];

  const didAutoRunRef = useRef(false);
  useEffect(() => {
    if (didAutoRunRef.current) return;
    didAutoRunRef.current = true;
    const t = setTimeout(() => {
      handleStartSimulationRef.current?.();
    }, 700);
    return () => clearTimeout(t);
  }, []);

  const pushStep = (step: number, presetId: string) => {
    const preset = SIMULATION_PRESETS.find((p) => p.id === presetId)!;
    const logs = preset.terminalLogs.filter((l) => l.step === step);
    setSimulationStep(step);
    if (logs.length) setTerminalLogs((prev) => [...prev, ...logs]);
  };

  const handleStartSimulation = () => {
    if (isSimulating) return;
    clearTimers();
    setIsSimulating(true);
    setSimulationStep(0);
    setTerminalLogs([]);
    const id = activePreset.id;
    const isSuppressed = activePreset.outcome === 'suppressed';

    timersRef.current.push(setTimeout(() => pushStep(1, id), 150));
    timersRef.current.push(setTimeout(() => pushStep(2, id), 700));
    if (isSuppressed) {
      timersRef.current.push(setTimeout(() => setIsSimulating(false), 1150));
    } else {
      timersRef.current.push(setTimeout(() => pushStep(3, id), 1300));
      timersRef.current.push(setTimeout(() => pushStep(4, id), 1900));
      timersRef.current.push(setTimeout(() => { pushStep(5, id); setIsSimulating(false); }, 2500));
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

  handleStartSimulationRef.current = handleStartSimulation;

  return (
    <div className="min-h-screen bg-brand-canvas py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16,1,0.3,1] }} className="space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-secondary hover:text-brand-text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Overview</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Pipeline Online
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-brand-border pb-8">
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center gap-4">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.5)]">
                  <GitFork className="h-6 w-6" />
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-brand-text-primary">Detection &amp; Response Flow</h1>
                  <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-brand-text-secondary">
                    Qualifying alerts flow <span className="font-semibold text-brand-text-primary">Wazuh → n8n (enrichment) → Laya (triage)</span>. Only true positive, high-confidence alerts become DFIR-IRIS tickets. Alerts go to Discord/Slack and containment isolates affected systems via FortiGate.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/wazuh.svg" alt="Wazuh" width={16} height={16} className="h-4 w-4" /> Wazuh
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm">
                  <Image src="/logos/n8n.svg" alt="n8n" width={14} height={14} className="h-3.5 w-3.5" /> n8n SOAR
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/laya.svg" alt="Laya" width={16} height={16} className="h-4 w-4" /> Laya
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/dfir-iris.svg" alt="DFIR-IRIS" width={16} height={16} className="h-4 w-4" /> DFIR-IRIS
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/discord.svg" alt="Discord" width={14} height={14} className="h-3.5 w-3.5" />
                  <Image src="/logos/slack.svg" alt="Slack" width={14} height={14} className="h-3.5 w-3.5" /> Discord/Slack
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Image src="/logos/fortinet.svg" alt="FortiGate" width={16} height={16} className="h-4 w-4" /> FortiGate
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link href="/workbench" className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-text-primary hover:border-slate-300 hover:shadow-sm transition-all">
                <Shield className="h-4 w-4 text-emerald-600" /><span>Sample</span>
              </Link>
              <Link href="/tech-stack" className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-semibold text-brand-text-primary hover:border-slate-300 hover:shadow-sm transition-all">
                <Database className="h-4 w-4 text-blue-600" /><span>Tech Stack</span>
              </Link>
              <Link href="/fatigue-lab" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-[0_8px_20px_-10px_rgba(37,99,235,0.5)]">
                <Sliders className="h-4 w-4" /><span>Fatigue Lab</span>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}>
          <TelemetryPacketSimulator
            selectedPresetId={selectedPresetId}
            onSelectPreset={handleSelectPreset}
            isSimulating={isSimulating}
            simulationStep={simulationStep}
            onStartSimulation={handleStartSimulation}
            onResetSimulation={handleResetSimulation}
            terminalLogs={terminalLogs}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <PipelineCanvas
            selectedStageId={selectedStageId}
            onSelectStage={(id) => setSelectedStageId(id)}
            activePreset={activePreset}
            simulationStep={simulationStep}
            isSimulating={isSimulating}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="rounded-2xl border border-brand-border bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200"><Sparkles className="h-4 w-4" /></span>
            <div>
              <h2 className="text-lg font-bold text-brand-text-primary">How alerts are handled</h2>
              <p className="mt-1 text-sm text-brand-text-secondary">Wazuh never sends alerts directly to IRIS or analysts. Qualifying alerts go to n8n for enrichment, then Laya for triage and routing.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2"><Image src="/logos/wazuh.svg" alt="Wazuh" width={18} height={18} /><span className="text-sm font-semibold">Wazuh</span></div>
              <p className="text-xs text-brand-text-secondary leading-relaxed">Correlates and suppresses noise. Forwards only qualifying alerts to n8n.</p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2"><Workflow className="h-4 w-4 text-violet-700" /><span className="text-sm font-semibold">n8n SOAR</span></div>
              <p className="text-xs text-brand-text-secondary leading-relaxed">Enriches and normalizes qualifying alerts (TI/context) and routes them to Laya.</p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2"><Image src="/logos/laya.svg" alt="Laya" width={18} height={18} /><span className="text-sm font-semibold">Laya</span></div>
              <p className="text-xs text-brand-text-secondary leading-relaxed">Assigns verdict/confidence and routes IRIS tickets, notifications, and containment.</p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2"><Image src="/logos/dfir-iris.svg" alt="DFIR-IRIS" width={18} height={18} /><span className="text-sm font-semibold">DFIR-IRIS</span></div>
              <p className="text-xs text-brand-text-secondary leading-relaxed">Receives tickets only for <strong>true positive, high-confidence</strong> alerts for analyst investigation.</p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/logos/discord.svg" alt="Discord" width={16} height={16} />
                <Image src="/logos/slack.svg" alt="Slack" width={16} height={16} />
                <Image src="/logos/fortinet.svg" alt="FortiGate" width={16} height={16} />
                <span className="text-sm font-semibold">Notify &amp; Contain</span>
              </div>
              <p className="text-xs text-brand-text-secondary leading-relaxed">Alerts to Discord/Slack. Containment isolates affected systems via FortiGate.</p>
            </div>
          </div>
        </motion.div>
      </div>

      <NodeDetailDrawer
        selectedStageId={selectedStageId}
        onClose={() => setSelectedStageId(null)}
      />
    </div>
  );
}
