'use client';

import React, { useEffect, useRef } from 'react';
import { Play, RotateCcw, Zap, Terminal, ShieldAlert, Filter, Check, Bell, Shield } from 'lucide-react';
import { SIMULATION_PRESETS, SimulationPreset, SimulationStepLog } from './pipelineData';

interface Props {
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
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [terminalLogs]);

  const preset = SIMULATION_PRESETS.find((p) => p.id === selectedPresetId) || SIMULATION_PRESETS[0];
  const completed = simulationStep >= 5 || (preset.outcome === 'suppressed' && simulationStep >= 2);

  const steps = [
    { num: 1, name: '1. Sensors' },
    { num: 2, name: preset.outcome === 'suppressed' ? '2. Wazuh (suppress)' : '2. Wazuh' },
    { num: 3, name: preset.outcome === 'suppressed' ? 'Bypassed' : '3. Enrichment' },
    { num: 4, name: preset.outcome === 'suppressed' ? 'Bypassed' : '4. Laya' },
    { num: 5, name: preset.outcome === 'suppressed' ? 'Bypassed' : preset.outcome === 'contain' ? '5. IRIS + Contain' : preset.outcome === 'notify' ? '5. Notify' : '5. IRIS Ticket' },
  ];

  const tagColors: Record<string, string> = {
    INGEST: 'text-blue-400 bg-blue-950/60 border-blue-800',
    'RULE-MATCH': 'text-amber-400 bg-amber-950/60 border-amber-800',
    SUPPRESSED: 'text-orange-400 bg-orange-950/60 border-orange-800',
    ENRICH: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
    TRIAGE: 'text-violet-400 bg-violet-950/60 border-violet-800',
    IRIS: 'text-sky-400 bg-sky-950/60 border-sky-800',
    NOTIFY: 'text-indigo-400 bg-indigo-950/60 border-indigo-800',
    CONTAIN: 'text-rose-400 bg-rose-950/60 border-rose-800',
  };

  const outcomeMeta = (p: SimulationPreset) => {
    if (p.outcome === 'suppressed') return { label: 'Noise Suppressed', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (p.outcome === 'contain') return { label: 'Containment', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (p.outcome === 'notify') return { label: 'Notified', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    return { label: 'IRIS Ticket', cls: 'bg-sky-50 text-sky-700 border-sky-200' };
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
      <div className="border-b border-brand-border bg-brand-canvas px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200"><Zap className="h-4 w-4" /></div>
            <div>
              <h2 className="text-sm font-bold text-brand-text-primary tracking-tight">Alert Flow Simulator</h2>
              <p className="text-xs text-brand-text-secondary">Trace qualifying alerts: Wazuh → Laya → IRIS (TP/high confidence), Discord/Slack, or FortiGate containment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onResetSimulation} disabled={isSimulating} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-text-secondary hover:bg-brand-muted disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" />Reset</button>
            <button onClick={onStartSimulation} disabled={isSimulating} className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold text-white transition-all ${isSimulating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}>
              {isSimulating ? <><span className="h-2 w-2 rounded-full bg-white animate-ping" />Running...</> : <><Play className="h-3.5 w-3.5 fill-current" />{completed ? 'Run Again' : 'Inject Alert'}</>}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SIMULATION_PRESETS.map((p) => {
            const sel = p.id === selectedPresetId;
            const meta = outcomeMeta(p);
            return (
              <button key={p.id} onClick={() => { if (!isSimulating) onSelectPreset(p.id); }} disabled={isSimulating}
                className={`relative flex flex-col text-left rounded-xl p-3 transition-all border ${sel ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-md' : 'border-brand-border bg-white hover:border-slate-300'} ${isSimulating ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${meta.cls}`}>{meta.label}</span>
                  <span className="font-mono text-[10px] text-brand-text-muted">L{p.ruleLevel}</span>
                </div>
                <h3 className="text-xs font-bold text-brand-text-primary line-clamp-1">{p.name}</h3>
                <p className="mt-1 text-[11px] text-brand-text-secondary line-clamp-2">{p.description}</p>
                <div className="mt-2.5 pt-2 border-t border-brand-border/60 flex items-center justify-between text-[10px] text-brand-text-muted font-mono">
                  <span>{p.source}</span>
                  <span className={sel ? 'text-blue-600 font-bold' : ''}>{sel ? 'Active' : 'Select'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">Pipeline Progress</span>
            <span className="font-mono text-xs text-brand-text-secondary">{simulationStep === 0 ? 'Idle' : completed ? 'Complete' : `Step ${simulationStep} / 5`}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {steps.map((st) => {
              const active = simulationStep === st.num || (completed && st.num === 5 && preset.outcome !== 'suppressed') || (completed && st.num === 2 && preset.outcome === 'suppressed');
              const past = simulationStep > st.num;
              const bypass = preset.outcome === 'suppressed' && st.num >= 3;
              return (
                <div key={st.num} className={`rounded-lg border p-2 text-center transition-all ${active && !bypass ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/30' : past && !bypass ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : bypass ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-60' : 'border-brand-border bg-white text-brand-text-secondary'}`}>
                  <div className="flex items-center justify-center gap-1">{past && !bypass ? <Check className="h-3 w-3 text-emerald-600" /> : null}<span className="text-[11px] truncate">{st.name}</span></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 text-slate-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-mono text-slate-400"><Terminal className="h-4 w-4 text-blue-400" /><span>alert-flow://trace</span></div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /><span className="font-mono text-[11px] text-emerald-400">LIVE</span></div>
          </div>
          <div className="space-y-2 font-mono text-xs max-h-56 overflow-y-auto pr-1">
            {terminalLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <p>Inject an alert to trace it through the pipeline.</p>
                <p className="mt-1 text-[11px] text-slate-600">Suppressed at Wazuh, or qualified → Laya → IRIS/Discord/Slack/FortiGate.</p>
              </div>
            ) : terminalLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-slate-500 shrink-0 text-[11px]">[Step {log.step}]</span>
                <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold border shrink-0 ${tagColors[log.tag] || 'text-slate-400 bg-slate-900 border-slate-800'}`}>{log.tag}</span>
                <span className="text-slate-300 break-words">{log.text}</span>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {completed && (
            <div className={`mt-4 rounded-lg p-3 text-xs border flex items-center gap-3 ${preset.outcome === 'suppressed' ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' : preset.outcome === 'contain' ? 'bg-rose-950/40 border-rose-800/80 text-rose-200' : preset.outcome === 'notify' ? 'bg-indigo-950/40 border-indigo-800/80 text-indigo-200' : 'bg-sky-950/40 border-sky-800/80 text-sky-200'}`}>
              {preset.outcome === 'suppressed' ? <Filter className="h-4 w-4 shrink-0" /> : preset.outcome === 'contain' ? <Shield className="h-4 w-4 shrink-0" /> : preset.outcome === 'notify' ? <Bell className="h-4 w-4 shrink-0" /> : <ShieldAlert className="h-4 w-4 shrink-0" />}
              <div>
                <span className="font-bold">
                  {preset.outcome === 'suppressed' && 'SUPPRESSED AT WAZUH — no qualifying alert sent to Laya'}
                  {preset.outcome === 'iris' && 'TRUE POSITIVE (HIGH CONFIDENCE) — IRIS ticket created for analyst investigation'}
                  {preset.outcome === 'notify' && 'ALERT DELIVERED — Discord and Slack notified by Laya'}
                  {preset.outcome === 'contain' && 'CONTAINMENT TRIGGERED — IRIS ticket + Discord/Slack + FortiGate isolation'}
                </span>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {preset.outcome === 'suppressed' && 'Benign noise dropped at the correlation engine.'}
                  {preset.outcome === 'iris' && 'Only true positive, high-confidence alerts become IRIS tickets.'}
                  {preset.outcome === 'notify' && 'SOC channels notified; no IRIS ticket created for this confidence level.'}
                  {preset.outcome === 'contain' && 'Affected system isolated via FortiGate; analysts investigate in IRIS.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
