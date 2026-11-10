"use client";

import React, { useState } from "react";
import { SecOpsDial } from "./SecOpsDial";
import { Sliders, RotateCcw, Shield, AlertTriangle, Zap, CheckCircle2 } from "lucide-react";

interface SecOpsInstrumentClusterProps {
  onTuningChange?: (isTuned: boolean) => void;
}

export function SecOpsInstrumentCluster({ onTuningChange }: SecOpsInstrumentClusterProps) {
  const [isTuned, setIsTuned] = useState(true);

  const handleToggle = (val: boolean) => {
    setIsTuned(val);
    if (onTuningChange) onTuningChange(val);
  };

  // Values based on active tuning state
  const epsValue = isTuned ? 184 : 14280;
  const suppressionRatio = isTuned ? 87.1 : 0.0;
  const mttrValue = isTuned ? 8 : 42;
  const threatCount = 67;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md overflow-hidden">
      {/* Cluster Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 uppercase tracking-widest">
              INSTRUMENT CLUSTER • CALIBRATED SEC-OPS GAUGES
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
              SAMPLE RATE: 100ms
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Real-Time Telemetry Dials &amp; Pressure Metrics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Analog gauge instrumentation measuring perimeter wire ingress, filter efficiency, and incident response velocity
          </p>
        </div>

        {/* Physical Master Rheostat / Mode Switch */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => handleToggle(false)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              !isTuned
                ? "bg-white text-rose-700 shadow-sm border border-rose-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${!isTuned ? "text-rose-600" : "text-slate-400"}`} />
            <span>RAW FLOOD (0%)</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggle(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              isTuned
                ? "bg-white text-emerald-800 shadow-sm border border-emerald-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield className={`h-3.5 w-3.5 ${isTuned ? "text-emerald-600" : "text-slate-400"}`} />
            <span>TUNED SHIELD (87.1%)</span>
          </button>
        </div>
      </div>

      {/* The 4 Physical Dial Meters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-8 justify-items-center">
        {/* Dial 1: Ingestion Pressure */}
        <div className="flex flex-col items-center">
          <SecOpsDial
            value={epsValue}
            min={0}
            max={15000}
            label="Ingestion Pressure"
            unit="EPS"
            sublabel={isTuned ? "184 Clean Incidents" : "14.2k Unfiltered Noise"}
            size={185}
          />
        </div>

        {/* Dial 2: Noise Deflection Ratio */}
        <div className="flex flex-col items-center">
          <SecOpsDial
            value={suppressionRatio}
            min={0}
            max={100}
            label="Suppression Ratio"
            unit="%"
            sublabel={isTuned ? "87.1% Noise Eliminated" : "0% Filter Inactive"}
            formatValue={(v) => `${v.toFixed(1)}%`}
            size={185}
          />
        </div>

        {/* Dial 3: Response Latency (MTTR) */}
        <div className="flex flex-col items-center">
          <SecOpsDial
            value={mttrValue}
            min={0}
            max={60}
            label="Mean Time To Respond"
            unit="MINS"
            sublabel={isTuned ? "8 min Rapid Triage" : "42 min Severe Backlog"}
            formatValue={(v) => `${v}m`}
            size={185}
          />
        </div>

        {/* Dial 4: Confirmed Threat Velocity */}
        <div className="flex flex-col items-center">
          <SecOpsDial
            value={threatCount}
            min={0}
            max={100}
            label="Confirmed Threat IOCs"
            unit="INCIDENTS"
            sublabel="67 High-Fidelity Attacks"
            size={185}
          />
        </div>
      </div>

      {/* Calibration Footer Note */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-slate-100 text-xs font-mono text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Needle physics: Damped ballistic galvanometer spring simulation</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Wazuh integratord FIFO: 0 overflow</span>
          <span>•</span>
          <span>DFIR-IRIS Rest API: 200 OK</span>
        </div>
      </div>
    </div>
  );
}
