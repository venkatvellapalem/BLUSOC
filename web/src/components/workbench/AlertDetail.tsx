"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Globe,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Server,
  Layers,
  Sparkles,
  Info,
  Clock,
  X,
} from "lucide-react";
import type { EnrichedAlert } from "@/lib/types";
import { VerdictModal } from "./VerdictModal";

interface AlertDetailProps {
  alert: EnrichedAlert | null;
  onVerdictSubmitted: (alertId: string, verdict: string, notes: string, rootCause: string) => void;
}

export function AlertDetail({ alert, onVerdictSubmitted }: AlertDetailProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [validationResults, setValidationResults] = useState<Record<number, boolean | null>>({});
  const [isRawLogExpanded, setIsRawLogExpanded] = useState<boolean>(true);

  // Verdict Modal state
  const [isVerdictModalOpen, setIsVerdictModalOpen] = useState<boolean>(false);
  const [initialVerdictOption, setInitialVerdictOption] = useState<string>("True Positive");

  // IRIS Deep-Link Simulation Modal
  const [showIrisModal, setShowIrisModal] = useState<boolean>(false);

  if (!alert) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 bg-white border border-slate-200 rounded-xl shadow-card text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-subtle">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Select an Alert to Investigate
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mb-4">
          Choose any of the 67 confirmed attack alerts from the queue to inspect raw Wazuh telemetry, forensic indicators, and submit a verdict.
        </p>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <span>Use search or category filters to narrow the queue</span>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string, key: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const toggleQuestion = (num: number) => {
    setExpandedQuestions((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  const handleValidateAnswer = (num: number, expectedAnswer: string, variants?: string[]) => {
    const input = (userAnswers[num] || "").trim().toLowerCase();
    if (!input) return;

    const mainAnswer = expectedAnswer.trim().toLowerCase();
    const cleanVariants = (variants || []).map((v) => v.trim().toLowerCase());

    const isCorrect = input === mainAnswer || cleanVariants.includes(input);
    setValidationResults((prev) => ({ ...prev, [num]: isCorrect }));
  };

  // Format raw log
  let formattedRawLog = alert.raw_log;
  try {
    const parsed = JSON.parse(alert.raw_log);
    formattedRawLog = JSON.stringify(parsed, null, 2);
  } catch {
    // Keep as string if not valid JSON
  }

  const formatUtcTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toISOString().replace("T", " ").substring(0, 19) + " UTC";
    } catch {
      return ts;
    }
  };

  const renderSeverityBadge = (sev: string) => {
    const s = sev.toUpperCase();
    if (s === "CRITICAL") {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          CRITICAL
        </span>
      );
    }
    if (s === "HIGH") {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
          HIGH
        </span>
      );
    }
    if (s === "MEDIUM") {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          MEDIUM
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        {s}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              ALERT #{alert.id}
            </span>
            {renderSeverityBadge(alert.severity)}
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200/70 text-slate-700">
              {alert.category.replace("_", " ").toUpperCase()}
            </span>
            {alert.provider && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {alert.provider}
              </span>
            )}
          </div>

          {/* Current Status Pill */}
          <div className="flex items-center gap-2">
            {alert.status === "CLOSED" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Ticket Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Active Investigation
              </span>
            )}
          </div>
        </div>

        <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
          {alert.title}
        </h2>

        {/* Closed Verdict Callout if resolved */}
        {alert.status === "CLOSED" && alert.userVerdict && (
          <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-emerald-900">
                Triage Verdict: {alert.userVerdict.verdict}
              </span>
              {alert.userVerdict.root_cause && (
                <span className="ml-2 text-emerald-700">
                  (Attribution: {alert.userVerdict.root_cause})
                </span>
              )}
              {alert.userVerdict.notes && (
                <p className="mt-1 text-slate-700 italic">
                  &ldquo;{alert.userVerdict.notes}&rdquo;
                </p>
              )}
              <div className="mt-1 text-[10px] text-slate-500 font-mono">
                Closed at: {formatUtcTimestamp(alert.userVerdict.timestamp)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white min-h-0">
        {/* Telemetry Grid */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Network Telemetry & Attributes
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Sensor: {alert.sensor || "corp-gateway-01.blusoc.internal"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {/* Source IP */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Source IP (Attacker)
              </span>
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-xs font-bold text-slate-900 select-all truncate">
                  {alert.src_ip}
                </span>
                <button
                  onClick={() => handleCopy(alert.src_ip, "src_ip")}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Copy Source IP"
                >
                  {copiedKey === "src_ip" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Destination IP */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Destination IP (Sensor)
              </span>
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-xs font-bold text-slate-900 select-all truncate">
                  {alert.dest_ip}
                </span>
                <button
                  onClick={() => handleCopy(alert.dest_ip, "dest_ip")}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Copy Destination IP"
                >
                  {copiedKey === "dest_ip" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Ports & Protocol */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Ports & Protocol
              </span>
              <div className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-800">
                <span>{alert.src_port ?? "ANY"}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-blue-600 font-bold">{alert.dest_port ?? "ANY"}</span>
                <span className="ml-1 text-[10px] px-1 py-0.2 bg-slate-200 text-slate-700 rounded font-normal">
                  {alert.protocol || "TCP"}
                </span>
              </div>
            </div>

            {/* GeoIP Country */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                GeoIP Attribution
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-900">
                <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate" title={alert.country}>
                  {alert.country || "External WAN"}
                </span>
              </div>
            </div>

            {/* Ingestion Timestamp */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg sm:col-span-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Ingestion Timestamp
              </span>
              <div className="font-mono text-xs text-slate-800">
                {formatUtcTimestamp(alert.timestamp)}
              </div>
            </div>

            {/* Sensor Hostname */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg sm:col-span-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Ingestion Sensor Node
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800">
                <Server className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">
                  {alert.sensor || "corp-gateway-01.blusoc.internal"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* MITRE ATT&CK Techniques */}
        {alert.mitre_attack && alert.mitre_attack.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              MITRE ATT&CK Matrix Mapping
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {alert.mitre_attack.map((tid) => {
                const url = `https://attack.mitre.org/techniques/${tid.replace(".", "/")}`;
                return (
                  <a
                    key={tid}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <span>{tid}</span>
                    <ExternalLink className="w-3 h-3 text-amber-600" />
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Forensic Triage Questions Card */}
        {alert.triage_questions && alert.triage_questions.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileQuestion className="w-3.5 h-3.5 text-blue-600" />
                Forensic Investigation Questions
              </h3>
              <span className="text-[11px] text-slate-500">
                {alert.triage_questions.length} triage checks available
              </span>
            </div>

            <div className="space-y-3">
              {alert.triage_questions.map((q) => {
                const isExpanded = Boolean(expandedQuestions[q.num]);
                const validationResult = validationResults[q.num];

                return (
                  <div
                    key={q.num}
                    className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Question {q.num} of 3
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            q.level === "Easy"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : q.level === "Moderate"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {q.level}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        FORMAT: [{q.format}]
                      </span>
                    </div>

                    {/* Question prompt */}
                    <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                      {q.text}
                    </p>

                    {/* Interactive Answer Input & Validation */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={userAnswers[q.num] || ""}
                        onChange={(e) =>
                          setUserAnswers((prev) => ({ ...prev, [q.num]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleValidateAnswer(q.num, q.answer, q.variants);
                          }
                        }}
                        placeholder={`Enter your answer (e.g. format: ${q.format})...`}
                        className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-white text-slate-900 border border-slate-200 rounded-md placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleValidateAnswer(q.num, q.answer, q.variants)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        Check Answer
                      </button>
                    </div>

                    {/* Validation Feedback */}
                    {validationResult === true && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Correct! Ground-truth verified against SIEM evidence.</span>
                      </div>
                    )}
                    {validationResult === false && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Not a match. Check the raw JSON log below or inspect telemetry details.
                        </span>
                      </div>
                    )}

                    {/* Expandable Hint & Solution */}
                    <div className="border-t border-slate-200/60 pt-2">
                      <button
                        type="button"
                        onClick={() => toggleQuestion(q.num)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>
                          {isExpanded ? "Hide Verified Solution" : "Show Hint & Verified Answer"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 bg-white border border-blue-100 rounded-md text-xs space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700">Verified Answer:</span>
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              {q.answer}
                            </span>
                          </div>
                          {q.variants && q.variants.length > 0 && (
                            <div className="text-[11px] text-slate-500">
                              Accepted variants: {q.variants.join(", ")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Raw JSON Log Viewer */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsRawLogExpanded(!isRawLogExpanded)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider hover:text-slate-900"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-600" />
              <span>Raw Ingested Event Payload</span>
              {isRawLogExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">
                {formattedRawLog.length} bytes
              </span>
              <button
                onClick={() => handleCopy(formattedRawLog, "raw_log")}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                title="Copy raw log JSON"
              >
                {copiedKey === "raw_log" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isRawLogExpanded && (
            <div className="relative rounded-lg border border-slate-200 bg-slate-900 text-slate-100 overflow-hidden font-mono text-xs">
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-mono text-[10px] text-slate-400">
                    event_payload.json
                  </span>
                </span>
                <span>UTF-8</span>
              </div>
              <pre className="p-4 overflow-x-auto max-h-72 text-slate-200 leading-relaxed font-mono text-[11px]">
                {formattedRawLog}
              </pre>
            </div>
          )}
        </section>
      </div>

      {/* Action Bar Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Simulate IRIS Deep-Link */}
          <button
            type="button"
            onClick={() => setShowIrisModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors shadow-subtle"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Simulate IRIS Deep-Link</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Mark Benign (Quick False Positive) */}
          <button
            type="button"
            onClick={() => {
              setInitialVerdictOption("False Positive");
              setIsVerdictModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors shadow-subtle"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Mark Benign</span>
          </button>

          {/* Submit Final Verdict (Primary) */}
          <button
            type="button"
            onClick={() => {
              setInitialVerdictOption("True Positive");
              setIsVerdictModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Submit Final Verdict</span>
          </button>
        </div>
      </div>

      {/* Verdict Modal Dialog */}
      <VerdictModal
        isOpen={isVerdictModalOpen}
        alert={alert}
        initialVerdict={initialVerdictOption}
        onClose={() => setIsVerdictModalOpen(false)}
        onSubmitSuccess={onVerdictSubmitted}
      />

      {/* Simulated IRIS Deep Link Modal */}
      {showIrisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-xl shadow-dropdown border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-200">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">
                  DFIR-IRIS Case Management Deep-Link
                </h4>
              </div>
              <button
                onClick={() => setShowIrisModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-blue-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Production IRIS Case Route Simulation</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  In a live deployment, this button routes the analyst directly into the customer DFIR-IRIS instance with contextual alert pre-filters.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Synthetic Target URL
                </span>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-800 break-all select-all">
                  https://iris.blusoc.internal/alerts/case?alert_id={alert.id}&amp;source=wazuh_siem&amp;auth=token_verified
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="font-semibold block text-slate-800">Case Identifier</span>
                  <span className="font-mono">IRIS-CASE-{alert.id}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="font-semibold block text-slate-800">Sensor Host</span>
                  <span className="font-mono truncate block">
                    {alert.sensor || "corp-gateway-01"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  handleCopy(
                    `https://iris.blusoc.internal/alerts/case?alert_id=${alert.id}&source=wazuh_siem&auth=token_verified`,
                    "iris_url"
                  );
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
              >
                {copiedKey === "iris_url" ? "URL Copied" : "Copy Deep-Link URL"}
              </button>
              <button
                onClick={() => setShowIrisModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
