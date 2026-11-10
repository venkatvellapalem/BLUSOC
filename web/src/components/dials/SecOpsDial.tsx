"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface SecOpsDialProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  sublabel?: string;
  size?: number;
  dangerZoneStart?: number;
  warningZoneStart?: number;
  formatValue?: (v: number) => string;
  interactive?: boolean;
  onChange?: (v: number) => void;
}

export function SecOpsDial({
  value,
  min,
  max,
  label,
  unit,
  sublabel,
  size = 200,
  dangerZoneStart,
  warningZoneStart,
  formatValue = (v) => v.toLocaleString(),
  interactive = false,
  onChange,
}: SecOpsDialProps) {
  // Arc angle spans from -135deg (min) to +135deg (max), total 270 degrees
  const startAngle = -135;
  const endAngle = 135;
  const totalSweep = endAngle - startAngle;

  // Clamped normalized progress (0 to 1)
  const clampedVal = Math.min(Math.max(value, min), max);
  const normalized = (clampedVal - min) / (max - min || 1);
  const needleAngle = startAngle + normalized * totalSweep;

  // Generate tick marks (major every 10%, minor every 2%)
  const ticks = useMemo(() => {
    const list = [];
    const count = 25; // 25 tick intervals
    for (let i = 0; i <= count; i++) {
      const frac = i / count;
      const angle = startAngle + frac * totalSweep;
      const isMajor = i % 5 === 0;
      const rad = (angle - 90) * (Math.PI / 180);

      const rOuter = 78;
      const rInner = isMajor ? 66 : 72;

      const x1 = 100 + rOuter * Math.cos(rad);
      const y1 = 100 + rOuter * Math.sin(rad);
      const x2 = 100 + rInner * Math.cos(rad);
      const y2 = 100 + rInner * Math.sin(rad);

      // Value label for major ticks
      const valAtTick = Math.round(min + frac * (max - min));
      const rText = 56;
      const xt = 100 + rText * Math.cos(rad);
      const yt = 100 + rText * Math.sin(rad) + 3;

      list.push({
        isMajor,
        x1,
        y1,
        x2,
        y2,
        valText: isMajor ? (valAtTick >= 1000 ? `${(valAtTick / 1000).toFixed(0)}k` : `${valAtTick}`) : null,
        xt,
        yt,
      });
    }
    return list;
  }, [min, max, startAngle, totalSweep]);

  return (
    <div
      style={{ width: size, height: size }}
      className="relative select-none flex flex-col items-center justify-center p-2"
    >
      {/* Outer Beveled Metallic Ring */}
      <div className="absolute inset-1 rounded-full bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 p-1 shadow-[0_4px_16px_rgba(15,23,42,0.08),inset_0_1px_2px_rgba(255,255,255,0.9)]">
        {/* Dial Face Inner Disc */}
        <div className="w-full h-full rounded-full bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 shadow-[inset_0_2px_6px_rgba(15,23,42,0.06)] relative overflow-hidden flex items-center justify-center">
          {/* Subtle Dial Surface Radial Lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.8),transparent_60%)]" />

          {/* SVG Dial Elements */}
          <svg className="w-full h-full relative z-10" viewBox="0 0 200 200">
            <defs>
              <filter id="needle-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
              </filter>
              <linearGradient id="meter-arc-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="55%" stopColor="#3B82F6" />
                <stop offset="80%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>

            {/* Background Track Arc */}
            <path
              d="M 37.6 156.6 A 84 84 0 1 1 162.4 156.6"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Active Colored Arc */}
            <path
              d="M 37.6 156.6 A 84 84 0 1 1 162.4 156.6"
              fill="none"
              stroke="url(#meter-arc-gradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="395"
              strokeDashoffset={395 - normalized * 395}
              className="transition-all duration-500 ease-out"
            />

            {/* Calibrated Tick Marks */}
            {ticks.map((t, i) => (
              <g key={i}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.isMajor ? "#334155" : "#94A3B8"}
                  strokeWidth={t.isMajor ? 1.8 : 1}
                  strokeLinecap="round"
                />
                {t.valText && (
                  <text
                    x={t.xt}
                    y={t.yt}
                    textAnchor="middle"
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="600"
                    fill="#64748B"
                  >
                    {t.valText}
                  </text>
                )}
              </g>
            ))}

            {/* Central Dial Readout Screen */}
            <g transform="translate(100, 135)">
              <rect
                x="-36"
                y="-15"
                width="72"
                height="24"
                rx="4"
                fill="#F8FAFC"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
              <text
                x="0"
                y="0"
                textAnchor="middle"
                fontSize="11"
                fontWeight="800"
                fontFamily="monospace"
                fill="#0F172A"
                className="tabular-nums"
              >
                {formatValue(clampedVal)}
              </text>
              <text
                x="0"
                y="6"
                textAnchor="middle"
                fontSize="6"
                fontWeight="600"
                fontFamily="monospace"
                fill="#64748B"
              >
                {unit}
              </text>
            </g>

            {/* Physical Mechanical Needle */}
            <g
              transform={`translate(100, 100) rotate(${needleAngle})`}
              filter="url(#needle-shadow)"
              className="transition-transform duration-500 ease-out"
            >
              {/* Needle Tip (Tapered) */}
              <polygon points="0,-82 2.5,-6 3.5,12 -3.5,12 -2.5,-6" fill="#DC2626" />
              {/* Highlight Ridge along needle */}
              <line x1="0" y1="-80" x2="0" y2="10" stroke="#EF4444" strokeWidth="0.8" />
              {/* Counterweight Tail */}
              <circle cx="0" cy="12" r="5" fill="#991B1B" />
            </g>

            {/* Center Pivot Bevel Cap */}
            <circle cx="100" cy="100" r="8" fill="#1E293B" stroke="#CBD5E1" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="3.5" fill="#94A3B8" />
          </svg>
        </div>
      </div>

      {/* Dial Title and Sublabel */}
      <div className="absolute -bottom-1 text-center w-full pointer-events-none">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-800 block truncate">
          {label}
        </span>
        {sublabel && (
          <span className="text-[9px] font-mono text-slate-500 block -mt-0.5 truncate">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
