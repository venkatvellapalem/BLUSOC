'use client';

import React, { useState } from 'react';
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
  { id: 'stage-sensors', title: 'Sensors', sub: 'Telemetry ingress', x: 30, y: 70, w: 190, h: 440, color: '#2563EB', logo: null as string | null },
  { id: 'stage-wazuh', title: 'Wazuh', sub: 'Correlate & suppress', x: 255, y: 70, w: 190, h: 440, color: '#2563EB', logo: '/logos/wazuh.svg' },
  { id: 'stage-enrich', title: 'Enrichment', sub: 'Context & normalize', x: 480, y: 70, w: 170, h: 440, color: '#059669', logo: null },
  { id: 'stage-laya', title: 'Laya', sub: 'Qualifying alert triage', x: 685, y: 70, w: 170, h: 440, color: '#7C3AED', logo: '/logos/laya.svg' },
  { id: 'stage-response', title: 'Response', sub: 'IRIS, notify, contain', x: 890, y: 70, w: 270, h: 440, color: '#0EA5E9', logo: null },
];

function packetPos(step: number, outcome?: string) {
  if (!step) return null;
  if (outcome === 'suppressed') {
    if (step === 1) return { x: 125, y: 250, label: 'INGEST' };
    if (step >= 2) return { x: 350, y: 555, label: 'SUPPRESSED' };
  }
  switch (step) {
    case 1: return { x: 125, y: 250, label: 'INGEST' };
    case 2: return { x: 350, y: 250, label: 'QUALIFY' };
    case 3: return { x: 565, y: 250, label: 'ENRICH' };
    case 4: return { x: 770, y: 250, label: 'Laya' };
    case 5:
      if (outcome === 'contain') return { x: 1110, y: 350, label: 'CONTAIN' };
      if (outcome === 'notify') return { x: 1110, y: 250, label: 'NOTIFY' };
      return { x: 1110, y: 120, label: 'IRIS TICKET' };
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

  return (
    <div className="relative rounded-2xl border border-brand-border bg-brand-surface shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between border-b border-brand-border bg-brand-canvas px-6 py-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-brand-text-primary tracking-tight">Detection &amp; Response Flow</h2>
            <p className="text-xs text-brand-text-secondary">Wazuh forwards qualifying alerts to Laya; responses route to IRIS, Discord/Slack, and FortiGate</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-brand-text-secondary">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-blue-500" /> Qualifying flow</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-amber-500" /> Suppressed noise</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-emerald-600" /> TP -&gt; IRIS</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto bg-[#F8FAFC] p-4 lg:p-6">
        <div className="min-w-[1100px] max-w-[1220px] mx-auto">
          <svg viewBox="0 0 1180 640" className="w-full h-auto select-none font-sans" style={{ minHeight: 520 }}>
            <defs>
              <pattern id="dotp" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#E2E8F0" />
              </pattern>
              <marker id="arr-blue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#2563EB" /></marker>
              <marker id="arr-amber" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#D97706" /></marker>
              <marker id="arr-violet" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#7C3AED" /></marker>
              <marker id="arr-sky" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#0284C7" /></marker>
              <marker id="arr-red" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 8 5 L 0 9 z" fill="#DC2626" /></marker>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <rect width="1180" height="640" fill="url(#dotp)" />

            {/* Main flow lines */}
            <path d="M 220 250 C 238 250, 238 250, 255 250" stroke="#2563EB" strokeWidth="3" fill="none" markerEnd="url(#arr-blue)" strokeDasharray="6 4" />
            <path d="M 445 250 C 462 250, 462 250, 480 250" stroke="#7C3AED" strokeWidth="3" fill="none" markerEnd="url(#arr-violet)" strokeDasharray="6 4" />
            <path d="M 650 250 C 668 250, 668 250, 685 250" stroke="#7C3AED" strokeWidth="3" fill="none" markerEnd="url(#arr-violet)" strokeDasharray="6 4" />
            {/* Wazuh -> sink */}
            <path d="M 350 340 C 350 420, 350 470, 350 530" stroke="#D97706" strokeWidth="3" fill="none" markerEnd="url(#arr-amber)" strokeDasharray="5 4" />
            {/* Laya -> outputs */}
            <path d="M 855 220 C 900 150, 930 130, 970 120" stroke="#0284C7" strokeWidth="2.5" fill="none" markerEnd="url(#arr-sky)" strokeDasharray="5 4" />
            <path d="M 855 250 C 910 250, 930 250, 970 250" stroke="#6366F1" strokeWidth="2.5" fill="none" markerEnd="url(#arr-violet)" strokeDasharray="5 4" />
            <path d="M 855 290 C 900 330, 930 345, 970 350" stroke="#DC2626" strokeWidth="2.5" fill="none" markerEnd="url(#arr-red)" strokeDasharray="5 4" />
            {/* IRIS -> analysts */}
            <path d="M 1045 138 C 1045 155, 1045 160, 1045 170" stroke="#94A3B8" strokeWidth="2" fill="none" strokeDasharray="4 4" />

            {!isSimulating && (
              <>
                <circle r="4" fill="#2563EB"><animateMotion path="M 220 250 C 238 250, 238 250, 255 250" dur="1.8s" repeatCount="indefinite" /></circle>
                <circle r="4" fill="#7C3AED"><animateMotion path="M 445 250 C 462 250, 462 250, 480 250" dur="2s" repeatCount="indefinite" /></circle>
                <circle r="4" fill="#7C3AED"><animateMotion path="M 650 250 C 668 250, 668 250, 685 250" dur="2s" repeatCount="indefinite" /></circle>
                <circle r="4" fill="#D97706"><animateMotion path="M 350 340 C 350 420, 350 470, 350 530" dur="2.6s" repeatCount="indefinite" /></circle>
              </>
            )}

            {/* Stage cards */}
            {STAGES.map((s, idx) => {
              const active = selectedStageId === s.id;
              const hover = hovered === s.id;
              return (
                <g key={s.id} onClick={() => onSelectStage(s.id)} onMouseEnter={() => setHovered(s.id)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
                  <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="14" fill="#FFFFFF" stroke={active ? '#2563EB' : hover ? '#93C5FD' : '#E2E8F0'} strokeWidth={active ? 2.5 : 1.5} filter="drop-shadow(0 4px 6px rgba(15,23,42,0.04))" />
                  <rect x={s.x} y={s.y} width={s.w} height="52" rx="14" fill="#F8FAFC" />
                  <rect x={s.x} y={s.y + 40} width={s.w} height="12" fill="#F8FAFC" />
                  <line x1={s.x} y1={s.y + 52} x2={s.x + s.w} y2={s.y + 52} stroke="#E2E8F0" />
                  <circle cx={s.x + 20} cy={s.y + 26} r="11" fill="#EFF6FF" stroke="#BFDBFE" />
                  <text x={s.x + 20} y={s.y + 30} textAnchor="middle" fontSize="10" fontWeight="700" fill="#2563EB">{idx + 1}</text>
                  <text x={s.x + 38} y={s.y + 23} fontSize="11" fontWeight="700" fill="#0F172A">{s.title}</text>
                  <text x={s.x + 38} y={s.y + 37} fontSize="9" fill="#64748B">{s.sub}</text>
                  {s.logo && <image href={s.logo} x={s.x + s.w - 32} y={s.y + 14} width="18" height="18" preserveAspectRatio="xMidYMid meet" />}
                  <rect x={s.x + 12} y={s.y + s.h - 34} width={s.w - 24} height="22" rx="6" fill="#F1F5F9" stroke="#E2E8F0" />
                  <text x={s.x + s.w / 2} y={s.y + s.h - 19} textAnchor="middle" fontSize="9" fontWeight="600" fill="#2563EB">Inspect stage →</text>
                </g>
              );
            })}

            {/* Sensor details */}
            {[
              { name: 'CrowdStrike Falcon', sub: 'EDR telemetry', y: 150, logo: '/logos/crowdstrike.svg', lw: 56, lh: 10 },
              { name: 'Suricata', sub: 'IDS / 10G tap', y: 205, logo: '/logos/suricata.png', lw: 16, lh: 16 },
              { name: 'Barracuda', sub: 'Email & gateway', y: 260, logo: '/logos/barracuda.svg', lw: 16, lh: 16 },
              { name: 'Sophos', sub: 'Endpoint protection', y: 315, logo: '/logos/sophos.svg', lw: 16, lh: 16 },
              { name: 'Microsoft 365', sub: 'Identity & audit', y: 370, logo: '/logos/microsoft-365.svg', lw: 16, lh: 16 },
              { name: 'Cloudflare WAF', sub: 'Edge traffic', y: 425, logo: '/logos/cloudflare.svg', lw: 16, lh: 16 },
            ].map((n) => (
              <g key={n.name}>
                <rect x={42} y={n.y - 18} width={166} height="36" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
                <image href={n.logo} x={50} y={n.y - n.lh / 2} width={n.lw} height={n.lh} preserveAspectRatio="xMidYMid meet" />
                <text x={50 + n.lw + 8} y={n.y - 2} fontSize="9.5" fontWeight="600" fill="#0F172A">{n.name}</text>
                <text x={50 + n.lw + 8} y={n.y + 10} fontSize="8" fill="#64748B">{n.sub}</text>
              </g>
            ))}

            {/* Wazuh details */}
            <g>
              <rect x={267} y={140} width={166} height="70" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
              <text x={279} y={160} fontSize="10" fontWeight="700" fill="#0F172A">Correlation Engine</text>
              <text x={279} y={175} fontSize="8.5" fill="#64748B">1,400+ tuned rules (L0-L12)</text>
              <text x={279} y={189} fontSize="8.5" fill="#2563EB">Decoders & scoring</text>
              <rect x={267} y={220} width={166} height="70" rx="8" fill="#FFFBEB" stroke="#FDE68A" />
              <text x={279} y={240} fontSize="10" fontWeight="700" fill="#92400E">Noise Suppression</text>
              <text x={279} y={255} fontSize="8.5" fill="#78350F">Level 0 benign events dropped</text>
              <text x={279} y={270} fontSize="8.5" fill="#78350F">98.7% volume reduction</text>
              <rect x={267} y={300} width={166} height="54" rx="8" fill="#F5F3FF" stroke="#DDD6FE" />
              <text x={279} y={320} fontSize="10" fontWeight="700" fill="#5B21B6">Qualifying Alerts</text>
              <text x={279} y={336} fontSize="8.5" fill="#6D28D9">Forwarded to Laya for triage</text>
            </g>

            {/* Sink */}
            <g>
              <rect x={270} y={530} width={160} height="64" rx="10" fill="#FEF3C7" stroke="#F59E0B" strokeDasharray="4 2" />
              <text x={350} y={552} textAnchor="middle" fontSize="10" fontWeight="700" fill="#92400E">LEVEL 0 NOISE SINK</text>
              <text x={350} y={568} textAnchor="middle" fontSize="8.5" fill="#B45309">Suppressed at Wazuh</text>
              <text x={350} y={582} textAnchor="middle" fontSize="8" fill="#78350F">Not sent to Laya</text>
            </g>

            {/* Enrichment details */}
            <g>
              <rect x={492} y={150} width={146} height="68" rx="8" fill="#ECFDF5" stroke="#BBF7D0" />
              <text x={504} y={170} fontSize="10" fontWeight="700" fill="#166534">4,000-char Buffer</text>
              <text x={504} y={185} fontSize="8.5" fill="#15803D">Full payload preserved</text>
              <text x={504} y={200} fontSize="8.5" fill="#15803D">No clipping</text>
              <rect x={492} y={228} width={146} height="64" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
              <text x={504} y={248} fontSize="10" fontWeight="700" fill="#0F172A">GeoIP & ASN</text>
              <text x={504} y={263} fontSize="8.5" fill="#64748B">Public IP enrichment</text>
              <text x={504} y={277} fontSize="8.5" fill="#64748B">IOC/context extraction</text>
              <rect x={492} y={302} width={146} height="52" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
              <text x={504} y={322} fontSize="10" fontWeight="700" fill="#0F172A">Normalization</text>
              <text x={504} y={337} fontSize="8.5" fill="#64748B">Schema for Laya triage</text>
            </g>

            {/* Laya details */}
            <g>
              <rect x={697} y={150} width={146} height="72" rx="8" fill="#F5F3FF" stroke="#DDD6FE" />
              <text x={709} y={170} fontSize="10" fontWeight="700" fill="#5B21B6">Triage & Verdict</text>
              <text x={709} y={185} fontSize="8.5" fill="#6D28D9">Confidence assessment</text>
              <text x={709} y={200} fontSize="8.5" fill="#6D28D9">TP / suspicious / benign</text>
              <rect x={697} y={232} width={146} height="96" rx="8" fill="#F8FAFC" stroke="#E2E8F0" />
              <text x={709} y={252} fontSize="10" fontWeight="700" fill="#0F172A">Routing Decisions</text>
              <text x={709} y={268} fontSize="8.3" fill="#0284C7">TP + high confidence → IRIS</text>
              <text x={709} y={284} fontSize="8.3" fill="#4F46E5">Alerts → Discord/Slack</text>
              <text x={709} y={300} fontSize="8.3" fill="#DC2626">Containment → FortiGate</text>
              <text x={709} y={316} fontSize="8" fill="#64748B">Policy-driven actions</text>
              <text x={770} y={360} textAnchor="middle" fontSize="8.5" fill="#64748B">Input: qualifying alerts only</text>
            </g>

            {/* Response details */}
            <g>
              {/* IRIS */}
              <rect x={902} y={92} width={246} height="88" rx="10" fill="#F0F9FF" stroke="#BAE6FD" />
              <image href="/logos/dfir-iris.svg" x={914} y={102} width="18" height="18" />
              <text x={938} y={115} fontSize="10.5" fontWeight="700" fill="#0F172A">DFIR-IRIS (Tickets)</text>
              <text x={914} y={134} fontSize="8.5" fill="#0369A1">Only true positive, high-confidence alerts</text>
              <text x={914} y={148} fontSize="8.5" fill="#64748B">Created as tickets for analyst investigation</text>
              <rect x={914} y={154} width={90} height="18" rx="6" fill="#E0F2FE" />
              <text x={959} y={166} textAnchor="middle" fontSize="8.2" fontWeight="600" fill="#0369A1">Analyst queue</text>
              <text x={1012} y={166} fontSize="8.2" fill="#64748B">Investigate in IRIS</text>
              <circle cx={1045} cy={188} r="11" fill="#E0F2FE" stroke="#7DD3FC" />
              <text x={1045} y={192} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0369A1">A</text>
              <text x={1062} y={192} fontSize="8.5" fill="#334155">Analysts</text>

              {/* Notify */}
              <rect x={902} y={210} width={246} height="74" rx="10" fill="#EEF2FF" stroke="#C7D2FE" />
              <image href="/logos/discord.svg" x={914} y={222} width="18" height="18" />
              <image href="/logos/slack.svg" x={936} y={222} width="18" height="18" />
              <text x={960} y={235} fontSize="10.5" fontWeight="700" fill="#0F172A">Discord & Slack</text>
              <text x={914} y={252} fontSize="8.5" fill="#4338CA">Alert notifications sent to SOC channels</text>
              <text x={914} y={266} fontSize="8.5" fill="#64748B">Operational visibility for qualifying/triaged alerts</text>

              {/* Contain */}
              <rect x={902} y={312} width={246} height="78" rx="10" fill="#FEF2F2" stroke="#FECACA" />
              <image href="/logos/fortinet.svg" x={914} y={324} width="18" height="18" />
              <text x={938} y={337} fontSize="10.5" fontWeight="700" fill="#0F172A">FortiGate Containment</text>
              <text x={914} y={354} fontSize="8.5" fill="#B91C1C">Containment processes to isolate affected systems</text>
              <text x={914} y={368} fontSize="8.5" fill="#64748B">Automated quarantine / block actions on confirmed threats</text>
            </g>

            {/* Annotations */}
            <text x="238" y="242" fontSize="8" fill="#2563EB" textAnchor="middle">ingest</text>
            <text x="462" y="242" fontSize="8" fill="#7C3AED" textAnchor="middle">qualifying alerts</text>
            <text x="668" y="242" fontSize="8" fill="#7C3AED" textAnchor="middle">to Laya</text>
            <text x="912" y="112" fontSize="7.5" fill="#0284C7">TP + high confidence</text>

            {pkt && (
              <g transform={`translate(${pkt.x}, ${pkt.y})`} filter="url(#glow)">
                <circle r="16" fill={pkt.label === 'SUPPRESSED' ? '#FEF3C7' : '#DBEAFE'} opacity="0.8"><animate attributeName="r" values="12;20;12" dur="1.2s" repeatCount="indefinite" /></circle>
                <circle r="9" fill={pkt.label === 'SUPPRESSED' ? '#D97706' : pkt.label === 'CONTAIN' ? '#DC2626' : '#2563EB'} stroke="#fff" strokeWidth="2.5" />
                <rect x="-42" y="-32" width="84" height="20" rx="4" fill="#0F172A" opacity="0.92" />
                <text x="0" y="-19" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">{pkt.label}</text>
              </g>
            )}
          </svg>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between border-t border-brand-border bg-white px-6 py-3 text-xs text-brand-text-secondary gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-brand-text-muted" />
          <span>Qualifying alerts flow Wazuh → Laya. Only true positive, high-confidence alerts become IRIS tickets; alerts notify Discord/Slack; containment isolates via FortiGate.</span>
        </div>
        <span className="font-mono text-brand-text-muted">End-to-end: ~2.8 ms</span>
      </div>
    </div>
  );
}
