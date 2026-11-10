"use client";

import React, { useState, useMemo } from "react";
import { Search, ShieldAlert, CheckCircle2, Clock, Filter, ArrowRight, X } from "lucide-react";
import type { EnrichedAlert, AlertStatus } from "@/lib/types";

interface AlertListProps {
  alerts: EnrichedAlert[];
  selectedId: string | null;
  onSelectAlert: (alert: EnrichedAlert) => void;
}

type CategoryTab = "ALL" | "malicious_ip" | "reconnaissance" | "malware" | "phishing";

const CATEGORY_TABS: { key: CategoryTab; label: string; count: number }[] = [
  { key: "ALL", label: "All", count: 67 },
  { key: "malicious_ip", label: "Threat Intel", count: 20 },
  { key: "reconnaissance", label: "Reconnaissance", count: 18 },
  { key: "malware", label: "Malware", count: 17 },
  { key: "phishing", label: "Phishing", count: 12 },
];

export function AlertList({ alerts, selectedId, onSelectAlert }: AlertListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryTab>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Dynamic counts based on loaded alerts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: alerts.length,
      malicious_ip: 0,
      reconnaissance: 0,
      malware: 0,
      phishing: 0,
    };
    for (const a of alerts) {
      if (counts[a.category] !== undefined) {
        counts[a.category]++;
      }
    }
    return counts;
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Category filter
      if (selectedCategory !== "ALL" && alert.category !== selectedCategory) {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== "ALL" && alert.severity.toUpperCase() !== selectedSeverity) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "ALL" && alert.status !== selectedStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = alert.id.toLowerCase().includes(q);
        const matchesTitle = alert.title.toLowerCase().includes(q);
        const matchesShortTitle = alert.short_title?.toLowerCase().includes(q);
        const matchesSrcIp = alert.src_ip.toLowerCase().includes(q);
        const matchesDestIp = alert.dest_ip.toLowerCase().includes(q);
        const matchesProvider = alert.provider?.toLowerCase().includes(q);
        const matchesCategory = alert.category.toLowerCase().includes(q);
        const matchesCountry = alert.country?.toLowerCase().includes(q);

        if (
          !matchesId &&
          !matchesTitle &&
          !matchesShortTitle &&
          !matchesSrcIp &&
          !matchesDestIp &&
          !matchesProvider &&
          !matchesCategory &&
          !matchesCountry
        ) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, selectedCategory, selectedSeverity, selectedStatus, searchQuery]);

  const formatShortTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toISOString().replace("T", " ").substring(5, 16) + " UTC";
    } catch {
      return ts;
    }
  };

  const renderSeverityBadge = (severity: string) => {
    const s = severity.toUpperCase();
    if (s === "CRITICAL") {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
          CRITICAL
        </span>
      );
    }
    if (s === "HIGH") {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          HIGH
        </span>
      );
    }
    if (s === "MEDIUM") {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          MEDIUM
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        {s}
      </span>
    );
  };

  const renderStatusPill = (status: AlertStatus) => {
    if (status === "CLOSED") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Closed
        </span>
      );
    }
    if (status === "INVESTIGATING") {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Investigating
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        New
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
      {/* Top Search & Filter Bar */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, IP, provider, or category..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white text-slate-900 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORY_TABS.map((tab) => {
            const count = tabCounts[tab.key] ?? tab.count;
            const isActive = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedCategory(tab.key)}
                className={`whitespace-nowrap px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Filters: Severity & Status */}
        <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="CLOSED">Closed</option>
            </select>
            <span className="text-slate-400 font-mono text-[10px]">
              {filteredAlerts.length} shown
            </span>
          </div>
        </div>
      </div>

      {/* Alert Cards Feed */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0 bg-white">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-600">No alerts match active filters</p>
            <p className="text-[11px] text-slate-400">
              Try adjusting your search query, category tab, or severity filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setSelectedSeverity("ALL");
                setSelectedStatus("ALL");
              }}
              className="mt-2 inline-flex items-center px-2.5 py-1 text-xs text-blue-600 font-medium hover:bg-blue-50 rounded border border-blue-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isSelected = alert.id === selectedId;
            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectAlert(alert);
                  }
                }}
                className={`p-3 text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-blue-50/60 border-l-4 border-l-blue-600 pl-2.5 shadow-sm"
                    : "hover:bg-slate-50 border-l-4 border-l-transparent"
                }`}
              >
                {/* Header row: ID, Severity, Status */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      #{alert.id}
                    </span>
                    {renderSeverityBadge(alert.severity)}
                  </div>
                  <div>{renderStatusPill(alert.status)}</div>
                </div>

                {/* Title */}
                <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 mb-1.5">
                  {alert.short_title || alert.title}
                </h4>

                {/* Network Path */}
                <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono mb-1.5">
                  <span className="truncate max-w-[110px] text-slate-800" title={alert.src_ip}>
                    {alert.src_ip}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[110px] text-slate-800" title={alert.dest_ip}>
                    {alert.dest_ip}
                  </span>
                </div>

                {/* Footer row: Provider & Timestamp */}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-medium truncate max-w-[130px]">
                    {alert.provider || "WAZUH"}
                  </span>
                  <span>{formatShortTime(alert.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
