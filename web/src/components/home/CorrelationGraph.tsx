"use client";

import { useEffect, useState } from "react";
import { Cpu, Radar } from "lucide-react";

type Target = "sink" | "laya" | "iris" | "notify" | "contain";

interface LogItem {
  id: number;
  kind: "suppress" | "qualify" | "escalate" | "notify" | "contain";
  text: string;
}

const SENSORS = [
  { name: "CrowdStrike Falcon", feed: "EDR telemetry", y: 50, logo: "/logos/crowdstrike.svg", logoW: 22, logoH: 6 },
  { name: "Suricata", feed: "IDS / 10G tap", y: 108, logo: "/logos/suricata.png", logoW: 18, logoH: 18 },
  { name: "Barracuda", feed: "Email & gateway", y: 166, logo: "/logos/barracuda.svg", logoW: 18, logoH: 18 },
  { name: "Sophos", feed: "Endpoint protection", y: 224, logo: "/logos/sophos.svg", logoW: 18, logoH: 18 },
  { name: "Microsoft 365", feed: "Identity & audit", y: 282, logo: "/logos/microsoft-365.svg", logoW: 18, logoH: 18 },
  { name: "Cloudflare WAF", feed: "Edge traffic", y: 340, logo: "/logos/cloudflare.svg", logoW: 18, logoH: 18 },
] as { name: string; feed: string; y: number; logo?: string; logoW?: number; logoH?: number }[];

const ENGINE = { x: 400, y: 195 };
const SINK = { x: 400, y: 372 };
const LAYA = { x: 590, y: 195 };
const SENSOR_X = 120;

const OUTS = [
  { key: "iris", name: "DFIR-IRIS", sub: "True positive, high confidence tickets", y: 78, logo: "/logos/dfir-iris.svg", accent: "#0EA5E9" },
  { key: "analyst", name: "Analysts", sub: "Investigate IRIS tickets", y: 138, accent: "#0284C7" },
  { key: "notify", name: "Discord / Slack", sub: "SOC alert notifications", y: 232, logos: ["/logos/discord.svg", "/logos/slack.svg"], accent: "#6366F1" },
  { key: "contain", name: "FortiGate", sub: "Containment & isolation", y: 330, logo: "/logos/fortinet.svg", accent: "#DC2626" },
] as const;

const OUT_X = 820;

function link(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

const EVENTS: { kind: LogItem["kind"]; text: string; source: number; target: Target }[] = [
  { kind: "suppress", text: "crowdstrike null-host heartbeat dropped", source: 0, target: "sink" },
  { kind: "qualify", text: "qualifying alert forwarded to Laya for triage", source: 1, target: "laya" },
  { kind: "escalate", text: "high-confidence true positive -> IRIS ticket created", source: 1, target: "iris" },
  { kind: "suppress", text: "suricata benign ethertype frame silenced", source: 1, target: "sink" },
  { kind: "notify", text: "Laya alert dispatched to Discord and Slack", source: 2, target: "notify" },
  { kind: "contain", text: "containment sent to FortiGate; endpoint isolated", source: 0, target: "contain" },
  { kind: "suppress", text: "m365 trusted egress login filtered", source: 4, target: "sink" },
  { kind: "qualify", text: "phishing signal qualified -> Laya review", source: 2, target: "laya" },
  { kind: "escalate", text: "confirmed threat -> IRIS case for analyst investigation", source: 3, target: "iris" },
  { kind: "notify", text: "SOC channels notified via Discord and Slack", source: 5, target: "notify" },
];

const SEED: LogItem[] = [
  { id: 0, kind: "escalate", text: "high-confidence true positive -> IRIS ticket created" },
  { id: 1, kind: "qualify", text: "qualifying alert forwarded to Laya for triage" },
  { id: 2, kind: "contain", text: "containment sent to FortiGate; endpoint isolated" },
];

const KIND_META: Record<LogItem["kind"], { label: string; cls: string }> = {
  suppress: { label: "SUPPRESS", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  qualify: { label: "Laya", cls: "text-violet-700 bg-violet-50 border-violet-200" },
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
      }, 760);
    }, 2400);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const layaHot = flash?.target === "laya" || flash?.target === "iris" || flash?.target === "notify" || flash?.target === "contain";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-brand-border">
        <Radar className="h-4 w-4 text-blue-600" />
        <span className="font-mono text-[11px] font-bold tracking-widest text-brand-text-primary">
          DETECTION & RESPONSE ARCHITECTURE
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          LIVE
        </span>
        <span className="ml-auto hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-brand-text-muted">
          <Cpu className="h-3 w-3" /> Wazuh + Laya pipeline
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] min-h-0">
        <div className="relative min-h-[380px]">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 960 420" fill="none" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Detection and response architecture: sensors to Wazuh, qualifying alerts to Laya, high-confidence true positives to IRIS, alerts to Discord and Slack, containment to FortiGate">
            <defs>
              <radialGradient id="engineCore" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </radialGradient>
              <linearGradient id="flowBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.12" />
              </linearGradient>
              <linearGradient id="flowViolet" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.12" />
              </linearGradient>
            </defs>

            <g opacity="0.45">
              <circle cx={ENGINE.x} cy={ENGINE.y} r="110" stroke="#3B82F6" strokeOpacity="0.12" strokeDasharray="2 6" />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="78" stroke="#3B82F6" strokeOpacity="0.18" strokeDasharray="2 6" />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="48" stroke="#3B82F6" strokeOpacity="0.24" strokeDasharray="2 6" />
            </g>

            {/* Sensors -> Wazuh */}
            {SENSORS.map((s, i) => {
              const d = link(SENSOR_X + 18, s.y, ENGINE.x - 24, ENGINE.y);
              const on = flash?.source === i;
              return (
                <g key={`s${i}`}>
                  <path d={d} stroke="#E2E8F0" strokeWidth="1.1" fill="none" />
                  <path d={d} stroke={on ? "#1D4ED8" : "url(#flowBlue)"} strokeWidth={on ? 2.2 : 1.5} strokeDasharray="4 8" fill="none" className="animate-dash-flow" />
                  <circle r="2.4" fill={on ? "#1D4ED8" : "#3B82F6"}>
                    <animateMotion dur={`${1.7 + (i % 3) * 0.3}s`} repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              );
            })}

            {/* Wazuh -> sink */}
            {(() => {
              const d = `M ${ENGINE.x} ${ENGINE.y + 22} C ${ENGINE.x + 26} 300, ${ENGINE.x - 26} 330, ${SINK.x} ${SINK.y - 10}`;
              const on = flash?.target === "sink";
              return (
                <g>
                  <path d={d} stroke="#FDE68A" strokeWidth="1.1" fill="none" />
                  <path d={d} stroke={on ? "#D97706" : "#F59E0B"} strokeWidth={on ? 2.2 : 1.4} strokeDasharray="3 7" fill="none" className="animate-dash-flow-slow" />
                  <circle r="2.2" fill={on ? "#D97706" : "#FBBF24"}>
                    <animateMotion dur="1.9s" repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              );
            })()}

            {/* Wazuh -> Laya (qualifying alerts) */}
            {(() => {
              const d = link(ENGINE.x + 24, ENGINE.y, LAYA.x - 28, LAYA.y);
              return (
                <g>
                  <path d={d} stroke="#DDD6FE" strokeWidth="1.2" fill="none" />
                  <path d={d} stroke={layaHot ? "#7C3AED" : "url(#flowViolet)"} strokeWidth={layaHot ? 2.3 : 1.6} strokeDasharray="4 8" fill="none" className="animate-dash-flow" />
                  <circle r="2.6" fill={layaHot ? "#7C3AED" : "#8B5CF6"}>
                    <animateMotion dur="1.6s" repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              );
            })()}

            {/* Laya -> outputs */}
            {OUTS.map((o) => {
              const startY = o.key === "analyst" ? LAYA.y - 8 : LAYA.y;
              const d = o.key === "analyst"
                ? link(OUT_X - 62, OUTS[0].y + 12, OUT_X - 62, o.y - 10) // IRIS -> analysts short link
                : link(LAYA.x + 28, startY, OUT_X - 78, o.y);
              const on = (o.key === "iris" && flash?.target === "iris") || (o.key === "notify" && flash?.target === "notify") || (o.key === "contain" && flash?.target === "contain");
              if (o.key === "analyst") {
                return (
                  <g key={o.key}>
                    <path d={d} stroke="#E2E8F0" strokeWidth="1.1" fill="none" />
                    <path d={d} stroke={flash?.target === "iris" ? "#0284C7" : "#BAE6FD"} strokeWidth={flash?.target === "iris" ? 2 : 1.3} strokeDasharray="3 6" fill="none" className="animate-dash-flow-slow" />
                  </g>
                );
              }
              return (
                <g key={o.key}>
                  <path d={d} stroke="#E2E8F0" strokeWidth="1.1" fill="none" />
                  <path d={d} stroke={on ? o.accent : o.accent} strokeOpacity={on ? 1 : 0.55} strokeWidth={on ? 2.3 : 1.5} strokeDasharray="4 8" fill="none" className="animate-dash-flow" />
                  <circle r="2.5" fill={o.accent}>
                    <animateMotion dur={o.key === "contain" ? "1.9s" : "1.7s"} repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              );
            })}

            {/* Sensor nodes */}
            {SENSORS.map((s, i) => {
              const on = flash?.source === i;
              const color = SENSOR_COLORS[i] ?? "#3B82F6";
              return (
                <g key={`sn${i}`}>
                  <rect x={SENSOR_X - 14} y={s.y - 13} width="30" height="26" rx="6" fill="#FFFFFF" stroke={on ? color : "#E2E8F0"} strokeWidth={on ? 1.6 : 1} />
                  {s.logo && (
                    <image href={s.logo} x={SENSOR_X - 14 + (30 - (s.logoW ?? 18)) / 2} y={s.y - 13 + (26 - (s.logoH ?? 18)) / 2} width={s.logoW ?? 18} height={s.logoH ?? 18} preserveAspectRatio="xMidYMid meet" />
                  )}
                  <text x={SENSOR_X + 24} y={s.y - 1} fill={on ? "#0F172A" : "#334155"} fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">{s.name}</text>
                  <text x={SENSOR_X + 24} y={s.y + 11} fill="#94A3B8" fontSize="8.5" fontFamily="var(--font-mono)">{s.feed}</text>
                </g>
              );
            })}

            {/* Wazuh engine */}
            <g>
              <circle cx={ENGINE.x} cy={ENGINE.y} r="30" fill="#3B82F6" opacity="0.08" />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="30" fill="none" stroke="#3B82F6" strokeOpacity="0.4" strokeDasharray="3 5" className="animate-radar-sweep" style={{ transformOrigin: `${ENGINE.x}px ${ENGINE.y}px` }} />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="20" fill="url(#engineCore)" />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="20" fill="none" stroke="#93C5FD" strokeOpacity="0.6" />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="20" fill="none" stroke="#3B82F6" strokeWidth="1.4" className="animate-pulse-ring" style={{ transformOrigin: `${ENGINE.x}px ${ENGINE.y}px` }} />
              <image href="/logos/wazuh.svg" x={ENGINE.x - 10} y={ENGINE.y - 10} width="20" height="20" preserveAspectRatio="xMidYMid meet" />
              <text x={ENGINE.x} y={ENGINE.y + 40} fill="#2563EB" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">WAZUH</text>
              <text x={ENGINE.x} y={ENGINE.y + 52} fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">Correlation & suppression</text>
            </g>

            {/* Sink */}
            <g>
              <circle cx={SINK.x} cy={SINK.y} r="14" fill="none" stroke={flash?.target === "sink" ? "#D97706" : "#F59E0B"} strokeOpacity="0.6" strokeDasharray="3 4" />
              <circle cx={SINK.x} cy={SINK.y} r="5" fill="#F59E0B" />
              <text x={SINK.x} y={SINK.y + 26} fill="#64748B" fontSize="9" textAnchor="middle" fontFamily="var(--font-mono)">Level 0 noise sink</text>
            </g>

            {/* Laya */}
            <g>
              <rect x={LAYA.x - 26} y={LAYA.y - 22} width="52" height="44" rx="12" fill={layaHot ? "#F5F3FF" : "#FFFFFF"} stroke={layaHot ? "#8B5CF6" : "#DDD6FE"} strokeWidth={layaHot ? 2 : 1.4} />
              <image href="/logos/laya.svg" x={LAYA.x - 11} y={LAYA.y - 14} width="22" height="22" preserveAspectRatio="xMidYMid meet" />
              <text x={LAYA.x} y={LAYA.y + 36} fill="#6D28D9" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">Laya</text>
              <text x={LAYA.x} y={LAYA.y + 48} fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">Qualifying alert triage</text>
            </g>

            {/* Outputs */}
            {OUTS.map((o) => {
              const on =
                (o.key === "iris" && flash?.target === "iris") ||
                (o.key === "notify" && flash?.target === "notify") ||
                (o.key === "contain" && flash?.target === "contain");

              if (o.key === "analyst") {
                return (
                  <g key={o.key}>
                    <circle cx={OUT_X - 62} cy={o.y} r="13" fill="#E0F2FE" stroke={on ? "#0284C7" : "#7DD3FC"} strokeWidth="1.2" />
                    <text x={OUT_X - 62} y={o.y + 4} fill="#0369A1" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">A</text>
                    <text x={OUT_X - 34} y={o.y - 2} fill="#334155" fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">{o.name}</text>
                    <text x={OUT_X - 34} y={o.y + 10} fill="#94A3B8" fontSize="8.2" fontFamily="var(--font-mono)">{o.sub}</text>
                  </g>
                );
              }

              if (o.key === "notify") {
                const boxW = 52;
                const boxX = OUT_X - 78;
                return (
                  <g key={o.key}>
                    <rect x={boxX} y={o.y - 13} width={boxW} height="26" rx="6" fill="#FFFFFF" stroke={on ? o.accent : "#E2E8F0"} strokeWidth={on ? 1.8 : 1} />
                    <image href={o.logos[0]} x={boxX + 6} y={o.y - 8} width="16" height="16" preserveAspectRatio="xMidYMid meet" />
                    <image href={o.logos[1]} x={boxX + 28} y={o.y - 8} width="16" height="16" preserveAspectRatio="xMidYMid meet" />
                    <text x={boxX + boxW + 10} y={o.y - 1} fill="#334155" fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">{o.name}</text>
                    <text x={boxX + boxW + 10} y={o.y + 11} fill="#94A3B8" fontSize="8.2" fontFamily="var(--font-mono)">{o.sub}</text>
                  </g>
                );
              }

              const boxW = 30;
              const boxX = OUT_X - 78;
              return (
                <g key={o.key}>
                  <rect x={boxX} y={o.y - 13} width={boxW} height="26" rx="6" fill="#FFFFFF" stroke={on ? o.accent : "#E2E8F0"} strokeWidth={on ? 1.8 : 1} />
                  <image href={o.logo} x={boxX + 6} y={o.y - 9} width="18" height="18" preserveAspectRatio="xMidYMid meet" />
                  <text x={boxX + boxW + 10} y={o.y - 1} fill="#334155" fontSize="10.5" fontWeight="600" fontFamily="var(--font-mono)">{o.name}</text>
                  <text x={boxX + boxW + 10} y={o.y + 11} fill="#94A3B8" fontSize="8.2" fontFamily="var(--font-mono)">{o.sub}</text>
                </g>
              );
            })}

            {/* Flow annotations */}
            <text x={(ENGINE.x + LAYA.x) / 2} y={ENGINE.y - 14} fill="#8B5CF6" fontSize="8" textAnchor="middle" fontFamily="var(--font-mono)">qualifying alerts</text>
            <text x={(LAYA.x + OUT_X - 78) / 2 + 10} y={74} fill="#0284C7" fontSize="7.5" textAnchor="middle" fontFamily="var(--font-mono)">high-confidence TP</text>
          </svg>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-brand-border flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border-subtle">
            <span className="font-mono text-[10px] font-bold tracking-widest text-brand-text-secondary">
              EVENT STREAM
            </span>
            <span className="font-mono text-[10px] text-brand-text-muted tabular">
              {count.toLocaleString()}/min
            </span>
          </div>
          <div className="flex-1 overflow-hidden p-3 space-y-1.5">
            {log.map((item) => {
              const m = KIND_META[item.kind];
              return (
                <div key={item.id} className="flex items-center gap-2 rounded-md border border-brand-border bg-brand-surface px-2.5 py-1.5">
                  <span className={`shrink-0 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${m.cls}`}>
                    {m.label}
                  </span>
                  <span className="font-mono text-[11px] text-brand-text-secondary truncate">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

