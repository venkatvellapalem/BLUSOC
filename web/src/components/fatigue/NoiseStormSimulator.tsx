"use client";

import React, { useState, useEffect, useRef } from "react";
import { Shield, AlertTriangle, Zap, Activity, CheckCircle2, RotateCcw } from "lucide-react";

interface Particle {
  id: number;
  x: number;
  y: number;
  speed: number;
  isNoise: boolean; // true = false positive noise, false = real attack
  type: string;
  status: "approaching" | "suppressed" | "passed";
}

interface NoiseStormSimulatorProps {
  isTuned: boolean;
  suppressionRatio: number;
}

export function NoiseStormSimulator({ isTuned, suppressionRatio }: NoiseStormSimulatorProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stats, setStats] = useState({ absorbed: 0, passed: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const nextId = useRef(1);

  // Particle spawn and update loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      // Spawn new telemetry particles
      const isNoise = Math.random() < (isTuned ? 0.95 : 0.85);
      const types = isNoise
        ? ["CS Null Host", "Suricata QinQ", "O365 Proxy", "Cloudflare Health"]
        : ["GPL RCE", "ET CINS Blocklist", "Mimikatz Dump", "WAF SQLi"];
      const chosenType = types[Math.floor(Math.random() * types.length)];

      const newParticle: Particle = {
        id: nextId.current++,
        x: 0,
        y: 30 + Math.random() * 140,
        speed: 1.5 + Math.random() * 2,
        isNoise,
        type: chosenType,
        status: "approaching",
      };

      setParticles((prev) => {
        // Keep max 40 particles for smooth 60fps performance
        const updated = prev
          .map((p) => {
            const nextX = p.x + p.speed * 4;

            // Shield is at x = 240
            if (p.x < 240 && nextX >= 240) {
              if (p.isNoise && isTuned) {
                // Suppressed by the rule matrix!
                setStats((s) => ({ ...s, absorbed: s.absorbed + 1 }));
                return { ...p, x: nextX, status: "suppressed" as const };
              } else {
                // Passed through
                setStats((s) => ({ ...s, passed: s.passed + 1 }));
                return { ...p, x: nextX, status: "passed" as const };
              }
            }

            return { ...p, x: nextX };
          })
          .filter((p) => p.x < 520 && (p.status !== "suppressed" || p.x < 290));

        return [...updated.slice(-35), newParticle];
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isTuned, isPaused]);

  const handleReset = () => {
    setParticles([]);
    setStats({ absorbed: 0, passed: 0 });
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-xs">
            <Zap className="h-4 w-4 animate-pulse text-indigo-600" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              REAL-TIME NOISE DEFLECTION &amp; FILTER SIMULATOR
              <span className={`text-[10px] font-sans px-2 py-0.5 rounded-full font-bold border ${
                isTuned
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {isTuned ? "SHIELD ACTIVE" : "SHIELD OFFLINE"}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Live particle visualizer demonstrating the Wazuh Level-0 suppression barrier in action
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RotateCcw className="h-3 w-3 text-slate-400" />
            <span>Reset Counts</span>
          </button>
        </div>
      </div>

      {/* Interactive Canvas */}
      <div className="relative my-4 w-full h-[220px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        {/* Technical Grid Background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Ingress Stream Zone Label (Left) */}
        <div className="absolute top-3 left-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
          Raw Sensor Telemetry
        </div>

        {/* Shield Barrier Indicator (Center at x = 240 / ~46%) */}
        <div
          className={`absolute top-0 bottom-0 w-2.5 -translate-x-1/2 transition-colors duration-500 flex flex-col items-center justify-between py-2 z-10 ${
            isTuned
              ? "bg-gradient-to-b from-emerald-500/80 via-emerald-400 to-emerald-500/80 shadow-[0_0_20px_#10b981]"
              : "bg-gradient-to-b from-rose-500/40 via-rose-500/20 to-rose-500/40 border-l border-r border-dashed border-rose-500/50"
          }`}
          style={{ left: "46%" }}
        >
          <div className="p-1 rounded-full bg-slate-900 text-white border border-slate-700 shadow-xs">
            <Shield className={`h-3.5 w-3.5 ${isTuned ? "text-emerald-400" : "text-rose-400"}`} />
          </div>
          <span className="text-[9px] font-mono font-extrabold text-white rotate-90 whitespace-nowrap tracking-wider">
            {isTuned ? "LEVEL 0 SHIELD" : "UNFILTERED"}
          </span>
          <div className="h-2 w-2 rounded-full bg-white opacity-60" />
        </div>

        {/* Actionable Incident Egress (Right) */}
        <div className="absolute top-3 right-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          DFIR-IRIS SOAR Egress
        </div>

        {/* Render Moving Particles */}
        {particles.map((p) => {
          const isAtShield = Math.abs(p.x - 240) < 15;
          return (
            <div
              key={p.id}
              style={{
                left: `${(p.x / 520) * 100}%`,
                top: `${p.y}px`,
                opacity: p.status === "suppressed" ? 0.35 : 1,
                transform: p.status === "suppressed" ? "scale(0.7) translateY(8px)" : "scale(1)",
                transition: "transform 0.2s ease-out, opacity 0.2s ease-out",
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1"
            >
              <div
                className={`h-3 w-3 rounded-full flex items-center justify-center text-[8px] font-bold shadow-xs ${
                  p.isNoise
                    ? "bg-slate-400 text-slate-900 ring-2 ring-slate-500/40"
                    : "bg-rose-500 text-white ring-4 ring-rose-500/50 animate-pulse"
                }`}
              />
              <span
                className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded backdrop-blur-xs whitespace-nowrap ${
                  p.isNoise
                    ? "bg-slate-800/80 text-slate-300"
                    : "bg-rose-950/90 text-rose-200 border border-rose-500/40"
                }`}
              >
                {p.type}
              </span>
            </div>
          );
        })}
      </div>

      {/* Telemetry Counter Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[10px] text-slate-500 block uppercase">Noisy Events Deflected</span>
          <span className="text-lg font-bold font-mono text-emerald-600">
            {stats.absorbed.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Vaporized at Wazuh L0</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[10px] text-slate-500 block uppercase">True Incidents Forwarded</span>
          <span className="text-lg font-bold font-mono text-rose-600">
            {stats.passed.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">High-fidelity IRIS tickets</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[10px] text-slate-500 block uppercase">Noise Elimination</span>
          <span className="text-lg font-bold font-mono text-blue-600">
            {isTuned ? "87.1%" : "0.0%"}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Active suppression</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <span className="text-[10px] text-slate-500 block uppercase">Analyst Focus Ratio</span>
          <span className="text-lg font-bold font-mono text-indigo-600">
            {isTuned ? "48 : 1" : "1 : 77"}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Signal vs Noise</span>
        </div>
      </div>
    </div>
  );
}
