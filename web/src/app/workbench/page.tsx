"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Database,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { EnrichedAlert, WorkbenchMetrics } from "@/lib/types";
import { AlertList } from "@/components/workbench/AlertList";
import { AlertDetail } from "@/components/workbench/AlertDetail";
import { SecOpsDial } from "@/components/dials/SecOpsDial";

export default function WorkbenchPage() {
  const [alerts, setAlerts] = useState<EnrichedAlert[]>([]);
  const [metrics, setMetrics] = useState<WorkbenchMetrics>({
    total: 67,
    triaged: 0,
    pending: 67,
    critical: 7,
  });
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Fetch alerts from API
  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/workbench", { cache: "no-store" });
      const data = await res.json();

      if (data.success && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        // Auto-select first alert if none selected
        if (!selectedAlertId && data.alerts.length > 0) {
          setSelectedAlertId(data.alerts[0].id);
        }
      }
    } catch (err) {
      console.error("[BLUSOC] Error fetching alerts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAlertId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Handle Verdict Submission
  const handleVerdictSubmitted = (
    alertId: string,
    verdict: string,
    notes: string,
    rootCause: string
  ) => {
    const now = new Date().toISOString();

    setAlerts((prevAlerts) =>
      prevAlerts.map((a) => {
        if (a.id === alertId) {
          return {
            ...a,
            status: "CLOSED",
            userVerdict: {
              verdict,
              notes,
              root_cause: rootCause,
              timestamp: now,
            },
          };
        }
        return a;
      })
    );

    setMetrics((prev) => {
      const isAlreadyClosed = alerts.find((a) => a.id === alertId)?.status === "CLOSED";
      if (isAlreadyClosed) return prev;
      const newTriaged = prev.triaged + 1;
      return {
        ...prev,
        triaged: newTriaged,
        pending: Math.max(0, prev.total - newTriaged),
      };
    });

    setNotification({
      message: `Alert #${alertId} successfully closed with verdict: ${verdict}`,
      type: "success",
    });

    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Factory Reset
  const handleResetWorkspace = async () => {
    const confirmed = window.confirm(
      "Reset all guest investigations and verdicts back to factory default? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setIsResetting(true);
      const res = await fetch("/api/workbench", { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setAlerts((prevAlerts) =>
          prevAlerts.map((a) => ({
            ...a,
            status: "NEW",
            userVerdict: undefined,
          }))
        );

        setMetrics((prev) => ({
          ...prev,
          triaged: 0,
          pending: prev.total,
        }));

        setNotification({
          message: "Workbench workspace reset to initial 67-alert factory state.",
          type: "info",
        });

        setTimeout(() => {
          setNotification(null);
        }, 4000);
      }
    } catch (err) {
      console.error("[BLUSOC] Error resetting workspace:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || null;
  const progressPercent = metrics.total > 0 ? Math.round((metrics.triaged / metrics.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Top Navigation Bar */}
      <div className="border-b border-slate-200 bg-white shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Overview</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <Shield className="h-4 w-4" />
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900">
                Analyst Triage Workbench
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Session Storage Active</span>
            </div>

            <button
              onClick={handleResetWorkspace}
              disabled={isResetting || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-red-700 hover:border-red-200 rounded-lg transition-colors shadow-subtle disabled:opacity-50"
              title="Reset all triage verdicts to factory state"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
              <span>Reset to Factory State</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Floating Notification */}
        {notification && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between shadow-dropdown transition-all animate-in fade-in slide-in-from-top-2 ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TRIAGE INSTRUMENTATION DECK */}
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 uppercase tracking-wider">
                TIER-2 TRIAGE GAUGES &amp; QUEUE DISPOSITION
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                67 ATTACK RECORDS
              </span>
            </div>
            <div className="text-xs font-mono text-slate-500">
              QUEUE STATUS: <span className="font-bold text-slate-800">{metrics.triaged} CLOSED</span> / {metrics.total} TOTAL
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
            <SecOpsDial
              value={metrics.triaged}
              min={0}
              max={metrics.total || 67}
              label="Triaged Disposition"
              unit="CLOSED"
              sublabel={`${progressPercent}% Queue Completed`}
              size={165}
            />
            <SecOpsDial
              value={metrics.pending}
              min={0}
              max={metrics.total || 67}
              label="Pending Investigation"
              unit="TICKETS"
              sublabel="Active Analyst Queue"
              size={165}
            />
            <SecOpsDial
              value={metrics.critical}
              min={0}
              max={25}
              label="Critical Priority"
              unit="ALERTS"
              sublabel="L10 to L12 Attack Vectors"
              size={165}
            />
            <SecOpsDial
              value={8}
              min={0}
              max={60}
              label="Triage Target SLA"
              unit="MINUTES"
              sublabel="Sub-15m Target Met"
              formatValue={(v) => `${v}m`}
              size={165}
            />
          </div>
        </div>

        {/* Main Split Workbench Interface */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 bg-white border border-slate-200 rounded-xl shadow-card">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-700">
              Loading 67 attack telemetry events...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-280px)] min-h-[680px]">
            {/* Left Column: Alert List Feed (5 cols on lg) */}
            <div className="lg:col-span-5 h-full">
              <AlertList
                alerts={alerts}
                selectedId={selectedAlertId}
                onSelectAlert={(a) => setSelectedAlertId(a.id)}
              />
            </div>

            {/* Right Column: Alert Investigation Workspace (7 cols on lg) */}
            <div className="lg:col-span-7 h-full">
              <AlertDetail
                alert={selectedAlert}
                onVerdictSubmitted={handleVerdictSubmitted}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
