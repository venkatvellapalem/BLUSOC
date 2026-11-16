"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Radar } from "lucide-react";

type Target = "sink" | "n8n" | "laya" | "iris" | "notify" | "contain";

interface LogItem {
  id: number;
  kind: "suppress" | "qualify" | "enrich" | "escalate" | "notify" | "contain";
  text: string;
}

const SENSORS = [
  { name: "CrowdStrike Falcon", feed: "EDR telemetry", y: 54, logo: "/logos/crowdstrike.svg", logoW: 22, logoH: 6 },
  { name: "Suricata", feed: "IDS / DPI", y: 112, logo: "/logos/suricata.png", logoW: 18, logoH: 18 },
  { name: "Barracuda", feed: "Email & gateway", y: 170, logo: "/logos/barracuda.svg", logoW: 18, logoH: 18 },
  { name: "Sophos", feed: "Endpoint protection", y: 228, logo: "/logos/sophos.svg", logoW: 18, logoH: 18 },
  { name: "Microsoft 365", feed: "Identity & audit", y: 286, logo: "/logos/microsoft-365.svg", logoW: 18, logoH: 18 },
  { name: "Cloudflare WAF", feed: "Edge traffic", y: 344, logo: "/logos/cloudflare.svg", logoW: 18, logoH: 18 },
] as { name: string; feed: string; y: number; logo?: string; logoW?: number; logoH?: number }[];

const SENSOR_X = 110;
const WAZUH = { x: 340, y: 199 };
const SINK = { x: 340, y: 378 };
const N8N = { x: 520, y: 199 };
const LAYA = { x: 700, y: 199 };

const OUTS = [
  { key: "iris", name: "DFIR-IRIS", sub: "TP + high confidence ticket", y: 78, logo: "/logos/dfir-iris.svg", accent: "#0EA5E9" },
  { key: "analyst", name: "Analysts", sub: "Investigate IRIS tickets", y: 138, accent: "#0284C7" },
  { key: "notify", name: "Discord / Slack", sub: "SOC alert notifications", y: 236, logos: ["/logos/discord.svg", "/logos/slack.svg"], accent: "#6366F1" },
  { key: "contain", name: "FortiGate", sub: "Containment & isolation", y: 334, logo: "/logos/fortinet.svg", accent: "#DC2626" },
] as const;
const OUT_X = 900;

function link(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

const EVENTS: { kind: LogItem["kind"]; text: string; source: number; target: Target }[] = [
  { kind: "suppress", text: "CrowdStrike null-host heartbeat dropped at Wazuh L0", source: 0, target: "sink" },
  { kind: "qualify", text: "Suricata threat-intel match qualified → forwarded to n8n", source: 1, target: "n8n" },
  { kind: "enrich", text: "n8n enriched with TI context (VT/AbuseIPDB/OTX) → Laya", source: 1, target: "laya" },
  { kind: "escalate", text: "Laya: TP + high confidence → DFIR-IRIS ticket created", source: 1, target: "iris" },
  { kind: "suppress", text: "Trusted M365 egress login filtered as known benign", source: 4, target: "sink" },
  { kind: "qualify", text: "Barracuda phishing signal qualified for orchestration", source: 2, target: "n8n" },
  { kind: "enrich", text: "n8n normalized sender/domain intel and routed to Laya", source: 2, target: "laya" },
  { kind: "notify", text: "Laya dispatched SOC alert to Discord and Slack", source: 2, target: "notify" },
  { kind: "qualify", text: "Confirmed exploit behavior qualified by Wazuh", source: 3, target: "n8n" },
  { kind: "enrich", text: "n8n enriched host/exploit context → Laya verdicting", source: 3, target: "laya" },
  { kind: "contain", text: "Containment routed to FortiGate; affected system isolated", source: 3, target: "contain" },
];

const SEED: LogItem[] = [
  { id: 0, kind: "escalate", text: "Laya: TP + high confidence → DFIR-IRIS ticket created" },
  { id: 1, kind: "enrich", text: "n8n enriched alert with TI context → sent to Laya" },
  { id: 2, kind: "qualify", text: "Qualifying alert forwarded from Wazuh to n8n" },
];

const KIND_META: Record<LogItem["kind"], { label: string; cls: string }> = {
  suppress: { label: "SUPPRESS", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  qualify: { label: "QUALIFY", cls: "text-blue-700 bg-blue-50 border-blue-200" },
  enrich: { label: "n8n", cls: "text-violet-700 bg-violet-50 border-violet-200" },
  escalate: { label: "IRIS", cls: "text-sky-700 bg-sky-50 border-sky-200" },
  notify: { label: "NOTIFY", cls: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  contain: { label: "CONTAIN", cls: "text-rose-700 bg-rose-50 border-rose-200" },
};

const SENSOR_COLORS = ["#FC0000", "#F97316", "#0081C6", "#0057A8", "#2563EB", "#F38020"];

export function CorrelationConsole() {
  const [log, setLog] = useState<LogItem[]>(SEED);
  const [flash, setFlash] = useState<{ source: number; target: Target } | null>(null);
  const [count, setCount] = useState(1420);

  useEffect(() => {
    let i = 0;
    let nextId = 3;
    let alive = true;
    const id = setInterval(() => {
      const ev = EVENTS[i % EVENTS.length];
      i++;
      setFlash({ source: ev.source, target: ev.target });
      setCount((c) => c + Math.floor(Math.random() * 4) + 1);
      setLog((prev) => [{ id: nextId++, kind: ev.kind, text: ev.text }, ...prev].slice(0, 8));
      setTimeout(() => {
        if (alive) setFlash(null);
      }, 850);
    }, 2200);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const layaHot = flash?.target === "laya" || flash?.target === "iris" || flash?.target === "notify" || flash?.target === "contain";
  const n8nHot = flash?.target === "n8n" || layaHot;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-brand-border bg-white/70">
        <Radar className="h-4 w-4 text-blue-600" />
        <span className="font-mono text-[11px] font-bold tracking-widest text-brand-text-primary">DETECTION &amp; RESPONSE ARCHITECTURE</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          LIVE
        </span>
        <span className="ml-auto hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-brand-text-muted"><Cpu className="h-3 w-3" /> Wazuh → n8n → Laya</span>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-0">
        <div className="relative min-h-[420px] bg-gradient-to-b from-[#FBFCFE] to-[#F6F9FC]">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1040 430" fill="none" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Detection and response architecture: sensors to Wazuh, qualifying alerts to n8n, enriched alerts to Laya, high-confidence true positives to IRIS, alerts to Discord and Slack, containment to FortiGate">
            <defs>
              <pattern id="cg-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="#E2E8F0" /></pattern>
              <radialGradient id="engineCore" cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#1D4ED8" /></radialGradient>
              <linearGradient id="flowBlue" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" /><stop offset="50%" stopColor="#3B82F6" stopOpacity="0.85" /><stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" /></linearGradient>
              <linearGradient id="flowRose" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#F43F5E" stopOpacity="0.1" /><stop offset="50%" stopColor="#F43F5E" stopOpacity="0.85" /><stop offset="100%" stopColor="#F43F5E" stopOpacity="0.1" /></linearGradient>
              <linearGradient id="flowViolet" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.1" /><stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.85" /><stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" /></linearGradient>
              <filter id="cg-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <rect width="1040" height="430" fill="url(#cg-dots)" opacity="0.7" />

            <g opacity="0.5">
              <circle cx={WAZUH.x} cy={WAZUH.y} r="110" stroke="#3B82F6" strokeOpacity="0.12" strokeDasharray="2 6" />
              <circle cx={WAZUH.x} cy={WAZUH.y} r="76" stroke="#3B82F6" strokeOpacity="0.18" strokeDasharray="2 6" />
              <circle cx={WAZUH.x} cy={WAZUH.y} r="44" stroke="#3B82F6" strokeOpacity="0.24" strokeDasharray="2 6" />
            </g>

            {SENSORS.map((s, i) => {
              const d = link(SENSOR_X + 18, s.y, WAZUH.x - 26, WAZUH.y);
              const on = flash?.source === i;
              return (
                <g key={`s${i}`}>
                  <path d={d} stroke="#E2E8F0" strokeWidth="1.1" fill="none" />
                  <path d={d} stroke={on ? "#1D4ED8" : "url(#flowBlue)"} strokeWidth={on ? 2.3 : 1.5} strokeDasharray="4 8" fill="none" className="animate-dash-flow" />
                  <circle r="2.6" fill={on ? "#1D4ED8" : "#3B82F6"}><animateMotion dur={`${1.6 + (i % 3) * 0.25}s`} repeatCount="indefinite" path={d} /></circle>
                </g>
              );
            })}

            {(() => {
              const d = `M ${WAZUH.x} ${WAZUH.y + 24} C ${WAZUH.x + 28} 305, ${WAZUH.x - 28} 338, ${SINK.x} ${SINK.y - 12}`;
              const on = flash?.target === "sink";
              return (
                <g>
                  <path d={d} stroke="#FDE68A" strokeWidth="1.1" fill="none" />
                  <path d={d} stroke={on ? "#D97706" : "#F59E0B"} strokeWidth={on ? 2.3 : 1.4} strokeDasharray="3 7" fill="none" className="animate-dash-flow-slow" />
                  <circle r="2.3" fill={on ? "#D97706" : "#FBBF24"}><animateMotion dur="2s" repeatCount="indefinite" path={d} /></circle>
                </g>
              );
            })()}

            {(() => {
              const d = link(WAZUH.x + 26, WAZUH.y, N8N.x - 30, N8N.y);
              return (
                <g>
                  <path d={d} stroke="#FECDD3" strokeWidth="1.2" fill="none" />
                  <path d={d} stroke={n8nHot ? "#E11D48" : "url(#flowRose)"} strokeWidth={n8nHot ? 2.4 : 1.6} strokeDasharray="4 8" fill="none" className="animate-dash-flow" />
                  <circle r="2.8" fill={n8nHot ? "#E11D48" : "#F43F5E"}><animateMotion dur="1.5s" repeatCount="indefinite" path={d} /></circle>
                  <text x={(WAZUH.x + N8N.x) / 2} y={WAZUH.y - 12} fill="#E11D48" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="600">qualifying alerts</text>
                </g>
              );
            })()}

            {(() => {
              const d = link(N8N.x + 30, N8N.y, LAYA.x - 30, LAYA.y);
              return (
                <g>
                  <path d={d} stroke="#DDD6FE" strokeWidth="1.2" fill="none" />
                  <path d={d} stroke={layaHot ? "#7C3AED" : "url(#flowViolet)"} strokeWidth={layaHot ? 2.4 : 1.6} strokeDasharray="4 8" fill="none" className="animate-dash-flow" />
                  <circle r="2.8" fill={layaHot ? "#7C3AED" : "#8B5CF6"}><animateMotion dur="1.6s" repeatCount="indefinite" path={d} /></circle>
                  <text x={(N8N.x + LAYA.x) / 2} y={N8N.y - 12} fill="#7C3AED" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="600">enriched context</text>
                </g>
              );
            })()}

            {OUTS.map((o) => {
              const on = (o.key === "iris" && flash?.target === "iris") || (o.key === "notify" && flash?.target === "notify") || (o.key === "contain" && flash?.target === "contain");
              if (o.key === "analyst") {
                const d = link(OUT_X - 66, OUTS[0].y + 14, OUT_X - 66, o.y - 12);
                return (
                  <g key={o.key}>
                    <path d={d} stroke="#E2E8F0" strokeWidth="1.1" fill="none" />
                    <path d={d} stroke={flash?.target === "iris" ? "#0284C7" : "#BAE6FD"} strokeWidth={flash?.target === "iris" ? 2.1 : 1.3} strokeDasharray="3 6" fill="none" className="animate-dash-flow-slow" />
                  </g>
                );
              }
              const d = link(LAYA.x + 30, LAYA.y, OUT_X - 82, o.y);
              return (
                <g key={o.key}>
                  <path d={d} stroke="#E2E8F0" strokeWidth="1.1" fill="none" />
                  <path d={d} stroke={o.accent} strokeOpacity={on ? 1 : 0.5} strokeWidth={on ? 2.4 : 1.5} strokeDasharray="4 8" fill="none" className="animate-dash-flow" />
                  <circle r="2.6" fill={o.accent}><animateMotion dur={o.key === "contain" ? "1.9s" : "1.7s"} repeatCount="indefinite" path={d} /></circle>
                </g>
              );
            })}

            {SENSORS.map((s, i) => {
              const on = flash?.source === i;
              const color = SENSOR_COLORS[i] ?? "#3B82F6";
              return (
                <g key={`sn${i}`}>
                  <rect x={SENSOR_X - 14} y={s.y - 13} width="30" height="26" rx="7" fill="#FFFFFF" stroke={on ? color : "#E2E8F0"} strokeWidth={on ? 1.8 : 1} />
                  {s.logo && <image href={s.logo} x={SENSOR_X - 14 + (30 - (s.logoW ?? 18)) / 2} y={s.y - 13 + (26 - (s.logoH ?? 18)) / 2} width={s.logoW ?? 18} height={s.logoH ?? 18} preserveAspectRatio="xMidYMid meet" />}
                  <text x={SENSOR_X + 24} y={s.y - 1} fill={on ? "#0F172A" : "#334155"} fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">{s.name}</text>
                  <text x={SENSOR_X + 24} y={s.y + 11} fill="#94A3B8" fontSize="8.4" fontFamily="var(--font-mono)">{s.feed}</text>
                </g>
              );
            })}

            <g filter={n8nHot ? "url(#cg-glow)" : undefined}>
              <circle cx={WAZUH.x} cy={WAZUH.y} r="32" fill="#3B82F6" opacity="0.08" />
              <circle cx={WAZUH.x} cy={WAZUH.y} r="32" fill="none" stroke="#3B82F6" strokeOpacity="0.35" strokeDasharray="3 6" className="animate-radar-sweep" style={{ transformOrigin: `${WAZUH.x}px ${WAZUH.y}px` }} />
              <circle cx={WAZUH.x} cy={WAZUH.y} r="22" fill="url(#engineCore)" />
              <circle cx={WAZUH.x} cy={WAZUH.y} r="22" fill="none" stroke="#93C5FD" strokeOpacity="0.7" />
              <circle cx={WAZUH.x} cy={WAZUH.y} r="22" fill="none" stroke="#3B82F6" strokeWidth="1.5" className="animate-pulse-ring" style={{ transformOrigin: `${WAZUH.x}px ${WAZUH.y}px` }} />
              <image href="/logos/wazuh.svg" x={WAZUH.x - 11} y={WAZUH.y - 11} width="22" height="22" preserveAspectRatio="xMidYMid meet" />
              <text x={WAZUH.x} y={WAZUH.y + 42} fill="#2563EB" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">WAZUH</text>
              <text x={WAZUH.x} y={WAZUH.y + 54} fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">Correlate &amp; suppress</text>
            </g>

            <g>
              <rect x={SINK.x - 62} y={SINK.y - 16} width="124" height="32" rx="10" fill="#FFFBEB" stroke={flash?.target === "sink" ? "#F59E0B" : "#FDE68A"} strokeWidth={flash?.target === "sink" ? 2 : 1.2} />
              <circle cx={SINK.x - 42} cy={SINK.y} r="4.5" fill="#F59E0B" />
              <text x={SINK.x - 32} y={SINK.y + 3.5} fill="#92400E" fontSize="9.5" fontWeight="600" fontFamily="var(--font-mono)">Level 0 noise sink</text>
            </g>

            <g filter={n8nHot ? "url(#cg-glow)" : undefined}>
              <rect x={N8N.x - 28} y={N8N.y - 24} width="56" height="48" rx="14" fill={n8nHot ? "#FFF1F2" : "#FFFFFF"} stroke={n8nHot ? "#F43F5E" : "#FECDD3"} strokeWidth={n8nHot ? 2.2 : 1.4} />
              <image href="/logos/n8n.svg" x={N8N.x - 11} y={N8N.y - 14} width="22" height="22" preserveAspectRatio="xMidYMid meet" />
              <text x={N8N.x} y={N8N.y + 38} fill="#BE123C" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">n8n SOAR</text>
              <text x={N8N.x} y={N8N.y + 50} fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">Enrich &amp; route</text>
            </g>

            <g filter={layaHot ? "url(#cg-glow)" : undefined}>
              <rect x={LAYA.x - 28} y={LAYA.y - 24} width="56" height="48" rx="14" fill={layaHot ? "#F5F3FF" : "#FFFFFF"} stroke={layaHot ? "#8B5CF6" : "#DDD6FE"} strokeWidth={layaHot ? 2.2 : 1.4} />
              <image href="/logos/laya.svg" x={LAYA.x - 11} y={LAYA.y - 14} width="22" height="22" preserveAspectRatio="xMidYMid meet" />
              <text x={LAYA.x} y={LAYA.y + 38} fill="#6D28D9" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">Laya</text>
              <text x={LAYA.x} y={LAYA.y + 50} fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">Triage &amp; verdict</text>
            </g>

            {OUTS.map((o) => {
              const on = (o.key === "iris" && flash?.target === "iris") || (o.key === "notify" && flash?.target === "notify") || (o.key === "contain" && flash?.target === "contain");
              if (o.key === "analyst") {
                return (
                  <g key={o.key}>
                    <circle cx={OUT_X - 66} cy={o.y} r="13" fill="#E0F2FE" stroke={flash?.target === "iris" ? "#0284C7" : "#7DD3FC"} strokeWidth="1.2" />
                    <text x={OUT_X - 66} y={o.y + 4} fill="#0369A1" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">A</text>
                    <text x={OUT_X - 44} y={o.y - 2} fill="#334155" fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">{o.name}</text>
                    <text x={OUT_X - 44} y={o.y + 10} fill="#94A3B8" fontSize="8.2" fontFamily="var(--font-mono)">{o.sub}</text>
                  </g>
                );
              }
              if (o.key === "notify") {
                const boxW = 52; const boxX = OUT_X - 82;
                return (
                  <g key={o.key}>
                    <rect x={boxX} y={o.y - 14} width={boxW} height="28" rx="8" fill="#FFFFFF" stroke={on ? o.accent : "#E2E8F0"} strokeWidth={on ? 1.9 : 1} />
                    <image href={o.logos[0]} x={boxX + 6} y={o.y - 8} width="16" height="16" preserveAspectRatio="xMidYMid meet" />
                    <image href={o.logos[1]} x={boxX + 28} y={o.y - 8} width="16" height="16" preserveAspectRatio="xMidYMid meet" />
                    <text x={boxX + boxW + 10} y={o.y - 1} fill="#334155" fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">{o.name}</text>
                    <text x={boxX + boxW + 10} y={o.y + 11} fill="#94A3B8" fontSize="8.2" fontFamily="var(--font-mono)">{o.sub}</text>
                  </g>
                );
              }
              const boxW = 30; const boxX = OUT_X - 82;
              return (
                <g key={o.key}>
                  <rect x={boxX} y={o.y - 14} width={boxW} height="28" rx="8" fill="#FFFFFF" stroke={on ? o.accent : "#E2E8F0"} strokeWidth={on ? 1.9 : 1} />
                  <image href={o.logo} x={boxX + 6} y={o.y - 9} width="18" height="18" preserveAspectRatio="xMidYMid meet" />
                  <text x={boxX + boxW + 10} y={o.y - 1} fill="#334155" fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">{o.name}</text>
                  <text x={boxX + boxW + 10} y={o.y + 11} fill="#94A3B8" fontSize="8.2" fontFamily="var(--font-mono)">{o.sub}</text>
                </g>
              );
            })}

            <text x={(LAYA.x + OUT_X - 82) / 2 + 10} y={70} fill="#0284C7" fontSize="7.5" textAnchor="middle" fontFamily="var(--font-mono)">TP + high confidence</text>
          </svg>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-brand-border flex flex-col min-h-0 bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border-subtle">
            <span className="font-mono text-[10px] font-bold tracking-widest text-brand-text-secondary">EVENT STREAM</span>
            <span className="font-mono text-[10px] text-brand-text-muted tabular">{count.toLocaleString()}/min</span>
          </div>
          <div className="flex-1 overflow-hidden p-3 space-y-1.5">
            <AnimatePresence initial={false}>
              {log.map((item) => {
                const m = KIND_META[item.kind];
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="flex items-center gap-2 rounded-md border border-brand-border bg-brand-surface px-2.5 py-1.5">
                    <span className={`shrink-0 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${m.cls}`}>{m.label}</span>
                    <span className="font-mono text-[11px] text-brand-text-secondary truncate">{item.text}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
