'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Terminal,
  Cpu,
  Layers,
  Code2,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Server,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { PIPELINE_STAGES, PipelineStageData } from './pipelineData';

interface NodeDetailDrawerProps {
  selectedStageId: string | null;
  onClose: () => void;
}

export default function NodeDetailDrawer({
  selectedStageId,
  onClose,
}: NodeDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'health'>('config');
  const [copied, setCopied] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Find stage data
  const stage = PIPELINE_STAGES.find((s) => s.id === selectedStageId);

  const handleCopy = () => {
    if (!stage) return;
    navigator.clipboard.writeText(stage.configSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {selectedStageId && stage && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-brand-border bg-white shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="border-b border-brand-border bg-brand-canvas px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                      Stage {stage.stageNumber} of 5
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Operational
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-brand-text-primary">
                    {stage.title}
                  </h2>
                  <p className="text-xs text-brand-text-secondary">
                    {stage.role}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-lg border border-brand-border bg-white p-2 text-brand-text-muted hover:bg-brand-muted hover:text-brand-text-primary transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Operational Metrics Bar */}
              <div className="mt-5 grid grid-cols-4 gap-2.5">
                <div className="rounded-lg border border-brand-border bg-white p-2.5 shadow-subtle">
                  <p className="text-[10px] font-semibold text-brand-text-muted uppercase tracking-wider">
                    Throughput
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-brand-text-primary">
                    {stage.metrics.throughput}
                  </p>
                </div>
                <div className="rounded-lg border border-brand-border bg-white p-2.5 shadow-subtle">
                  <p className="text-[10px] font-semibold text-brand-text-muted uppercase tracking-wider">
                    Latency
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-brand-text-primary">
                    {stage.metrics.latency}
                  </p>
                </div>
                <div className="rounded-lg border border-brand-border bg-white p-2.5 shadow-subtle">
                  <p className="text-[10px] font-semibold text-brand-text-muted uppercase tracking-wider">
                    Drop Rate
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-amber-600">
                    {stage.metrics.dropRate}
                  </p>
                </div>
                <div className="rounded-lg border border-brand-border bg-white p-2.5 shadow-subtle">
                  <p className="text-[10px] font-semibold text-brand-text-muted uppercase tracking-wider">
                    Buffer Load
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-bold text-brand-text-primary">
                    {stage.metrics.buffer}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="mt-5 flex gap-2 border-b border-brand-border -mb-5">
                <button
                  onClick={() => setActiveTab('config')}
                  className={`flex items-center gap-2 border-b-2 px-3 pb-3 text-xs font-semibold transition-colors ${
                    activeTab === 'config'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
                  }`}
                >
                  <Code2 className="h-4 w-4" />
                  <span>Configuration & Rules</span>
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`flex items-center gap-2 border-b-2 px-3 pb-3 text-xs font-semibold transition-colors ${
                    activeTab === 'logs'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
                  }`}
                >
                  <Terminal className="h-4 w-4" />
                  <span>Telemetry Logs</span>
                </button>
                <button
                  onClick={() => setActiveTab('health')}
                  className={`flex items-center gap-2 border-b-2 px-3 pb-3 text-xs font-semibold transition-colors ${
                    activeTab === 'health'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  <span>Health & Specs</span>
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: CONFIGURATION */}
              {activeTab === 'config' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-brand-text-muted" />
                      <span className="font-mono text-xs font-medium text-brand-text-secondary">
                        {stage.configTitle}
                      </span>
                      <span className="rounded bg-brand-muted px-1.5 py-0.5 font-mono text-[10px] text-brand-text-muted uppercase">
                        {stage.configLanguage}
                      </span>
                    </div>

                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-2.5 py-1 text-xs font-medium text-brand-text-secondary hover:bg-brand-muted hover:text-brand-text-primary transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Snippet</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code Editor Preview */}
                  <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 text-slate-100 shadow-card">
                    <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80 inline-block" />
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80 inline-block" />
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500/80 inline-block" />
                      </div>
                      <span className="ml-2">{stage.configTitle}</span>
                    </div>
                    <pre className="font-mono text-xs leading-relaxed overflow-x-auto text-slate-300">
                      <code>{stage.configSnippet}</code>
                    </pre>
                  </div>

                  {/* Architectural Highlight Note */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span>Engineering Context</span>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>

                  {/* Sub-components list */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                      Active Sub-modules & Components
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {stage.components.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-surface p-2.5 text-xs text-brand-text-secondary"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TELEMETRY LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-brand-text-secondary">
                      Simulated real-time operational events from this stage daemon
                    </p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      Live Stream
                    </span>
                  </div>

                  <div className="space-y-2">
                    {stage.logs.map((log, index) => {
                      const levelStyles = {
                        INFO: 'bg-blue-50 text-blue-700 border-blue-200',
                        WARN: 'bg-amber-50 text-amber-700 border-amber-200',
                        DROP: 'bg-slate-100 text-slate-700 border-slate-300',
                        ALERT: 'bg-orange-50 text-orange-700 border-orange-200',
                        CRITICAL: 'bg-red-50 text-red-700 border-red-200',
                      }[log.level];

                      return (
                        <div
                          key={index}
                          className="rounded-lg border border-brand-border bg-white p-3 space-y-1 shadow-subtle font-mono text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-brand-text-muted">{log.timestamp}</span>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${levelStyles}`}>
                              {log.level}
                            </span>
                          </div>
                          <p className="text-brand-text-primary break-all">
                            {log.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: HEALTH & SPECS */}
              {activeTab === 'health' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-3">
                    <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                      Component Specifications
                    </h3>
                    <div className="space-y-2.5">
                      {stage.specs.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between border-b border-brand-border/60 pb-2 text-xs"
                        >
                          <span className="text-brand-text-secondary">{s.label}</span>
                          <span className="font-mono font-medium text-brand-text-primary">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-brand-border bg-brand-canvas p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-text-primary">
                      <Server className="h-4 w-4 text-brand-text-muted" />
                      <span>Host Integration Stack</span>
                    </div>
                    <p className="font-mono text-xs text-brand-text-secondary">
                      {stage.technology}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-brand-border bg-brand-canvas px-6 py-4 flex items-center justify-between text-xs text-brand-text-secondary">
              <span className="font-mono text-[11px] text-brand-text-muted">
                BLUSOC SOC Platform 2026.11
              </span>
              <button
                onClick={onClose}
                className="rounded-lg border border-brand-border bg-white px-4 py-1.5 text-xs font-semibold text-brand-text-primary hover:bg-brand-muted transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
