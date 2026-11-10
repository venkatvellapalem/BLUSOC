'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Layers,
  Database,
  Terminal,
  Activity,
  Cpu,
  ArrowRight,
  Maximize2,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  FileCode,
} from 'lucide-react';
import { PIPELINE_STAGES, SimulationPreset } from './pipelineData';

interface PipelineCanvasProps {
  selectedStageId: string | null;
  onSelectStage: (stageId: string) => void;
  activePreset: SimulationPreset | null;
  simulationStep: number;
  isSimulating: boolean;
}

export default function PipelineCanvas({
  selectedStageId,
  onSelectStage,
  activePreset,
  simulationStep,
  isSimulating,
}: PipelineCanvasProps) {
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);

  // SVG coordinate definitions for the 5 stages
  const STAGE_COORDS = [
    { id: 'stage-sensors', x: 20, y: 70, w: 205, h: 460 },
    { id: 'stage-wazuh', x: 260, y: 70, w: 215, h: 460 },
    { id: 'stage-enricher', x: 510, y: 70, w: 205, h: 460 },
    { id: 'stage-soar', x: 750, y: 70, w: 205, h: 460 },
    { id: 'stage-workbench', x: 990, y: 70, w: 190, h: 460 },
  ];

  // Helper to determine active pulse position based on simulation step
  const getPacketPosition = () => {
    if (!isSimulating || !activePreset) return null;

    if (activePreset.outcome === 'suppressed') {
      if (simulationStep === 1) return { x: 122, y: 270, label: 'INGEST' };
      if (simulationStep === 2) return { x: 367, y: 260, label: 'EVALUATING' };
      if (simulationStep >= 3) return { x: 367, y: 585, label: 'SUPPRESSED' };
      return null;
    }

    // Forwarded packets (stages 1 to 5)
    switch (simulationStep) {
      case 1:
        return { x: 122, y: 270, label: 'INGEST' };
      case 2:
        return { x: 367, y: 260, label: `RULE ${activePreset.ruleId}` };
      case 3:
        return { x: 612, y: 260, label: 'ENRICHED (4KB)' };
      case 4:
        return { x: 852, y: 260, label: 'IRIS CASE' };
      case 5:
        return { x: 1085, y: 260, label: 'TRIAGED' };
      default:
        return null;
    }
  };

  const packetPos = getPacketPosition();

  return (
    <div className="relative rounded-2xl border border-brand-border bg-brand-surface shadow-card overflow-hidden">
      {/* Canvas Top Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-brand-border bg-brand-canvas px-6 py-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-brand-text-primary tracking-tight">
                Live Telemetry Architecture DAG
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Healthy
              </span>
            </div>
            <p className="text-xs text-brand-text-secondary">
              Click any node to inspect XML decoders, Python middleware, and live operational buffers
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-brand-text-secondary">
            <span className="h-2 w-4 rounded-full bg-blue-500 inline-block" />
            <span>Perimeter Telemetry (14,280 eps)</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-text-secondary">
            <span className="h-2 w-4 rounded-full bg-amber-500 inline-block" />
            <span>Suppressed Noise (-98.7%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-text-secondary">
            <span className="h-2 w-4 rounded-full bg-emerald-600 inline-block" />
            <span>Actionable IRIS Stream (184 alerts)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="w-full overflow-x-auto bg-[#F8FAFC] p-4 lg:p-6">
        <div className="min-w-[1100px] max-w-[1280px] mx-auto">
          <svg
            viewBox="0 0 1200 660"
            className="w-full h-auto select-none font-sans"
            style={{ minHeight: '580px' }}
          >
            <defs>
              {/* Subtle Canvas Dot Grid Pattern */}
              <pattern id="dot-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#E2E8F0" />
              </pattern>

              {/* Linear Gradients for Flow Lines */}
              <linearGradient id="flow-ingest" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="flow-forwarded" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
              </linearGradient>

              <linearGradient id="flow-suppressed" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.9" />
              </linearGradient>

              {/* Marker Arrow heads */}
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#3B82F6" />
              </marker>

              <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#059669" />
              </marker>

              <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#D97706" />
              </marker>

              {/* Glow filter for active simulation packet */}
              <filter id="packet-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background grid */}
            <rect width="1200" height="660" fill="url(#dot-pattern)" />

            {/* CONNECTING PIPELINE CABLES (BEZIER PATHS) */}
            {/* 1. Sensors to Wazuh */}
            <path
              d="M 225 270 C 242 270, 242 260, 260 260"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeDasharray="6 4"
              className="transition-all"
            />
            {/* Animated Blue Pulse Cable */}
            <path
              d="M 225 270 C 242 270, 242 260, 260 260"
              fill="none"
              stroke="url(#flow-ingest)"
              strokeWidth="3"
              markerEnd="url(#arrow-blue)"
            />

            {/* 2. Wazuh forward to Python Enricher (Actionable alerts) */}
            <path
              d="M 475 260 C 492 260, 492 260, 510 260"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeDasharray="6 4"
            />
            <path
              d="M 475 260 C 492 260, 492 260, 510 260"
              fill="none"
              stroke="url(#flow-forwarded)"
              strokeWidth="3"
              markerEnd="url(#arrow-emerald)"
            />

            {/* 2b. Wazuh branch down to Suppression Sink */}
            <path
              d="M 367 360 C 367 430, 367 490, 367 555"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="3"
              strokeDasharray="5 3"
            />
            <path
              d="M 367 360 C 367 430, 367 490, 367 555"
              fill="none"
              stroke="url(#flow-suppressed)"
              strokeWidth="3"
              markerEnd="url(#arrow-amber)"
            />

            {/* 3. Python Enricher to DFIR-IRIS SOAR */}
            <path
              d="M 715 260 C 732 260, 732 260, 750 260"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeDasharray="6 4"
            />
            <path
              d="M 715 260 C 732 260, 732 260, 750 260"
              fill="none"
              stroke="url(#flow-forwarded)"
              strokeWidth="3"
              markerEnd="url(#arrow-emerald)"
            />

            {/* 4. DFIR-IRIS to Analyst Workbench */}
            <path
              d="M 955 260 C 972 260, 972 260, 990 260"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeDasharray="6 4"
            />
            <path
              d="M 955 260 C 972 260, 972 260, 990 260"
              fill="none"
              stroke="url(#flow-forwarded)"
              strokeWidth="3"
              markerEnd="url(#arrow-emerald)"
            />

            {/* Continuous Ambient Telemetry Pulses */}
            {!isSimulating && (
              <>
                <circle r="4" fill="#3B82F6">
                  <animateMotion
                    path="M 225 270 C 242 270, 242 260, 260 260"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r="4" fill="#F59E0B">
                  <animateMotion
                    path="M 367 360 C 367 430, 367 490, 367 555"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r="4" fill="#10B981">
                  <animateMotion
                    path="M 475 260 C 492 260, 492 260, 510 260"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r="4" fill="#10B981">
                  <animateMotion
                    path="M 715 260 C 732 260, 732 260, 750 260"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r="4" fill="#10B981">
                  <animateMotion
                    path="M 955 260 C 972 260, 972 260, 990 260"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}

            {/* STAGE 1: PERIMETER INGESTION & SENSORS */}
            <g
              onClick={() => onSelectStage('stage-sensors')}
              onMouseEnter={() => setHoveredStageId('stage-sensors')}
              onMouseLeave={() => setHoveredStageId(null)}
              className="cursor-pointer transition-all duration-150"
            >
              {/* Outer Stage Boundary Card */}
              <rect
                x="20"
                y="50"
                width="205"
                height="480"
                rx="14"
                fill="#FFFFFF"
                stroke={
                  selectedStageId === 'stage-sensors'
                    ? '#2563EB'
                    : hoveredStageId === 'stage-sensors'
                    ? '#93C5FD'
                    : '#E2E8F0'
                }
                strokeWidth={selectedStageId === 'stage-sensors' ? '2.5' : '1.5'}
                filter="drop-shadow(0 4px 6px rgba(15, 23, 42, 0.04))"
              />

              {/* Stage Header */}
              <rect x="20" y="50" width="205" height="52" rx="14" fill="#F8FAFC" />
              <rect x="20" y="90" width="205" height="12" fill="#F8FAFC" />
              <line x1="20" y1="102" x2="225" y2="102" stroke="#E2E8F0" strokeWidth="1" />

              <circle cx="40" cy="76" r="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
              <text x="40" y="80" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2563EB">1</text>
              <text x="60" y="73" fontSize="11" fontWeight="700" fill="#0F172A">PERIMETER SENSORS</text>
              <text x="60" y="87" fontSize="9.5" fontWeight="500" fill="#64748B">Distributed Ingress</text>

              {/* Latency & Throughput Badges */}
              <rect x="32" y="112" width="85" height="20" rx="4" fill="#EFF6FF" />
              <text x="74" y="126" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1D4ED8">14,280 eps</text>

              <rect x="127" y="112" width="85" height="20" rx="4" fill="#F1F5F9" />
              <text x="169" y="126" textAnchor="middle" fontSize="9" fontWeight="600" fill="#475569">0.4 ms lag</text>

              {/* Sub-node Sensor 1: Suricata DPI */}
              <g>
                <rect x="30" y="142" width="185" height="72" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="30" y="142" width="4" height="72" rx="2" fill="#2563EB" />
                <text x="42" y="160" fontSize="10" fontWeight="700" fill="#0F172A">Suricata 7.0 DPI Tap</text>
                <text x="42" y="174" fontSize="8.5" fill="#64748B">Interface enp2s0 (10Gbps tap)</text>
                <rect x="42" y="184" width="70" height="18" rx="4" fill="#DBEAFE" />
                <text x="77" y="196" textAnchor="middle" fontSize="8" fontWeight="600" fill="#1E40AF">EVE JSON</text>
                <text x="122" y="196" fontSize="8.5" fill="#64748B">Flow/Alerts</text>
              </g>

              {/* Sub-node Sensor 2: CrowdStrike Falcon */}
              <g>
                <rect x="30" y="224" width="185" height="72" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="30" y="224" width="4" height="72" rx="2" fill="#DC2626" />
                <text x="42" y="242" fontSize="10" fontWeight="700" fill="#0F172A">CrowdStrike Falcon</text>
                <text x="42" y="256" fontSize="8.5" fill="#64748B">EDR process rollups & ping</text>
                <rect x="42" y="266" width="60" height="18" rx="4" fill="#FEE2E2" />
                <text x="72" y="278" textAnchor="middle" fontSize="8" fontWeight="600" fill="#991B1B">Sensor API</text>
                <text x="112" y="278" fontSize="8.5" fill="#64748B">Active EDR</text>
              </g>

              {/* Sub-node Sensor 3: Barracuda ESG */}
              <g>
                <rect x="30" y="306" width="185" height="66" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="30" y="306" width="4" height="66" rx="2" fill="#2563EB" />
                <text x="42" y="324" fontSize="10" fontWeight="700" fill="#0F172A">Barracuda CloudGen</text>
                <text x="42" y="338" fontSize="8.5" fill="#64748B">Perimeter NAT & firewall</text>
                <text x="42" y="358" fontSize="8.5" fontWeight="600" fill="#2563EB">Syslog RFC 5424</text>
              </g>

              {/* Sub-node Sensor 4: Cloudflare WAF */}
              <g>
                <rect x="30" y="382" width="185" height="66" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <rect x="30" y="382" width="4" height="66" rx="2" fill="#EA580C" />
                <text x="42" y="400" fontSize="10" fontWeight="700" fill="#0F172A">Cloudflare Edge WAF</text>
                <text x="42" y="414" fontSize="8.5" fill="#64748B">HTTP edge attack blocks</text>
                <text x="42" y="434" fontSize="8.5" fontWeight="600" fill="#EA580C">Logpush Stream</text>
              </g>

              {/* Inspection CTA Button at bottom of card */}
              <rect x="30" y="460" width="185" height="28" rx="6" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
              <text x="122" y="478" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#2563EB">
                Inspect Sensor Config →
              </text>
            </g>

            {/* STAGE 2: WAZUH SIEM ANALYSIS ENGINE */}
            <g
              onClick={() => onSelectStage('stage-wazuh')}
              onMouseEnter={() => setHoveredStageId('stage-wazuh')}
              onMouseLeave={() => setHoveredStageId(null)}
              className="cursor-pointer transition-all duration-150"
            >
              {/* Outer Stage Boundary Card */}
              <rect
                x="260"
                y="50"
                width="215"
                height="480"
                rx="14"
                fill="#FFFFFF"
                stroke={
                  selectedStageId === 'stage-wazuh'
                    ? '#2563EB'
                    : hoveredStageId === 'stage-wazuh'
                    ? '#93C5FD'
                    : '#E2E8F0'
                }
                strokeWidth={selectedStageId === 'stage-wazuh' ? '2.5' : '1.5'}
                filter="drop-shadow(0 4px 6px rgba(15, 23, 42, 0.04))"
              />

              {/* Header */}
              <rect x="260" y="50" width="215" height="52" rx="14" fill="#F8FAFC" />
              <rect x="260" y="90" width="215" height="12" fill="#F8FAFC" />
              <line x1="260" y1="102" x2="475" y2="102" stroke="#E2E8F0" strokeWidth="1" />

              <circle cx="280" cy="76" r="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
              <text x="280" y="80" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2563EB">2</text>
              <text x="300" y="73" fontSize="11" fontWeight="700" fill="#0F172A">WAZUH SIEM ENGINE</text>
              <text x="300" y="87" fontSize="9.5" fontWeight="500" fill="#64748B">Decoders & Evaluation</text>

              {/* Metrics */}
              <rect x="272" y="112" width="92" height="20" rx="4" fill="#FEF3C7" />
              <text x="318" y="126" textAnchor="middle" fontSize="9" fontWeight="600" fill="#92400E">-98.7% Noise</text>

              <rect x="373" y="112" width="92" height="20" rx="4" fill="#F1F5F9" />
              <text x="419" y="126" textAnchor="middle" fontSize="9" fontWeight="600" fill="#475569">0.8 ms lag</text>

              {/* Sub-node 1: Syslog / JSON Decoders */}
              <g>
                <rect x="272" y="142" width="191" height="64" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <text x="284" y="160" fontSize="10" fontWeight="700" fill="#0F172A">Syslog & JSON Decoders</text>
                <text x="284" y="174" fontSize="8.5" fill="#64748B">Extracts IP, port, vendor, URI</text>
                <text x="284" y="192" fontSize="8.5" fontWeight="600" fill="#2563EB">ossec-analysisd worker</text>
              </g>

              {/* Sub-node 2: Rule Evaluation Matrix */}
              <g>
                <rect x="272" y="216" width="191" height="66" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <text x="284" y="234" fontSize="10" fontWeight="700" fill="#0F172A">Rule Evaluation Engine</text>
                <text x="284" y="248" fontSize="8.5" fill="#64748B">1,420 detection rules (L0-L12)</text>
                <rect x="284" y="258" width="75" height="16" rx="4" fill="#D1FAE5" />
                <text x="321" y="270" textAnchor="middle" fontSize="8" fontWeight="600" fill="#065F46">L8-L12 Active</text>
              </g>

              {/* Sub-node 3: Noise Suppression Matrix (Key tuning) */}
              <g>
                <rect x="272" y="292" width="191" height="96" rx="8" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
                <text x="284" y="310" fontSize="10" fontWeight="700" fill="#92400E">Suppression Engine</text>
                <text x="284" y="324" fontSize="8.5" fill="#78350F">Rule 100010: CrowdStrike null-host</text>
                <text x="284" y="338" fontSize="8.5" fill="#78350F">Rule 91578: O365 egress proxy</text>
                <text x="284" y="352" fontSize="8.5" fill="#78350F">Rule 86611: Suricata ethertype</text>
                <rect x="284" y="362" width="167" height="18" rx="4" fill="#FDE68A" />
                <text x="367" y="374" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#78350F">
                  LEVEL 0 NOISE SUPPRESSION
                </text>
              </g>

              {/* Inspection CTA Button */}
              <rect x="272" y="460" width="191" height="28" rx="6" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
              <text x="367" y="478" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#2563EB">
                Inspect Wazuh Rules →
              </text>
            </g>

            {/* STAGE 2 SINK: SUPPRESSED NOISE SINK */}
            <g
              onClick={() => onSelectStage('stage-wazuh')}
              className="cursor-pointer"
            >
              <rect
                x="260"
                y="555"
                width="215"
                height="80"
                rx="12"
                fill="#FEF3C7"
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              <text x="367" y="580" textAnchor="middle" fontSize="11" fontWeight="700" fill="#92400E">
                SUPPRESSED NOISE SINK
              </text>
              <text x="367" y="598" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#B45309">
                14,096 Benign Events / Day
              </text>
              <text x="367" y="618" textAnchor="middle" fontSize="8.5" fill="#78350F">
                Silenced at Level 0 (Zero IRIS tickets created)
              </text>
            </g>

            {/* STAGE 3: CUSTOM PYTHON ENRICHMENT MIDDLEWARE */}
            <g
              onClick={() => onSelectStage('stage-enricher')}
              onMouseEnter={() => setHoveredStageId('stage-enricher')}
              onMouseLeave={() => setHoveredStageId(null)}
              className="cursor-pointer transition-all duration-150"
            >
              {/* Outer Stage Boundary Card */}
              <rect
                x="510"
                y="50"
                width="205"
                height="480"
                rx="14"
                fill="#FFFFFF"
                stroke={
                  selectedStageId === 'stage-enricher'
                    ? '#2563EB'
                    : hoveredStageId === 'stage-enricher'
                    ? '#93C5FD'
                    : '#E2E8F0'
                }
                strokeWidth={selectedStageId === 'stage-enricher' ? '2.5' : '1.5'}
                filter="drop-shadow(0 4px 6px rgba(15, 23, 42, 0.04))"
              />

              {/* Header */}
              <rect x="510" y="50" width="205" height="52" rx="14" fill="#F8FAFC" />
              <rect x="510" y="90" width="205" height="12" fill="#F8FAFC" />
              <line x1="510" y1="102" x2="715" y2="102" stroke="#E2E8F0" strokeWidth="1" />

              <circle cx="530" cy="76" r="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
              <text x="530" y="80" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2563EB">3</text>
              <text x="550" y="73" fontSize="11" fontWeight="700" fill="#0F172A">PYTHON ENRICHER</text>
              <text x="550" y="87" fontSize="9.5" fontWeight="500" fill="#64748B">custom-iris.py Daemon</text>

              {/* Metrics */}
              <rect x="522" y="112" width="87" height="20" rx="4" fill="#ECFDF5" />
              <text x="565" y="126" textAnchor="middle" fontSize="9" fontWeight="600" fill="#065F46">184 alerts/day</text>

              <rect x="618" y="112" width="87" height="20" rx="4" fill="#F1F5F9" />
              <text x="661" y="126" textAnchor="middle" fontSize="9" fontWeight="600" fill="#475569">1.1 ms lag</text>

              {/* Sub-node 1: 4,000-char Buffer Manager (Truncation Fix) */}
              <g>
                <rect x="522" y="142" width="181" height="84" rx="8" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1" />
                <text x="534" y="162" fontSize="10" fontWeight="700" fill="#166534">4,000-char Buffer Cap</text>
                <text x="534" y="176" fontSize="8.5" fill="#15803D">Truncation fix prevents log clipping</text>
                <text x="534" y="190" fontSize="8.5" fill="#15803D">Protects base64 / DPI payloads</text>
                <rect x="534" y="198" width="157" height="18" rx="4" fill="#DCFCE7" />
                <text x="612" y="210" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#166534">
                  10x BUFFER EXPANSION
                </text>
              </g>

              {/* Sub-node 2: MaxMind GeoIP & ASN Resolver */}
              <g>
                <rect x="522" y="238" width="181" height="74" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <text x="534" y="256" fontSize="10" fontWeight="700" fill="#0F172A">GeoIP & ASN Decorator</text>
                <text x="534" y="270" fontSize="8.5" fill="#64748B">Resolves public IP geolocations</text>
                <text x="534" y="284" fontSize="8.5" fill="#64748B">AS6939 Hurricane Electric, etc.</text>
                <text x="534" y="302" fontSize="8" fontWeight="600" fill="#2563EB">MaxMind City/ASN DB</text>
              </g>

              {/* Sub-node 3: Dynamic Severity Mapper */}
              <g>
                <rect x="522" y="322" width="181" height="74" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <text x="534" y="340" fontSize="10" fontWeight="700" fill="#0F172A">Severity Translator</text>
                <text x="534" y="354" fontSize="8.5" fill="#64748B">Wazuh Level to IRIS severity ID</text>
                <text x="534" y="368" fontSize="8.5" fill="#64748B">L12+ to Crit (6) | L9-11 to High (5)</text>
                <text x="534" y="386" fontSize="8" fontWeight="600" fill="#059669">REST Schema Normalization</text>
              </g>

              {/* Inspection CTA Button */}
              <rect x="522" y="460" width="181" height="28" rx="6" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
              <text x="612" y="478" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#2563EB">
                Inspect Python Code →
              </text>
            </g>

            {/* STAGE 4: DFIR-IRIS SOAR & CASE MANAGEMENT */}
            <g
              onClick={() => onSelectStage('stage-soar')}
              onMouseEnter={() => setHoveredStageId('stage-soar')}
              onMouseLeave={() => setHoveredStageId(null)}
              className="cursor-pointer transition-all duration-150"
            >
              {/* Outer Stage Boundary Card */}
              <rect
                x="750"
                y="50"
                width="205"
                height="480"
                rx="14"
                fill="#FFFFFF"
                stroke={
                  selectedStageId === 'stage-soar'
                    ? '#2563EB'
                    : hoveredStageId === 'stage-soar'
                    ? '#93C5FD'
                    : '#E2E8F0'
                }
                strokeWidth={selectedStageId === 'stage-soar' ? '2.5' : '1.5'}
                filter="drop-shadow(0 4px 6px rgba(15, 23, 42, 0.04))"
              />

              {/* Header */}
              <rect x="750" y="50" width="205" height="52" rx="14" fill="#F8FAFC" />
              <rect x="750" y="90" width="205" height="12" fill="#F8FAFC" />
              <line x1="750" y1="102" x2="955" y2="102" stroke="#E2E8F0" strokeWidth="1" />

              <circle cx="770" cy="76" r="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
              <text x="770" y="80" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2563EB">4</text>
              <text x="790" y="73" fontSize="11" fontWeight="700" fill="#0F172A">DFIR-IRIS SOAR</text>
              <text x="790" y="87" fontSize="9.5" fontWeight="500" fill="#64748B">Case Orchestration</text>

              {/* Metrics */}
              <rect x="762" y="112" width="87" height="20" rx="4" fill="#ECFDF5" />
              <text x="805" y="126" textAnchor="middle" fontSize="9" fontWeight="600" fill="#065F46">184 cases</text>

              <rect x="858" y="112" width="87" height="20" rx="4" fill="#F1F5F9" />
              <text x="901" y="126" textAnchor="middle" fontSize="9" fontWeight="600" fill="#475569">0.5 ms API</text>

              {/* Sub-node 1: Ingestion API */}
              <g>
                <rect x="762" y="142" width="181" height="74" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <text x="774" y="160" fontSize="10" fontWeight="700" fill="#0F172A">Alert Ingestion API</text>
                <text x="774" y="174" fontSize="8.5" fill="#64748B">POST /alerts/add endpoint</text>
                <text x="774" y="188" fontSize="8.5" fill="#64748B">Bearer token authenticated</text>
                <text x="774" y="206" fontSize="8" fontWeight="600" fill="#059669">HTTP 201 Created</text>
              </g>

              {/* Sub-node 2: Automated Case Deduplication */}
              <g>
                <rect x="762" y="226" width="181" height="74" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <text x="774" y="244" fontSize="10" fontWeight="700" fill="#0F172A">Case Grouping Engine</text>
                <text x="774" y="258" fontSize="8.5" fill="#64748B">IOC linking (IP, domain, hash)</text>
                <text x="774" y="272" fontSize="8.5" fill="#64748B">Attacker infrastructure graph</text>
                <text x="774" y="290" fontSize="8" fontWeight="600" fill="#2563EB">IRIS Case Builder</text>
              </g>

              {/* Sub-node 3: Dynamic SLA Timer Engine */}
              <g>
                <rect x="762" y="310" width="181" height="86" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <text x="774" y="328" fontSize="10" fontWeight="700" fill="#0F172A">Dynamic SLA Dispatch</text>
                <text x="774" y="342" fontSize="8.5" fill="#DC2626">P1 Critical: 15-minute countdown</text>
                <text x="774" y="356" fontSize="8.5" fill="#EA580C">P2 High: 60-minute resolution</text>
                <text x="774" y="370" fontSize="8.5" fill="#2563EB">P3 Medium: 4-hour SLA</text>
                <text x="774" y="388" fontSize="8" fontWeight="600" fill="#64748B">Automated Escalation</text>
              </g>

              {/* Inspection CTA Button */}
              <rect x="762" y="460" width="181" height="28" rx="6" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
              <text x="852" y="478" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#2563EB">
                Inspect IRIS Payload →
              </text>
            </g>

            {/* STAGE 5: ANALYST TRIAGE WORKBENCH */}
            <g
              onClick={() => onSelectStage('stage-workbench')}
              onMouseEnter={() => setHoveredStageId('stage-workbench')}
              onMouseLeave={() => setHoveredStageId(null)}
              className="cursor-pointer transition-all duration-150"
            >
              {/* Outer Stage Boundary Card */}
              <rect
                x="990"
                y="50"
                width="190"
                height="480"
                rx="14"
                fill="#FFFFFF"
                stroke={
                  selectedStageId === 'stage-workbench'
                    ? '#2563EB'
                    : hoveredStageId === 'stage-workbench'
                    ? '#93C5FD'
                    : '#E2E8F0'
                }
                strokeWidth={selectedStageId === 'stage-workbench' ? '2.5' : '1.5'}
                filter="drop-shadow(0 4px 6px rgba(15, 23, 42, 0.04))"
              />

              {/* Header */}
              <rect x="990" y="50" width="190" height="52" rx="14" fill="#F8FAFC" />
              <rect x="990" y="90" width="190" height="12" fill="#F8FAFC" />
              <line x1="990" y1="102" x2="1180" y2="102" stroke="#E2E8F0" strokeWidth="1" />

              <circle cx="1010" cy="76" r="12" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
              <text x="1010" y="80" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2563EB">5</text>
              <text x="1030" y="73" fontSize="11" fontWeight="700" fill="#0F172A">WORKBENCH</text>
              <text x="1030" y="87" fontSize="9.5" fontWeight="500" fill="#64748B">Analyst Investigation</text>

              {/* Metrics */}
              <rect x="1000" y="112" width="80" height="20" rx="4" fill="#EFF6FF" />
              <text x="1040" y="126" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1E40AF">8 min MTTR</text>

              <rect x="1090" y="112" width="80" height="20" rx="4" fill="#ECFDF5" />
              <text x="1130" y="126" textAnchor="middle" fontSize="9" fontWeight="600" fill="#065F46">100% Valid</text>

              {/* Sub-node 1: Queue Dispatch */}
              <g>
                <rect x="1000" y="142" width="170" height="74" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <text x="1012" y="160" fontSize="10" fontWeight="700" fill="#0F172A">Queue Dispatcher</text>
                <text x="1012" y="174" fontSize="8.5" fill="#64748B">Tier 1: Ross (Investigator)</text>
                <text x="1012" y="188" fontSize="8.5" fill="#64748B">Tier 2: Vance (Detection)</text>
                <text x="1012" y="206" fontSize="8" fontWeight="600" fill="#2563EB">Tier 3: Chen (Lead)</text>
              </g>

              {/* Sub-node 2: Raw Log Inspector */}
              <g>
                <rect x="1000" y="226" width="170" height="74" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <text x="1012" y="244" fontSize="10" fontWeight="700" fill="#0F172A">Forensic Viewer</text>
                <text x="1012" y="258" fontSize="8.5" fill="#64748B">Full 67 attack dataset</text>
                <text x="1012" y="272" fontSize="8.5" fill="#64748B">MITRE ATT&CK tags</text>
                <text x="1012" y="290" fontSize="8" fontWeight="600" fill="#475569">Raw JSON Inspection</text>
              </g>

              {/* Sub-node 3: Ticket Closing Gate */}
              <g>
                <rect x="1000" y="310" width="170" height="86" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                <text x="1012" y="328" fontSize="10" fontWeight="700" fill="#0F172A">Closing Gate Policy</text>
                <text x="1012" y="342" fontSize="8.5" fill="#64748B">True / False Positive</text>
                <text x="1012" y="356" fontSize="8.5" fill="#64748B">Containment actions</text>
                <text x="1012" y="370" fontSize="8.5" fill="#64748B">Forensic note mandatory</text>
                <text x="1012" y="388" fontSize="8" fontWeight="600" fill="#059669">Audit Trail Enforced</text>
              </g>

              {/* Inspection CTA Button */}
              <rect x="1000" y="460" width="170" height="28" rx="6" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1" />
              <text x="1085" y="478" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#2563EB">
                Inspect Triage Gate →
              </text>
            </g>

            {/* ANIMATED PACKET PULSE (WHEN SIMULATION IS ACTIVE) */}
            {packetPos && (
              <g
                transform={`translate(${packetPos.x}, ${packetPos.y})`}
                filter="url(#packet-glow)"
                className="transition-all duration-300"
              >
                {/* Outer pulsing beacon ring */}
                <circle
                  r="18"
                  fill={
                    activePreset?.severity === 'CRITICAL'
                      ? '#FEE2E2'
                      : activePreset?.outcome === 'suppressed'
                      ? '#FEF3C7'
                      : '#DBEAFE'
                  }
                  opacity="0.8"
                >
                  <animate
                    attributeName="r"
                    values="14;22;14"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.8;0.2;0.8"
                    dur="1.2s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Core packet disc */}
                <circle
                  r="10"
                  fill={
                    activePreset?.severity === 'CRITICAL'
                      ? '#DC2626'
                      : activePreset?.outcome === 'suppressed'
                      ? '#D97706'
                      : '#2563EB'
                  }
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />

                {/* Packet Label Tooltip Tag */}
                <rect
                  x="-45"
                  y="-34"
                  width="90"
                  height="22"
                  rx="4"
                  fill="#0F172A"
                  opacity="0.9"
                />
                <text
                  x="0"
                  y="-20"
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill="#FFFFFF"
                >
                  {packetPos.label}
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Canvas Footer Bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-brand-border bg-white px-6 py-3 text-xs text-brand-text-secondary gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-brand-text-muted" />
          <span>
            Telemetry path displays active filtering from <strong>14,280 daily ingress events</strong> down to <strong>184 actionable tickets</strong>.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-brand-text-muted">Total Pipeline Latency: &lt; 2.8ms</span>
          <span className="font-mono text-brand-text-muted">Wazuh Integratord: Synchronized</span>
        </div>
      </div>
    </div>
  );
}
