"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Shield, GitFork, Activity, Sliders, Menu, X, ExternalLink, Cpu } from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/", icon: Activity },
  { name: "Pipeline Orchestrator", href: "/pipeline", icon: GitFork },
  { name: "Analyst Workbench", href: "/workbench", icon: Shield },
  { name: "Fatigue Lab", href: "/fatigue-lab", icon: Sliders },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-text-primary text-white shadow-sm transition-transform group-hover:scale-105">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold tracking-tight text-brand-text-primary">
                BLUSOC
              </span>
              <span className="rounded bg-brand-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-text-secondary border border-brand-border">
                v2026.1
              </span>
            </div>
            <span className="text-[11px] font-medium text-brand-text-muted">
              Enterprise Detection Engineering
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-muted text-brand-text-primary border border-brand-border"
                    : "text-brand-text-secondary hover:bg-slate-100/70 hover:text-brand-text-primary"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-brand-text-muted"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Area */}
        <div className="hidden md:flex items-center gap-4">
          {/* Live Status Indicator */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono text-xs font-semibold text-emerald-800 tracking-wide">
              PIPELINE ONLINE
            </span>
          </div>

          {/* GitHub Repository */}
          <a
            href="https://github.com/blusoc/blusoc"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-primary shadow-subtle hover:bg-slate-50 transition-colors"
          >
            <Cpu className="h-3.5 w-3.5 text-brand-text-secondary" />
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3 text-brand-text-muted ml-0.5" />
          </a>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-brand-text-secondary hover:bg-brand-muted hover:text-brand-text-primary focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu modal/dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-brand-border bg-brand-surface px-4 pt-2 pb-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                  isActive
                    ? "bg-brand-muted text-brand-text-primary font-semibold"
                    : "text-brand-text-secondary hover:bg-slate-100 hover:text-brand-text-primary"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-brand-text-muted"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="font-mono text-xs font-medium text-emerald-800">
                PIPELINE ONLINE
              </span>
            </div>
            <a
              href="https://github.com/blusoc/blusoc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary"
            >
              <span>Repository</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
