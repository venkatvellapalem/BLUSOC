"use client";

import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, HelpCircle, Shield, Loader2 } from "lucide-react";
import type { EnrichedAlert } from "@/lib/types";

interface VerdictModalProps {
  isOpen: boolean;
  alert: EnrichedAlert | null;
  initialVerdict?: string;
  onClose: () => void;
  onSubmitSuccess: (alertId: string, verdict: string, notes: string, rootCause: string) => void;
}

const VERDICT_OPTIONS = [
  {
    value: "True Positive",
    label: "True Positive (Confirmed Threat)",
    desc: "Malicious activity confirmed. Requires remediation, containment, or firewall blocking.",
    icon: CheckCircle2,
    color: "border-red-200 bg-red-50/50 text-red-900",
    badge: "text-red-700 bg-red-100",
  },
  {
    value: "False Positive",
    label: "False Positive (Benign Activity)",
    desc: "Legitimate enterprise traffic, known scanner, or authorized egress behavior.",
    icon: AlertTriangle,
    color: "border-emerald-200 bg-emerald-50/50 text-emerald-900",
    badge: "text-emerald-700 bg-emerald-100",
  },
  {
    value: "Inconclusive",
    label: "Inconclusive (Escalate to Tier 2)",
    desc: "Insufficient telemetry for immediate disposition. Escalating for packet capture analysis.",
    icon: HelpCircle,
    color: "border-amber-200 bg-amber-50/50 text-amber-900",
    badge: "text-amber-700 bg-amber-100",
  },
];

const ROOT_CAUSE_OPTIONS = [
  "External Threat Actor",
  "Vulnerability Scanner",
  "Egress Proxy",
  "Misconfiguration",
];

export function VerdictModal({
  isOpen,
  alert,
  initialVerdict,
  onClose,
  onSubmitSuccess,
}: VerdictModalProps) {
  const [selectedVerdict, setSelectedVerdict] = useState<string>("True Positive");
  const [rootCause, setRootCause] = useState<string>("External Threat Actor");
  const [analystNotes, setAnalystNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedVerdict(initialVerdict || (alert?.expected_verdict ? alert.expected_verdict : "True Positive"));
      setRootCause("External Threat Actor");
      setAnalystNotes(
        alert?.userVerdict?.notes ||
          (alert?.verdict ? `Telemetry analysis: ${alert.verdict}` : "")
      );
      setErrorMessage(null);
    }
  }, [isOpen, initialVerdict, alert]);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId: alert.id,
          verdict: selectedVerdict,
          analystNotes,
          rootCause,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit verdict");
      }

      onSubmitSuccess(alert.id, selectedVerdict, analystNotes, rootCause);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving verdict";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-dropdown border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Submit Final Verdict
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Incident #{alert.id} ({alert.short_title || alert.title})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Classification Radios */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Classification
            </label>
            <div className="space-y-2">
              {VERDICT_OPTIONS.map((opt) => {
                const isChecked = selectedVerdict === opt.value;
                const IconComponent = opt.icon;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? "border-blue-600 bg-blue-50/30 ring-1 ring-blue-600"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="verdict"
                      value={opt.value}
                      checked={isChecked}
                      onChange={(e) => setSelectedVerdict(e.target.value)}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-slate-600" />
                        <span className="font-semibold text-slate-900">
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Root Cause Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Root Cause Attribution
            </label>
            <select
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {ROOT_CAUSE_OPTIONS.map((cause) => (
                <option key={cause} value={cause}>
                  {cause}
                </option>
              ))}
            </select>
          </div>

          {/* Analyst Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Analyst Investigation Notes
            </label>
            <textarea
              rows={3}
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              placeholder="Document triage findings, evidence from raw log, and containment recommendations..."
              className="w-full px-3 py-2 text-xs bg-white text-slate-900 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Recording Verdict...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm & Close Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
