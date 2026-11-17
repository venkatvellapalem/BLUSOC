'use client';

import React, { useMemo, useState } from 'react';
import { Layers, Info } from 'lucide-react';
import { SimulationPreset } from './pipelineData';

interface PipelineCanvasProps {
  selectedStageId: string | null;
  onSelectStage: (stageId: string) => void;
  activePreset: SimulationPreset | null;
  simulationStep: number;
  isSimulating: boolean;
}

const STAGES = [
  { id: 'stage-sensors', title: 'Sensors', sub: 'Telemetry ingress', x: 20, y: 70, w: 170, h: 440, logo: null as string | null },
  { id: 'stage-wazuh', title: 'Wazuh', sub: 'Correlate & suppress', x: 210, y: 70, w: 170, h: 440, logo: '/logos/wazuh.svg' },
  { id: 'stage-n8n', title: 'n8n SOAR', sub: 'Enrich & route', x: 400, y: 70, w: 170, h: 440, logo: null },
  { id: 'stage-laya', title: 'Laya', sub: 'Verdict & decision', x: 590, y: 70, w: 170, h: 440, logo: '/logos/laya.svg' },
  { id: 'stage-response', title: 'Response', sub: 'IRIS, notify, contain', x: 780, y: 70, w: 300, h: 440, logo: null },
];

function packetPos(step: number, outcome?: string) {
  if (!step) return null;
  if (outcome === 'suppressed') {
    if (step === 1) return { x: 105, y: 250, label: 'INGEST' };
    if (step >= 2) return { x: 295, y: 560, label: 'SUPPRESSED' };
  }
  switch (step) {
    case 1: return { x: 105, y: 250, label: 'INGEST' };
    case 2: return { x: 295, y: 250, label: 'QUALIFY' };
    case 3: return { x: 485, y: 250, label: 'ENRICH' };
    case 4: return { x: 675, y: 250, label: 'TRIAGE' };
    case 5:
      if (outcome === 'contain') return { x: 1005, y: 360, label: 'CONTAIN' };
      if (outcome === 'notify') return { x: 1005, y: 250, label: 'NOTIFY' };
      return { x: 1005, y: 120, label: 'IRIS TICKET' };
    default: return null;
  }
}

export default function PipelineCanvas({
  selectedStageId,
  onSelectStage,
  activePreset,
  simulationStep,
  isSimulating,
}: PipelineCanvasProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const pkt = packetPos(simulationStep, activePreset?.outcome);
  const activeStageIndex = simulationStep === 0 ? -1 : simulationStep - 1;

  const sensorRows = useMemo(() => ([
    { name: 'CrowdStrike Falcon', sub: 'EDR telemetry', y: 150, logo: '/logos/crowdstrike.svg', lw: 18, lh: 18 },
    { name: 'Suricata', sub: 'IDS / 10G tap', y: 205, logo: '/logos/suricata.png', lw: 16, lh: 16 },
    { name: 'Sophos', sub: 'Endpoint protection', y: 260, logo: '/logos/sophos.svg', lw: 16, lh: 16 },
    { name: 'Barracuda', sub: 'Email & gateway', y: 315, logo: '/logos/barracuda.svg', lw: 16, lh: 16 },
    { name: 'Microsoft 365', sub: 'Identity & audit', y: 370, logo: '/logos/microsoft-365.svg', lw: 16, lh: 16 },
    { name: 'Cloudflare WAF', sub: 'Edge traffic', y: 425, logo: '/logos/cloudflare.svg', lw: 16, lh: 16 },
  ]), []);

  return (
    <div className="relative rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between border-b border-brand-border bg-brand-canvas px-6 py-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 shadow-subtle">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-brand-text-primary tracking-tight">Detection &amp; Response Flow</h2>
            <p className="text-xs text-brand-text-secondary">Qualifying alerts: Wazuh → n8n (enrich) → Laya (triage) → IRIS, Discord/Slack, or FortiGate</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-brand-text-secondary">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-blue-500" /> Qualifying flow</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-amber-500" /> Suppressed at Wazuh</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-emerald-600" /> TP (high confidence) → IRIS</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto bg-gradient-to-b from-[#F8FAFC] to-[#F4F7FB] p-4 lg:p-6">
        <div className="min-w-[1040px] max-w-[1140px] mx-auto">
          <svg viewBox="0 0 1100 640" className="w-full h-auto select-none font-sans" style={{ minHeight: 520 }}>
            <defs>
              <pattern id="dotp2" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#E2E8F0" />
              </pattern>
              <marker id="arr-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#2563EB" /></marker>
              <marker id="arr-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#D97706" /></marker>
              <marker id="arr-violet" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#7C3AED" /></marker>
              <marker id="arr-sky" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#0284C7" /></marker>
              <marker id="arr-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#DC2626" /></marker>
              <filter id="softglow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <rect width="1100" height="640" fill="url(#dotp2)" />

            <path d="M 190 250 C 200 250, 200 250, 210 250" stroke="#2563EB" strokeWidth="3" fill="none" markerEnd="url(#arr-blue)" strokeDasharray="6 5" className="flow-line" />
            <path d="M 380 250 C 390 250, 390 250, 400 250" stroke="#2563EB" strokeWidth="3" fill="none" markerEnd="url(#arr-blue)" strokeDasharray="6 5" className="flow-line" />
            <path d="M 570 250 C 580 250, 580 250, 590 250" stroke="#7C3AED" strokeWidth="3" fill="none" markerEnd="url(#arr-violet)" strokeDasharray="6 5" className="flow-line" />
            <path d="M 295 340 C 295 420, 295 470, 295 530" stroke="#D97706" strokeWidth="3" fill="none" markerEnd="url(#arr-amber)" strokeDasharray="5 5" className="animate-dash-flow-slow" />
            <path d="M 760 220 C 810 150, 840 130, 870 120" stroke="#0284C7" strokeWidth="2.6" fill="none" markerEnd="url(#arr-sky)" strokeDasharray="5 5" className="flow-line" />
            <path d="M 760 250 C 820 250, 840 250, 870 250" stroke="#6366F1" strokeWidth="2.6" fill="none" markerEnd="url(#arr-violet)" strokeDasharray="5 5" className="flow-line" />
            <path d="M 760 290 C 810 330, 840 350, 870 360" stroke="#DC2626" strokeWidth="2.6" fill="none" markerEnd="url(#arr-red)" strokeDasharray="5 5" className="flow-line" />
            <path d="M 945 138 C 945 155, 945 160, 945 170" stroke="#94A3B8" strokeWidth="2" fill="none" strokeDasharray="4 4" />

            {!isSimulating && (
              <>
                <circle r="4" fill="#2563EB"><animateMotion path="M 190 250 C 200 250, 200 250, 210 250" dur="1.8s" repeatCount="indefinite" /></circle>
                <circle r="4" fill="#2563EB"><animateMotion path="M 380 250 C 390 250, 390 250, 400 250" dur="2s" repeatCount="indefinite" /></circle>
                <circle r="4" fill="#7C3AED"><animateMotion path="M 570 250 C 580 250, 580 250, 590 250" dur="2s" repeatCount="indefinite" /></circle>
                <circle r="4" fill="#D97706"><animateMotion path="M 295 340 C 295 420, 295 470, 295 530" dur="2.8s" repeatCount="indefinite" /></circle>
              </>
            )}

            {STAGES.map((s, idx) => {
              const active = selectedStageId === s.id || activeStageIndex === idx;
              const hover = hovered === s.id;
              return (
                <g key={s.id} onClick={() => onSelectStage(s.id)} onMouseEnter={() => setHovered(s.id)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
                  <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="16" fill="#FFFFFF" stroke={active ? '#2563EB' : hover ? '#93C5FD' : '#E2E8F0'} strokeWidth={active ? 2.5 : 1.5} filter={active ? 'url(#softglow)' : undefined} />
                  <rect x={s.x} y={s.y} width={s.w} height="54" rx="16" fill="#F8FAFC" />
                  <rect x={s.x} y={s.y + 42} width={s.w} height="12" fill="#F8FAFC" />
                  <line x1={s.x} y1={s.y + 54} x2={s.x + s.w} y2={s.y + 54} stroke="#E2E8F0" />
                  <circle cx={s.x + 20} cy={s.y + 27} r="11" fill="#EFF6FF" stroke="#BFDBFE" />
                  <text x={s.x + 20} y={s.y + 31} textAnchor="middle" fontSize="10" fontWeight="700" fill="#2563EB">{idx + 1}</text>
                  <text x={s.x + 38} y={s.y + 24} fontSize="11" fontWeight="700" fill="#0F172A">{s.title}</text>
                  <text x={s.x + 38} y={s.y + 38} fontSize="9" fill="#64748B">{s.sub}</text>
                  {s.logo && <image href={s.logo} x={s.x + s.w - 32} y={s.y + 15} width="18" height="18" preserveAspectRatio="xMidYMid meet" />}
                  <rect x={s.x + 12} y={s.y + s.h - 34} width={s.w - 24} height="22" rx="6" fill="#F1F5F9" stroke="#E2E8F0" />
                  <text x={s.x + s.w / 2} y={s.y + s.h - 19} textAnchor="middle" fontSize="9" fontWeight="600" fill="#2563EB">Inspect stage →</text>
                </g>
              );
            })}

            {sensorRows.map((n) => (
              <g key={n.name}>
                <rect x={32} y={n.y - 18} width={146} height="36" rx="9" fill="#F8FAFC" stroke="#E2E8F0" />
                <image href={n.logo} x={40} y={n.y - n.lh / 2} width={n.lw} height={n.lh} preserveAspectRatio="xMidYMid meet" />
                <text x={40 + n.lw + 8} y={n.y - 2} fontSize="9.5" fontWeight="600" fill="#0F172A">{n.name}</text>
                <text x={40 + n.lw + 8} y={n.y + 10} fontSize="8" fill="#64748B">{n.sub}</text>
              </g>
            ))}

            <g>
              <rect x={222} y={140} width={146} height="70" rx="9" fill="#F8FAFC" stroke="#E2E8F0" />
              <text x={234} y={160} fontSize="10" fontWeight="700" fill="#0F172A">Correlation Engine</text>
              <text x={234} y={175} fontSize="8.5" fill="#64748B">Custom tuned rules (L0-L12)</text>
              <text x={234} y={189} fontSize="8.5" fill="#2563EB">Decoders & scoring</text>
              <rect x={222} y={220} width={146} height="70" rx="9" fill="#FFFBEB" stroke="#FDE68A" />
              <text x={234} y={240} fontSize="10" fontWeight="700" fill="#92400E">Noise Suppression</text>
              <text x={234} y={255} fontSize="8.5" fill="#78350F">Level 0 benign events dropped</text>
              <text x={234} y={270} fontSize="8.5" fill="#78350F">98.7% volume reduction</text>
              <rect x={222} y={300} width={146} height="54" rx="9" fill="#EFF6FF" stroke="#BFDBFE" />
              <text x={234} y={320} fontSize="10" fontWeight="700" fill="#1D4ED8">Qualifying Alerts</text>
              <text x={234} y={336} fontSize="8.5" fill="#2563EB">Forwarded to n8n (custom-n8n)</text>
            </g>

            <g>
              <rect x={215} y={530} width={160} height="66" rx="12" fill="#FEF3C7" stroke="#F59E0B" strokeDasharray="4 2" />
              <text x={295} y={552} textAnchor="middle" fontSize="10" fontWeight="700" fill="#92400E">LEVEL 0 NOISE SINK</text>
              <text x={295} y={568} textAnchor="middle" fontSize="8.5" fill="#B45309">Suppressed at Wazuh</text>
              <text x={295} y={582} textAnchor="middle" fontSize="8" fill="#78350F">Not sent to n8n / Laya</text>
            </g>

            <g>
              <rect x={412} y={140} width={146} height="74" rx="9" fill="#F5F3FF" stroke="#DDD6FE" />
              <text x={424} y={160} fontSize="10" fontWeight="700" fill="#5B21B6">n8n SOAR Workflow</text>
              <text x={424} y={175} fontSize="8.5" fill="#6D28D9">Webhook intake (custom-n8n)</text>
              <text x={424} y={190} fontSize="8.5" fill="#6D28D9">DLQ-protected pipeline</text>
              <rect x={412} y={224} width={146} height="70" rx="9" fill="#ECFEFF" stroke="#A5F3FC" />
              <text x={424} y={244} fontSize="10" fontWeight="700" fill="#155E75">Threat Intel Enrichment</text>
              <text x={424} y={259} fontSize="8.5" fill="#0E7490">VT, AbuseIPDB, OTX, etc.</text>
              <text x={424} y={273} fontSize="8.5" fill="#0E7490">Context normalization</text>
              <rect x={412} y={304} width={146} height="52" rx="9" fill="#F8FAFC" stroke="#E2E8F0" />
              <text x={424} y={324} fontSize="10" fontWeight="700" fill="#0F172A">Route to Laya</text>
              <text x={424} y={339} fontSize="8.5" fill="#64748B">Enriched alert handoff</text>
            </g>

            <g>
              <rect x={602} y={140} width={146} height="76" rx="9" fill="#F5F3FF" stroke="#DDD6FE" />
              <text x={614} y={160} fontSize="10" fontWeight="700" fill="#5B21B6">Triage & Verdict</text>
              <text x={614} y={175} fontSize="8.5" fill="#6D28D9">Confidence assessment</text>
              <text x={614} y={190} fontSize="8.5" fill="#6D28D9">TP / suspicious / benign</text>
              <rect x={602} y={226} width={146} height="102" rx="9" fill="#F8FAFC" stroke="#E2E8F0" />
              <text x={614} y={246} fontSize="10" fontWeight="700" fill="#0F172A">Routing Decisions</text>
              <text x={614} y={262} fontSize="8.3" fill="#0284C7">TP + high confidence → IRIS</text>
              <text x={614} y={278} fontSize="8.3" fill="#4F46E5">Alerts → Discord/Slack</text>
              <text x={614} y={294} fontSize="8.3" fill="#DC2626">Containment → FortiGate</text>
              <text x={614} y={312} fontSize="8" fill="#64748B">Analysts investigate IRIS only</text>
              <text x={675} y={352} textAnchor="middle" fontSize="8.5" fill="#64748B">Input: n8n-enriched qualifying alerts</text>
            </g>

            <g>
              <rect x={792} y={92} width={276} height="90" rx="12" fill="#F0F9FF" stroke="#BAE6FD" />
              <image href="/logos/dfir-iris.svg" x={804} y={102} width="18" height="18" />
              <text x={828} y={115} fontSize="10.5" fontWeight="700" fill="#0F172A">DFIR-IRIS (Tickets)</text>
              <text x={804} y={134} fontSize="8.5" fill="#0369A1">Only true positive, high-confidence alerts</text>
              <text x={804} y={148} fontSize="8.5" fill="#64748B">Ticket created for analyst investigation</text>
              <rect x={804} y={156} width={92} height="18" rx="6" fill="#E0F2FE" />
              <text x={850} y={168} textAnchor="middle" fontSize="8.2" fontWeight="600" fill="#0369A1">Analyst queue</text>
              <circle cx={945} cy={188} r="11" fill="#E0F2FE" stroke="#7DD3FC" />
              <text x={945} y={192} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0369A1">A</text>
              <text x={962} y={192} fontSize="8.5" fill="#334155">Analysts</text>

              <rect x={792} y={212} width={276} height="74" rx="12" fill="#EEF2FF" stroke="#C7D2FE" />
              <image href="/logos/discord.svg" x={804} y={224} width="18" height="18" />
              <image href="/logos/slack.svg" x={826} y={224} width="18" height="18" />
              <text x={850} y={237} fontSize="10.5" fontWeight="700" fill="#0F172A">Discord & Slack</text>
              <text x={804} y={254} fontSize="8.5" fill="#4338CA">Alert notifications sent to SOC channels</text>
              <text x={804} y={268} fontSize="8.5" fill="#64748B">Operational visibility for triaged alerts</text>

              <rect x={792} y={316} width={276} height="78" rx="12" fill="#FEF2F2" stroke="#FECACA" />
              <image href="/logos/fortinet.svg" x={804} y={328} width="18" height="18" />
              <text x={828} y={341} fontSize="10.5" fontWeight="700" fill="#0F172A">FortiGate Containment</text>
              <text x={804} y={358} fontSize="8.5" fill="#B91C1C">Containment actions isolate affected systems</text>
              <text x={804} y={372} fontSize="8.5" fill="#64748B">Quarantine / block for confirmed threats</text>
            </g>

            <text x="200" y="242" fontSize="8" fill="#2563EB" textAnchor="middle">ingest</text>
            <text x="390" y="242" fontSize="8" fill="#2563EB" textAnchor="middle">qualifying</text>
            <text x="580" y="242" fontSize="8" fill="#7C3AED" textAnchor="middle">enriched</text>
            <text x="812" y="112" fontSize="7.5" fill="#0284C7">TP + high confidence</text>

            {pkt && (
              <g transform={`translate(${pkt.x}, ${pkt.y})`} filter="url(#softglow)">
                <circle r="16" fill={pkt.label === 'SUPPRESSED' ? '#FEF3C7' : pkt.label === 'CONTAIN' ? '#FEE2E2' : '#DBEAFE'} opacity="0.85">
                  <animate attributeName="r" values="12;20;12" dur="1.2s" repeatCount="indefinite" />
                </circle>
                <circle r="9" fill={pkt.label === 'SUPPRESSED' ? '#D97706' : pkt.label === 'CONTAIN' ? '#DC2626' : pkt.label === 'NOTIFY' ? '#4F46E5' : '#2563EB'} stroke="#fff" strokeWidth="2.5" />
                <rect x="-44" y="-32" width="88" height="20" rx="5" fill="#0F172A" opacity="0.92" />
                <text x="0" y="-19" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">{pkt.label}</text>
              </g>
            )}
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between border-t border-brand-border bg-white px-6 py-3 text-xs text-brand-text-secondary gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-brand-text-muted" />
          <span>Wazuh forwards qualifying alerts to n8n for enrichment, then Laya triages. Only true positive, high-confidence alerts become IRIS tickets.</span>
        </div>
        <span className="font-mono text-brand-text-muted">Animated flow · click any stage for details</span>
      </div>
    </div>
  );
}
