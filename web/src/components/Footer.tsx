import Link from "next/link";
import { Shield, GitBranch, Terminal, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-brand-border bg-brand-surface py-12 text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-brand-border">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-text-primary text-white">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <span className="font-mono text-base font-bold tracking-tight text-brand-text-primary">
                BLUSOC
              </span>
              <span className="rounded bg-brand-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-brand-text-secondary border border-brand-border">
                BLUE-TEAM LAB
              </span>
            </div>
            <p className="text-xs text-brand-text-secondary max-w-md leading-relaxed">
              Production blue-team engineering showcase demonstrating alert noise suppression,
              deep packet inspection correlation, and automated incident triage across Wazuh,
              Suricata, and DFIR-IRIS platforms.
            </p>
            <div className="flex items-center gap-4 text-xs text-brand-text-muted font-mono">
              <span>Stack: Wazuh 4.8</span>
              <span>•</span>
              <span>DFIR-IRIS 2.4</span>
              <span>•</span>
              <span>Suricata 7</span>
              <span>•</span>
              <span>Neon PostgreSQL</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-text-primary font-mono">
              Interactive Lab
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/pipeline"
                  className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                >
                  Visual Pipeline Orchestrator
                </Link>
              </li>
              <li>
                <Link
                  href="/workbench"
                  className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                >
                  Analyst Triage Workbench (67 Incidents)
                </Link>
              </li>
              <li>
                <Link
                  href="/fatigue-lab"
                  className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                >
                  Alert Fatigue Reduction Lab
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                >
                  Executive Telemetry Overview
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Engineering */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-text-primary font-mono">
              Engineering Specs
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-brand-text-secondary">
                <GitBranch className="h-3.5 w-3.5 text-brand-text-muted" />
                <span>Rule 91578: O365 Proxy Correlation</span>
              </li>
              <li className="flex items-center gap-1.5 text-brand-text-secondary">
                <Shield className="h-3.5 w-3.5 text-brand-text-muted" />
                <span>Rule 100010: Null-Host Storm Filter</span>
              </li>
              <li className="flex items-center gap-1.5 text-brand-text-secondary">
                <Terminal className="h-3.5 w-3.5 text-brand-text-muted" />
                <span>custom-iris: 4000-char Buffer Fix</span>
              </li>
              <li>
                <a
                  href="https://github.com/blusoc/blusoc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  <span>View Repository Source</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-text-muted">
          <p>
            Released under the MIT License. Sanitized enterprise blue-team telemetry dataset.
          </p>
          <div className="flex items-center gap-6">
            <span className="font-mono">RFC 1918 / RFC 5737 Masked</span>
            <span>Zero-Trust Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
