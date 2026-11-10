'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  RotateCcw,
  Zap,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Flame,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';
import { SIMULATION_PRESETS, SimulationPreset, SimulationStepLog } from './pipelineData';

interface TelemetryPacketSimulatorProps {
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  isSimulating: boolean;
  simulationStep: number;
  onStartSimulation: () => void;
  onResetSimulation: () => void;
  terminalLogs: SimulationStepLog[];
}

export default function TelemetryPacketSimulator({
  selectedPresetId,
  onSelectPreset,
  isSimulating,
  simulationStep,
  onStartSimulation,
  onResetSimulation,
  terminalLogs,
}: TelemetryPacketSimulatorProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal on new log lines
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const activePreset =
    SIMULATION_PRESETS.find((p) => p.id === selectedPresetId) || SIMULATION_PRESETS[0];

  const isCompleted =
    activePreset.outcome === 'suppressed'
      ? simulationStep >= 3
      : simulationStep >= 5;

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-card overflow-hidden">
      {/* Top Banner */}
      <div className="border-b border-brand-border bg-brand-canvas px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-text-primary tracking-tight">
                Live Telemetry Packet Simulator
              </h2>
              <p className="text-xs text-brand-text-secondary">
                Inject production attack and noise payloads to observe real-time suppression and SOAR dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetSimulation}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-text-secondary hover:bg-brand-muted hover:text-brand-text-primary disabled:opacity-50 transition-colors shadow-subtle"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onStartSimulation}
              disabled={isSimulating}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow-subtle transition-all ${
                isSimulating
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isSimulating ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                  <span>Traversing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isCompleted ? 'Inject Again' : 'Inject Packet'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preset Selector Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SIMULATION_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            const isSuppressed = preset.outcome === 'suppressed';

            return (
              <button
                key={preset.id}
                onClick={() => {
                  if (!isSimulating) {
                    onSelectPreset(preset.id);
                  }
                }}
                disabled={isSimulating}
                className={`relative flex flex-col text-left rounded-xl p-3 transition-all border ${
                  isSelected
                    ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-md'
                    : 'border-brand-border bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-subtle'
                } ${isSimulating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                      isSuppressed
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : preset.severity === 'CRITICAL'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isSuppressed ? 'Noise Suppressed' : `${preset.severity} Alert`}
                  </span>
                  <span className="font-mono text-[10px] text-brand-text-muted">
                    Rule {preset.ruleId} (L{preset.ruleLevel})
                  </span>
                </div>

                <h3 className="text-xs font-bold text-brand-text-primary line-clamp-1">
                  {preset.name}
                </h3>
                <p className="mt-1 text-[11px] text-brand-text-secondary line-clamp-2">
                  {preset.description}
                </p>

                <div className="mt-2.5 pt-2 border-t border-brand-border/60 flex items-center justify-between text-[10px] text-brand-text-muted font-mono">
                  <span>Src: {preset.clientIp}</span>
                  <span className={isSelected ? 'text-blue-600 font-bold' : ''}>
                    {isSelected ? 'Active' : 'Select'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progression Bar and Terminal */}
      <div className="p-6 space-y-5">
        {/* Stage Progress Stepper */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
              Packet Traversal Pipeline
            </span>
            <span className="font-mono text-xs text-brand-text-secondary">
              {simulationStep === 0
                ? 'Idle: Ready to inject'
                : isCompleted
                ? 'Execution Complete'
                : `Active at Stage ${simulationStep} of 5`}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[
              { num: 1, name: '1. Sensors' },
              { num: 2, name: '2. Wazuh SIEM' },
              {
                num: 3,
                name:
                  activePreset.outcome === 'suppressed'
                    ? 'Suppression Sink'
                    : '3. Python Enricher',
              },
              {
                num: 4,
                name:
                  activePreset.outcome === 'suppressed'
                    ? 'Bypassed'
                    : '4. DFIR-IRIS SOAR',
              },
              {
                num: 5,
                name:
                  activePreset.outcome === 'suppressed'
                    ? 'Bypassed'
                    : '5. Workbench',
              },
            ].map((stepItem) => {
              const isActive = simulationStep === stepItem.num;
              const isPast = simulationStep > stepItem.num;
              const isSuppressedBypass =
                activePreset.outcome === 'suppressed' && stepItem.num >= 4;

              return (
                <div
                  key={stepItem.num}
                  className={`rounded-lg border p-2 text-center transition-all ${
                    isActive
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/30'
                      : isPast
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : isSuppressedBypass
                      ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                      : 'border-brand-border bg-white text-brand-text-secondary'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isPast && !isSuppressedBypass ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : null}
                    <span className="text-[11px] truncate">{stepItem.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Event Terminal */}
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 text-slate-200 shadow-card">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-400">
              <Terminal className="h-4 w-4 text-blue-400" />
              <span>simulated-telemetry-engine://live-event-stream</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] text-emerald-400">ONLINE</span>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs max-h-56 overflow-y-auto pr-1">
            {terminalLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <p>Click &quot;Inject Packet&quot; to trace this telemetry payload across the pipeline stages.</p>
                <p className="mt-1 text-[11px] text-slate-600">
                  Observe real-time suppression of noise or automatic SOAR ticket creation.
                </p>
              </div>
            ) : (
              terminalLogs.map((log, index) => {
                const tagColors: Record<string, string> = {
                  INGEST: 'text-blue-400 bg-blue-950/60 border-blue-800',
                  DECODER: 'text-purple-400 bg-purple-950/60 border-purple-800',
                  'RULE-MATCH': 'text-amber-400 bg-amber-950/60 border-amber-800',
                  SUPPRESSED: 'text-orange-400 bg-orange-950/60 border-orange-800',
                  ENRICH: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
                  'SOAR-DISPATCH': 'text-cyan-400 bg-cyan-950/60 border-cyan-800',
                  'TRIAGE-QUEUE': 'text-indigo-400 bg-indigo-950/60 border-indigo-800',
                };

                const tagClass =
                  tagColors[log.tag] || 'text-slate-400 bg-slate-900 border-slate-800';

                return (
                  <div key={index} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="text-slate-500 shrink-0 text-[11px]">
                      [Step {log.step}]
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[10px] font-bold border shrink-0 ${tagClass}`}
                    >
                      {log.tag}
                    </span>
                    <span className="text-slate-300 break-words">{log.text}</span>
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Result Banner when simulation finishes */}
          {isCompleted && (
            <div
              className={`mt-4 rounded-lg p-3 text-xs border flex items-center justify-between gap-3 ${
                activePreset.outcome === 'suppressed'
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                  : activePreset.severity === 'CRITICAL'
                  ? 'bg-red-950/40 border-red-800/80 text-red-200'
                  : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {activePreset.outcome === 'suppressed' ? (
                  <Filter className="h-4 w-4 text-amber-400 shrink-0" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold">
                    {activePreset.outcome === 'suppressed'
                      ? `SUPPRESSED AT WAZUH ENGINE: ZERO TICKET NOISE (Rule ${activePreset.ruleId} Level 0)`
                      : `ACTIONABLE THREAT DISPATCHED TO DFIR-IRIS SOAR (Rule ${activePreset.ruleId} Level ${activePreset.ruleLevel})`}
                  </span>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {activePreset.outcome === 'suppressed'
                      ? 'Benign traffic dropped before loading database or triggering SOC analyst alerts.'
                      : 'High-fidelity attack alert normalized, enriched with GeoIP, and queued for analyst triage.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
