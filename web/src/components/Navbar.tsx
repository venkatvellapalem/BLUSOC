"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Shield, GitFork, Activity, Sliders, Menu, X, ExternalLink, Sparkles, Terminal } from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/", icon: Activity, tag: "Command" },
  { name: "Pipeline Orchestrator", href: "/pipeline", icon: GitFork, tag: "DAG" },
  { name: "Analyst Workbench", href: "/workbench", icon: Shield, tag: "67 Alerts" },
  { name: "Fatigue Lab", href: "/fatigue-lab", icon: Sliders, tag: "-87% Noise" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      {/* Top Thin Operational Telemetry Ticker (Light-Themed) */}
      <div className="border-b border-slate-100 bg-slate-50/70 py-1 px-4 text-[11px] font-mono text-slate-500">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800 tracking-tight">
              BLUSOC TELEMETRY FABRIC: ONLINE
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-slate-600">
              Daily Reduction: 14,280 &rarr; 184 Clean Incidents (87.1% Noise Suppressed)
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span className="hidden md:inline">
              Pipeline Latency: <span className="font-semibold text-blue-600">1.2ms</span>
            </span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span>
              Confirmed IOCs: <span className="font-semibold text-rose-600">67 Attack Vectors</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white shadow-md shadow-blue-500/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/30">
            <Shield className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold tracking-tight text-slate-900">
                BLUSOC
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 border border-blue-200/60 shadow-xs">
                v2026.1
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Enterprise Detection Engineering
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.name}</span>
                {item.tag && (
                  <span
                    className={`ml-1 text-[9px] font-mono px-1.5 py-0.2 rounded-md ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {item.tag}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Area */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono text-xs font-bold text-emerald-800 tracking-wide">
              PIPELINE TUNED
            </span>
          </div>

          <a
            href="https://github.com/blusoc/blusoc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            <Terminal className="h-3.5 w-3.5 text-slate-500" />
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3 text-slate-400 ml-0.5" />
          </a>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold ${
                  isActive
                    ? "bg-blue-50 text-blue-900 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-slate-500" />
                  <span>{item.name}</span>
                </div>
                {item.tag && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {item.tag}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
