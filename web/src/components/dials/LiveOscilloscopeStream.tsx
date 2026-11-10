"use client";

import React, { useEffect, useRef, useState } from "react";
import { Activity, Radio, Zap, Shield, Play, Pause, RotateCcw } from "lucide-react";

interface StreamLog {
  id: string;
  time: string;
  src: string;
  dest: string;
  event: string;
  rule: string;
  action: "DROPPED" | "FORWARDED" | "ESCALATED";
  severity: "L0" | "L5" | "L8" | "L10" | "L12";
}

const SAMPLE_LOGS: StreamLog[] = [
  { id: "1", time: "19:54:02.148", src: "198.51.100.14:52110", dest: "blusoc.internal:443", event: "O365 MailItemsAccessed Egress Proxy Login", rule: "91578", action: "DROPPED", severity: "L0" },
  { id: "2", time: "19:54:02.320", src: "10.240.2.14:0", dest: "siem-core-01:1514", event: "Suricata non-routable QinQ framing anomaly", rule: "86611", action: "DROPPED", severity: "L0" },
  { id: "3", time: "19:54:02.580", src: "10.240.10.45:-", dest: "siem-core-01:1514", event: "CrowdStrike null hostname registration flood", rule: "100010", action: "DROPPED", severity: "L0" },
  { id: "4", time: "19:54:02.812", src: "198.2.182.195:6514", dest: "corp-gateway-01:6514", event: "Barracuda ESG cluster heartbeat keepalive", rule: "100700", action: "DROPPED", severity: "L0" },
  { id: "5", time: "19:54:03.110", src: "185.220.101.4:49812", dest: "siem-core-01:20443", event: "ET DROP Dshield Block Listed Source connection", rule: "86601", action: "ESCALATED", severity: "L10" },
  { id: "6", time: "19:54:03.440", src: "192.42.116.16:51299", dest: "edge-fw-01:443", event: "GPL ATTACK_RESPONSE Apache Struts RCE payload", rule: "100400", action: "ESCALATED", severity: "L12" },
  { id: "7", time: "19:54:03.890", src: "104.28.14.8:443", dest: "soar-iris-01:443", event: "Cloudflare synthetic origin health check probe", rule: "100550", action: "DROPPED", severity: "L0" },
];

export function LiveOscilloscopeStream({ isSuppressionActive = true }: { isSuppressionActive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [logs, setLogs] = useState<StreamLog[]>(SAMPLE_LOGS);
  const [isStreaming, setIsStreaming] = useState(true);
  const [epsRate, setEpsRate] = useState(isSuppressionActive ? 184 : 14280);

  // Oscilloscope waveform rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear with soft oscilloscope background
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(0, 0, width, height);

      // Grid Lines (every 20px)
      ctx.strokeStyle = "#E2E8F0";
      ctx.lineWidth = 0.8;
      for (let x = 0; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Center Reference Axis
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw Oscilloscope Signal Waveform
      ctx.lineWidth = 2;
      ctx.beginPath();

      const centerY = height / 2;
      const baseAmplitude = isSuppressionActive ? 12 : 38; // high amplitude noise if unfiltered
      const frequency = isSuppressionActive ? 0.04 : 0.09;

      ctx.strokeStyle = isSuppressionActive ? "#059669" : "#DC2626";

      for (let x = 0; x < width; x++) {
        // Combined harmonics + occasional threat burst spike
        const spike = !isSuppressionActive && (x + offset * 2) % 180 < 15 ? 28 : 0;
        const wave =
          Math.sin((x + offset) * frequency) * baseAmplitude +
          Math.cos((x + offset * 0.5) * 0.02) * (baseAmplitude * 0.4) +
          (Math.sin((x + offset * 3) * 0.08) * spike);

        const y = centerY + wave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Subtle glow shadow of trace
      ctx.lineWidth = 5;
      ctx.strokeStyle = isSuppressionActive ? "rgba(16, 185, 129, 0.15)" : "rgba(220, 38, 38, 0.15)";
      ctx.stroke();

      offset += isStreaming ? 2.5 : 0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSuppressionActive, isStreaming]);

  // Live log generator timer
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const sample = SAMPLE_LOGS[Math.floor(Math.random() * SAMPLE_LOGS.length)];
      const now = new Date();
      const timeStr = `${now.toTimeString().split(" ")[0]}.${String(now.getMilliseconds()).padStart(3, "0")}`;

      const newLog: StreamLog = {
        ...sample,
        id: Math.random().toString(36).substring(7),
        time: timeStr,
      };

      setLogs((prev) => [newLog, ...prev.slice(0, 11)]);
      setEpsRate(isSuppressionActive ? 180 + Math.floor(Math.random() * 8) : 14200 + Math.floor(Math.random() * 150));
    }, 900);

    return () => clearInterval(interval);
  }, [isStreaming, isSuppressionActive]);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
      {/* Scope Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold text-slate-900 tracking-tight">
                AF_PACKET WIRE OSCILLOSCOPE &amp; TELEMETRY STREAM
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                isSuppressionActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {isSuppressionActive ? "FILTER: ACTIVE (184 EPS)" : "RAW FLOOD (14.2k EPS)"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live kernel socket trace sampling ingress ethernet frames and integratord rule evaluation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsStreaming(!isStreaming)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            {isStreaming ? (
              <>
                <Pause className="h-3.5 w-3.5 text-slate-500" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-emerald-600 fill-current" />
                <span>Resume Stream</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Dual View: Oscilloscope Canvas (Top) + Real Log Terminal (Bottom) */}
      <div className="my-4 space-y-4">
        {/* Oscilloscope Canvas */}
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner">
          <canvas
            ref={canvasRef}
            width={720}
            height={144}
            className="w-full h-full block"
          />
          {/* HUD Overlay Labels on Canvas */}
          <div className="absolute top-2 left-3 flex items-center gap-3 text-[10px] font-mono text-slate-500">
            <span>CH1: INGRESS 50mV/div</span>
            <span>TIME: 2.5ms/div</span>
            <span className="font-bold text-slate-700">{epsRate} EPS</span>
          </div>
          <div className="absolute top-2 right-3 flex items-center gap-2 text-[10px] font-mono">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-slate-700">RING BUFFER 0% LOSS</span>
          </div>
        </div>

        {/* Real-time Streaming Packet Log Feed */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 overflow-hidden">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Live Kernel Ingestion Feed (Latest 6 packets)</span>
            <span>FIFO Queue: 142/65536</span>
          </div>
          <div className="space-y-1 font-mono text-[11px] max-h-36 overflow-y-auto">
            {logs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-1 px-2 rounded bg-white border border-slate-100 hover:border-slate-200 text-slate-700 gap-2"
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-400">{log.time}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      log.action === "DROPPED"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">Rule {log.rule}</span>
                </div>
                <div className="truncate flex-1 text-slate-800 text-[11px]">
                  {log.event}
                </div>
                <div className="text-[10px] text-slate-400 shrink-0 font-medium">
                  {log.src}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
