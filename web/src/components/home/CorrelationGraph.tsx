"use client";

import { useEffect, useState } from "react";
import { Cpu, Radar } from "lucide-react";

type Target = "sink" | "iris";

interface LogItem {
  id: number;
  kind: "suppress" | "correlate" | "escalate";
  text: string;
}

const SENSORS = [
  { name: "Suricata", feed: "IDS / 10G tap", y: 56, logo: "/logos/suricata.png", logoW: 18, logoH: 18 },
  { name: "CrowdStrike", feed: "Falcon EDR", y: 128, logo: "/logos/crowdstrike.svg", logoW: 22, logoH: 6 },
  { name: "Cloudflare WAF", feed: "Edge logpush", y: 200 },
  { name: "Barracuda FW", feed: "Gateway syslog", y: 272 },
  { name: "O365 Egress", feed: "Proxy auth", y: 344 },
] as { name: string; feed: string; y: number; logo?: string; logoW?: number; logoH?: number }[];

const ENGINE = { x: 450, y: 200 };
const SINK = { x: 450, y: 382 };
const SENSOR_X = 150;

const RIGHT = [
  { name: "DFIR-IRIS SOAR", y: 130, type: "iris" as const },
  { name: "Analyst T1", y: 252, type: "analyst" as const },
  { name: "Analyst T2", y: 344, type: "analyst" as const },
];

function link(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

const EVENTS: { kind: LogItem["kind"]; text: string; source: number; target: Target }[] = [
  { kind: "suppress", text: "crowdstrike null-host heartbeat dropped", source: 1, target: "sink" },
  { kind: "correlate", text: "185.220.101.34 + 45.155.205.99 -> CINS / DROP", source: 0, target: "iris" },
  { kind: "suppress", text: "suricata qinq ethertype frame silenced", source: 0, target: "sink" },
  { kind: "escalate", text: "mimikatz lateral movement detected (L12)", source: 1, target: "iris" },
  { kind: "suppress", text: "cloudflare synthetic probe filtered", source: 2, target: "sink" },
  { kind: "correlate", text: "GPL Apache RCE CVE-2021-41773 (L10)", source: 2, target: "iris" },
  { kind: "suppress", text: "o365 corporate egress login whitelisted", source: 4, target: "sink" },
  { kind: "escalate", text: "credential stuffing from untrusted ASN (L10)", source: 4, target: "iris" },
];

const SEED: LogItem[] = [
  { id: 0, kind: "correlate", text: "185.220.101.34 + 45.155.205.99 -> CINS / DROP" },
  { id: 1, kind: "suppress", text: "crowdstrike null-host heartbeat dropped" },
  { id: 2, kind: "escalate", text: "mimikatz lateral movement detected (L12)" },
];

const KIND_META: Record<LogItem["kind"], { label: string; cls: string }> = {
  suppress: { label: "SUPPRESS", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  correlate: { label: "CORRELATE", cls: "text-blue-700 bg-blue-50 border-blue-200" },
  escalate: { label: "ESCALATE", cls: "text-rose-700 bg-rose-50 border-rose-200" },
};

const SENSOR_COLORS = ["#F97316", "#FC0000", "#3B82F6", "#0EA5E9", "#6366F1"];

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
      }, 720);
    }, 2400);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-brand-border">
        <Radar className="h-4 w-4 text-blue-600" />
        <span className="font-mono text-[11px] font-bold tracking-widest text-brand-text-primary">
          LIVE THREAT CORRELATION
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          ACTIVE
        </span>
        <span className="ml-auto hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-brand-text-muted">
          <Cpu className="h-3 w-3" /> analysisd 0.9ms
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] min-h-0">
        <div className="relative min-h-[360px]">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 900 420" fill="none" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Live threat correlation graph">
            <defs>
              <radialGradient id="engineCore" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </radialGradient>
              <linearGradient id="flowCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="flowEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#10B981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            <g opacity="0.5">
              <circle cx={ENGINE.x} cy={ENGINE.y} r="120" stroke="#3B82F6" strokeOpacity="0.12" strokeDasharray="2 6" />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="90" stroke="#3B82F6" strokeOpacity="0.16" strokeDasharray="2 6" />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="60" stroke="#3B82F6" strokeOpacity="0.22" strokeDasharray="2 6" />
            </g>

            {SENSORS.map((s, i) => {
              const d = link(SENSOR_X, s.y, ENGINE.x, ENGINE.y);
              const on = flash?.source === i;
              return (
                <g key={`s${i}`}>
                  <path d={d} stroke="#E2E8F0" strokeWidth="1.2" fill="none" />
                  <path
                    d={d}
                    stroke={on ? "#1D4ED8" : "url(#flowCyan)"}
                    strokeWidth={on ? 2.4 : 1.6}
                    strokeDasharray="4 8"
                    fill="none"
                    style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease" }}
                    className="animate-dash-flow"
                  />
                  <circle r="2.6" fill={on ? "#1D4ED8" : "#3B82F6"}>
                    <animateMotion dur={`${1.6 + (i % 3) * 0.35}s`} repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              );
            })}

            {(() => {
              const d = `M ${ENGINE.x} ${ENGINE.y} C ${ENGINE.x + 30} 300, ${ENGINE.x - 30} 330, ${SINK.x} ${SINK.y}`;
              const on = flash?.target === "sink";
              return (
                <g>
                  <path d={d} stroke="#E2E8F0" strokeWidth="1.2" fill="none" />
                  <path
                    d={d}
                    stroke={on ? "#D97706" : "#F59E0B"}
                    strokeWidth={on ? 2.4 : 1.5}
                    strokeDasharray="3 7"
                    fill="none"
                    style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease" }}
                    className="animate-dash-flow-slow"
                  />
                  <circle r="2.4" fill={on ? "#D97706" : "#FBBF24"}>
                    <animateMotion dur="1.9s" repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              );
            })()}

            {RIGHT.map((r, i) => {
              const d = link(ENGINE.x, ENGINE.y, 770, r.y);
              const on = flash?.target === "iris" && r.type === "iris";
              return (
                <g key={`r${i}`}>
                  <path d={d} stroke="#E2E8F0" strokeWidth="1.2" fill="none" />
                  <path
                    d={d}
                    stroke={on ? "#059669" : r.type === "iris" ? "url(#flowEmerald)" : "#0EA5E9"}
                    strokeWidth={on ? 2.4 : 1.6}
                    strokeDasharray="4 8"
                    fill="none"
                    style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease" }}
                    className="animate-dash-flow"
                  />
                  <circle r="2.6" fill={r.type === "iris" ? "#10B981" : "#38BDF8"}>
                    <animateMotion dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              );
            })}

            {SENSORS.map((s, i) => {
              const on = flash?.source === i;
              const color = SENSOR_COLORS[i] ?? "#3B82F6";
              const textX = s.logo ? SENSOR_X + 32 : SENSOR_X + 14;
              return (
                <g key={`sn${i}`}>
                  {s.logo ? (
                    <>
                      <rect x={SENSOR_X - 8} y={s.y - 13} width="30" height="26" rx="6" fill="#FFFFFF" stroke={on ? color : "#E2E8F0"} strokeWidth={on ? 1.5 : 1} />
                      <image
                        href={s.logo}
                        x={SENSOR_X - 8 + (30 - (s.logoW ?? 18)) / 2}
                        y={s.y - 13 + (26 - (s.logoH ?? 18)) / 2}
                        width={s.logoW ?? 18}
                        height={s.logoH ?? 18}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    </>
                  ) : (
                    <>
                      <rect x={SENSOR_X - 5} y={s.y - 5} width="10" height="10" rx="2" fill={on ? color : color} fillOpacity={on ? 1 : 0.85} />
                      <rect x={SENSOR_X - 5} y={s.y - 5} width="10" height="10" rx="2" fill="none" stroke={color} strokeOpacity="0.4" />
                    </>
                  )}
                  <text x={textX} y={s.y - 1} fill={on ? "#0F172A" : "#334155"} fontSize="11" fontWeight={s.logo ? "600" : "500"} fontFamily="var(--font-mono)">
                    {s.name}
                  </text>
                  <text x={textX} y={s.y + 11} fill="#94A3B8" fontSize="9" fontFamily="var(--font-mono)">
                    {s.feed}
                  </text>
                </g>
              );
            })}

            <g>
              <circle cx={ENGINE.x} cy={ENGINE.y} r="34" fill="#3B82F6" opacity="0.08" />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="34" fill="none" stroke="#3B82F6" strokeOpacity="0.4" strokeDasharray="3 5" className="animate-radar-sweep" style={{ transformOrigin: `${ENGINE.x}px ${ENGINE.y}px` }} />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="22" fill="url(#engineCore)" />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="22" fill="none" stroke="#93C5FD" strokeOpacity="0.6" />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="22" fill="none" stroke="#3B82F6" strokeWidth="1.5" className="animate-pulse-ring" style={{ transformOrigin: `${ENGINE.x}px ${ENGINE.y}px` }} />
              <circle cx={ENGINE.x} cy={ENGINE.y} r="22" fill="none" stroke="#3B82F6" strokeWidth="1.5" className="animate-pulse-ring-fast" style={{ transformOrigin: `${ENGINE.x}px ${ENGINE.y}px` }} />
              <image href="/logos/wazuh.svg" x={ENGINE.x - 11} y={ENGINE.y - 11} width="22" height="22" preserveAspectRatio="xMidYMid meet" />
              <text x={ENGINE.x} y={ENGINE.y + 46} fill="#2563EB" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
                WAZUH
              </text>
              <text x={ENGINE.x} y={ENGINE.y + 59} fill="#64748B" fontSize="8.5" textAnchor="middle" fontFamily="var(--font-mono)">
                Correlation Engine
              </text>
            </g>

            <g>
              <circle cx={SINK.x} cy={SINK.y} r="16" fill="none" stroke={flash?.target === "sink" ? "#D97706" : "#F59E0B"} strokeOpacity="0.6" strokeDasharray="3 4" />
              <circle cx={SINK.x} cy={SINK.y} r="6" fill="#F59E0B" />
              <text x={SINK.x} y={SINK.y + 30} fill="#64748B" fontSize="10" textAnchor="middle" fontFamily="var(--font-mono)">
                LEVEL 0 SINK
              </text>
            </g>

            {RIGHT.map((r) => {
              const on = r.type === "iris" && flash?.target === "iris";
              return (
                <g key={`rn${r.name}`}>
                  <circle cx="770" cy={r.y} r="14" fill={r.type === "iris" ? "#D1FAE5" : "#E0F2FE"} />
                  <circle cx="770" cy={r.y} r="14" fill="none" stroke={r.type === "iris" ? (on ? "#059669" : "#10B981") : "#0EA5E9"} strokeOpacity={on ? 1 : 0.6} />
                  <text x="770" y={r.y + 4} fill={r.type === "iris" ? "#059669" : "#0284C7"} fontSize="11" textAnchor="middle" fontWeight="700" fontFamily="var(--font-mono)">
                    {r.type === "iris" ? "IR" : "A"}
                  </text>
                  <text x="770" y={r.y + 28} fill="#64748B" fontSize="9.5" textAnchor="middle" fontFamily="var(--font-mono)">
                    {r.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-brand-border flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border-subtle">
            <span className="font-mono text-[10px] font-bold tracking-widest text-brand-text-secondary">
              STREAM
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
