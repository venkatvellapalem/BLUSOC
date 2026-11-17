import Link from "next/link";
import Image from "next/image";
import { GitBranch, Terminal, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-brand-border bg-white/70 py-12 text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-brand-border">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-subtle overflow-hidden">
                <Image src="/brand-mark.png" alt="BLUSOC" width={32} height={28} className="h-7 w-auto object-contain" />
              </span>
              <span className="font-mono text-base font-bold tracking-tight text-brand-text-primary">
                BLUSOC
              </span>
            </div>
            <p className="text-xs text-brand-text-secondary max-w-md leading-relaxed">
              Detection engineering showcase: Wazuh correlation and suppression, Laya triage, and routed response across DFIR-IRIS, Discord/Slack, and FortiGate.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-text-muted font-mono">
              <span>Wazuh</span><span>·</span><span>n8n SOAR</span><span>·</span><span>Laya</span><span>·</span><span>DFIR-IRIS</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-brand-text-primary">Explore</h4>
            <ul className="space-y-2 text-xs text-brand-text-secondary">
              <li><Link href="/pipeline" className="hover:text-blue-600 transition-colors">Detection & Response Flow</Link></li>
              <li><Link href="/tech-stack" className="hover:text-blue-600 transition-colors">Tech Stack</Link></li>
              <li><Link href="/workbench" className="hover:text-blue-600 transition-colors">Alert Triage Sample</Link></li>
              <li><Link href="/fatigue-lab" className="hover:text-blue-600 transition-colors">Fatigue Lab</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-brand-text-primary">Engineering</h4>
            <ul className="space-y-2 text-xs text-brand-text-secondary">
              <li className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-brand-text-muted" />
                <span>Rule tuning & suppression</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-brand-text-muted" />
                <span>custom-iris / custom-n8n</span>
              </li>
              <li>
                <a
                  href="https://github.com/venkatvellapalem/BLUSOC"
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
          <p>Showcase of detection engineering and response orchestration.</p>
          <p className="font-mono">Wazuh → n8n → Laya → IRIS / Notify / Contain</p>
        </div>
      </div>
    </footer>
  );
}
