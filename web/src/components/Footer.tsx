import Link from "next/link";
import { Shield, GitBranch, Terminal, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-brand-border bg-white py-12 text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-brand-border">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-mono text-base font-bold tracking-tight text-brand-text-primary">
                BLUSOC
              </span>
            </div>
            <p className="text-xs text-brand-text-secondary max-w-md leading-relaxed">
              Production blue-team engineering: alert noise suppression, Laya triage, and
              automated response across Wazuh, DFIR-IRIS, Discord/Slack, and FortiGate.
            </p>
            <div className="flex items-center gap-3 text-xs text-brand-text-muted font-mono">
              <span>Wazuh</span>
              <span>·</span>
              <span>Laya</span>
              <span>·</span>
              <span>DFIR-IRIS</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-brand-text-primary">Explore</h4>
            <ul className="space-y-2 text-xs text-brand-text-secondary">
              <li><Link href="/pipeline" className="hover:text-blue-600 transition-colors">Pipeline Flow</Link></li>
              <li><Link href="/tech-stack" className="hover:text-blue-600 transition-colors">Tech Stack</Link></li>
              <li><Link href="/workbench" className="hover:text-blue-600 transition-colors">Triage Sample</Link></li>
              <li><Link href="/fatigue-lab" className="hover:text-blue-600 transition-colors">Fatigue Lab</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-brand-text-primary">Engineering</h4>
            <ul className="space-y-2 text-xs text-brand-text-secondary">
              <li className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-brand-text-muted" />
                <span>Rule 91578: O365 Correlation</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-brand-text-muted" />
                <span>custom-iris: 4000-char Buffer</span>
              </li>
              <li>
                <a
                  href="https://github.com/blusoc/blusoc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  <span>Repository</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-text-muted">
          <p>MIT License. Sanitized enterprise telemetry.</p>
          <p className="font-mono">RFC 1918 / RFC 5737 masked</p>
        </div>
      </div>
    </footer>
  );
}
