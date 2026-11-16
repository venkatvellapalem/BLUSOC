"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { GitFork, Activity, Sliders, Menu, X, Terminal, Layers, FileSearch } from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/", icon: Activity },
  { name: "Pipeline", href: "/pipeline", icon: GitFork },
  { name: "Tech Stack", href: "/tech-stack", icon: Layers },
  { name: "Sample", href: "/workbench", icon: FileSearch },
  { name: "Fatigue Lab", href: "/fatigue-lab", icon: Sliders },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border/80 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-subtle ring-1 ring-black/[0.02] transition-all group-hover:shadow-card group-hover:border-slate-300">
            <Image src="/brand-mark.svg" alt="BLUSOC" width={28} height={28} className="h-7 w-7" priority />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-mono text-[15px] font-bold tracking-tight text-brand-text-primary">
              BLUSOC
            </span>
            <span className="mt-1 text-[10px] font-medium tracking-wide text-brand-text-muted uppercase">
              Detection Operations
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-brand-muted text-brand-text-primary shadow-sm ring-1 ring-brand-border/60"
                    : "text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-muted/70"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-blue-600" : "text-brand-text-muted"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-mono font-semibold text-emerald-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </span>
            PIPELINE LIVE
          </span>
          <a
            href="https://github.com/venkatvellapalem/BLUSOC"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-1.5 text-[13px] font-medium text-brand-text-primary hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <Terminal className="h-3.5 w-3.5 text-brand-text-muted" />
            GitHub
          </a>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex md:hidden items-center justify-center rounded-lg p-2 text-brand-text-secondary hover:bg-brand-muted"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-border bg-white/95 backdrop-blur px-4 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? "bg-brand-muted text-brand-text-primary" : "text-brand-text-secondary"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-brand-text-muted"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
