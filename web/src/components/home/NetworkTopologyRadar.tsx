"use client";

import { useState } from "react";
import { Shield, Server, Activity, Database, Radio, CheckCircle2, Lock, ArrowUpRight } from "lucide-react";

interface SubnetNode {
  id: string;
  name: string;
  subnet: string;
  role: string;
  status: "active" | "tuning" | "secured";
  x: number;
  y: number;
  icon: any;
  eventsPerSec: string;
  description: string;
}

const NODES: SubnetNode[] = [
  {
    id: "edge-sensors",
    name: "Perimeter Sensor Grid",
    subnet: "10.240.2.0/24",
    role: "Suricata DPI + CrowdStrike",
    status: "active",
    x: 80,
    y: 120,
    icon: Radio,
    eventsPerSec: "14,280/day",
    description: "Captures raw wire traffic, QinQ frames, and endpoint sensor keepalives.",
  },
  {
    id: "siem-core",
    name: "Wazuh SIEM Engine",
    subnet: "10.240.1.10",
    role: "Rule Hierarchy & Decoders",
    status: "tuning",
    x: 270,
    y: 70,
    icon: Server,
    eventsPerSec: "14,096 dropped",
    description: "Evaluates suppression rules (100010, 86611, 91578). Drops 98.7% noise.",
  },
  {
    id: "middleware",
    name: "Custom IRIS Enricher",
    subnet: "10.240.1.12",
    role: "Python 4000-Char Transport",
    status: "active",
    x: 440,
    y: 130,
    icon: Activity,
    eventsPerSec: "184 passed",
    description: "Solves payload truncation. Injects GeoIP and MITRE ATT&CK taxonomy.",
  },
  {
    id: "iris-soar",
    name: "DFIR-IRIS SOAR Platform",
    subnet: "10.240.1.15",
    role: "Case Lifecycle & SLA",
    status: "secured",
    x: 620,
    y: 70,
    icon: Database,
    eventsPerSec: "67 true cases",
    description: "Automated alert ticketing with dynamic SLA gating and analyst tracking.",
  },
  {
    id: "proxy-pool",
    name: "Corporate Egress Proxies",
    subnet: "198.51.100.0/24",
    role: "Sanctioned Exit Gateways",
    status: "secured",
    x: 270,
    y: 220,
    icon: Lock,
    eventsPerSec: "2,980 logins",
    description: "Corporate IP egress nodes whitelisted in Rule 91578 to stop false O365 alerts.",
  },
  {
    id: "workbench",
    name: "Analyst Triage HUD",
    subnet: "10.240.10.0/24",
    role: "Tier-2 Operations Center",
    status: "active",
    x: 620,
    y: 220,
    icon: Shield,
    eventsPerSec: "MTTR: 8 mins",
    description: "Live triage console for investigating and resolving verified attacks.",
  },
];

export function NetworkTopologyRadar() {
  const [selectedNode, setSelectedNode] = useState<SubnetNode>(NODES[1]);

  return (
    <div className="relative rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 shadow-xs">
            <Radio className="h-4 w-4 animate-pulse text-blue-600" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              LIVE NETWORK TOPOLOGY & ENRICHMENT MESH
              <span className="inline-flex items-center gap-1 text-[10px] font-sans px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                ACTIVE MESH
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Interactive data fabric showing packet progression from perimeter sensors to IRIS cases
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>RFC 1918 / 5737 ENFORCED</span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative my-4 w-full h-[280px] sm:h-[300px] bg-slate-50/70 rounded-xl border border-slate-200/60 overflow-hidden">
        {/* Subtle Radar Concentric Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="w-64 h-64 rounded-full border border-dashed border-slate-300" />
          <div className="w-40 h-40 rounded-full border border-slate-200 absolute" />
          <div className="w-20 h-20 rounded-full border border-blue-200/60 absolute" />
        </div>

        <svg className="w-full h-full" viewBox="0 0 720 280" fill="none">
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="dropGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Connection Lines */}
          {/* Edge Sensors -> SIEM Core */}
          <path d="M 120 120 C 180 120, 210 70, 270 70" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
          {/* SIEM Core -> Middleware Enricher */}
          <path d="M 310 70 C 370 70, 390 130, 440 130" stroke="url(#flowGradient)" strokeWidth="2.5" />
          {/* Middleware -> IRIS SOAR */}
          <path d="M 480 130 C 530 130, 560 70, 620 70" stroke="url(#flowGradient)" strokeWidth="2.5" />
          {/* SIEM Core -> Egress Proxy */}
          <path d="M 270 90 L 270 200" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="3 3" />
          {/* IRIS SOAR -> Workbench */}
          <path d="M 620 90 L 620 200" stroke="#10B981" strokeWidth="2" />
          {/* Egress Proxy -> Middleware */}
          <path d="M 310 220 C 380 220, 390 150, 440 130" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Moving Telemetry Pulses */}
          <circle cx="200" cy="95" r="4" fill="#3B82F6">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="370" cy="100" r="4.5" fill="#10B981">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="550" cy="100" r="4" fill="#0EA5E9">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.2s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Interactive Node Anchors */}
        {NODES.map((node) => {
          const isSelected = selectedNode.id === node.id;
          const Icon = node.icon;
          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              style={{ left: `${(node.x / 720) * 100}%`, top: `${(node.y / 280) * 100}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-200 flex items-center gap-2.5 z-20 ${
                isSelected
                  ? "bg-white border-2 border-blue-600 shadow-lg scale-105 ring-4 ring-blue-500/15"
                  : "bg-white/95 border border-slate-200/90 shadow-sm hover:border-slate-300 hover:scale-102"
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  node.status === "active"
                    ? "bg-blue-50 text-blue-600"
                    : node.status === "tuning"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-left hidden sm:block pr-1">
                <div className="text-[11px] font-bold text-slate-800 leading-tight">
                  {node.name}
                </div>
                <div className="font-mono text-[9px] text-slate-500">
                  {node.subnet}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Node Details Card */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
            {selectedNode && <selectedNode.icon className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{selectedNode.name}</span>
              <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                {selectedNode.subnet}
              </span>
              <span className="text-xs text-slate-500">• {selectedNode.role}</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">{selectedNode.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase">Telemetry Rate</span>
            <span className="font-bold text-slate-900">{selectedNode.eventsPerSec}</span>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>OPERATIONAL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
