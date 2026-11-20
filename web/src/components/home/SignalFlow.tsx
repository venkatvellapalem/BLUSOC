"use client";

import { ArrowRight, Check, Filter, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useState, type CSSProperties } from "react";

const SCENARIOS = [
  {
    id: "threat",
    label: "A real threat",
    outcome: "Ready to investigate",
    detail: "A threat-intelligence match becomes an incident for an analyst.",
    color: "#2463eb",
    icon: Check,
  },
  {
    id: "noise",
    label: "Everyday noise",
    outcome: "Filtered at the source",
    detail: "A familiar heartbeat is suppressed. No ticket. No distraction.",
    color: "#b87812",
    icon: Filter,
  },
  {
    id: "contain",
    label: "Containment",
    outcome: "A response takes shape",
    detail: "A confirmed threat follows the illustrated containment route.",
    color: "#087c68",
    icon: ShieldCheck,
  },
] as const;

export function SignalFlow() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const scenario = SCENARIOS[scenarioIndex];
  const OutcomeIcon = scenario.icon;
  const isNoise = scenario.id === "noise";
  return (
    <div className="signal-lab">
      <div className="signal-lab-heading">
        <span className="signal-symbol" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>From alert to action</span>
        <span className="demo-label">Interactive demo</span>
      </div>
      <div className="signal-diagram">
        <svg
          viewBox="0 0 520 335"
          role="img"
          aria-label={
            isNoise
              ? "Telemetry enters Wazuh and known noise is filtered before enrichment."
              : "Telemetry enters Wazuh, then n8n enrichment and Laya triage before a response."
          }
        >
          <defs>
            <linearGradient id="signal-ribbon" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#c7d9ff" stopOpacity=".15" />
              <stop offset="1" stopColor="#c7d9ff" stopOpacity=".65" />
            </linearGradient>
          </defs>
          <path
            d="M82 66 C82 115 228 83 228 134 L292 134 C292 83 438 115 438 66Z"
            fill="url(#signal-ribbon)"
          />
          {[82, 200, 320, 438].map((x, i) => (
            <g key={x}>
              <path
                d={`M${x} 69 C${x} 110 260 88 260 138`}
                fill="none"
                stroke="#b8cdef"
                strokeWidth="1.5"
              />
              <circle r="3" fill={scenario.color} className="signal-packet">
                <animateMotion
                  dur={`${2.4 + i * 0.2}s`}
                  repeatCount="indefinite"
                  path={`M${x} 69 C${x} 110 260 88 260 138`}
                />
              </circle>
            </g>
          ))}
          {[
            { x: 82, logo: "/logos/suricata.png", label: "Network" },
            { x: 200, logo: "/logos/crowdstrike.png", label: "Endpoints" },
            { x: 320, logo: "/logos/microsoft-365.svg", label: "Identity" },
            { x: 438, logo: "/logos/cloudflare.svg", label: "Cloud" },
          ].map((source) => (
            <g key={source.label}>
              <rect
                x={source.x - 24}
                y="14"
                width="48"
                height="46"
                rx="12"
                fill="white"
                stroke="#dce5f2"
              />
              <image
                href={source.logo}
                x={source.x - 12}
                y="25"
                width="24"
                height="24"
                preserveAspectRatio="xMidYMid meet"
              />
              <text x={source.x} y="82" textAnchor="middle" className="diagram-source">
                {source.label}
              </text>
            </g>
          ))}
          <rect x="187" y="137" width="146" height="56" rx="13" fill="#2463eb" />
          <image
            style={{ filter: "brightness(0) invert(1)" }}
            href="/logos/wazuh.svg"
            x="203"
            y="153"
            width="25"
            height="25"
          />
          <text
            x="241"
            y="161"
            fill="white"
            fontSize="16"
            className="diagram-main"
            fontWeight="700"
          >
            Wazuh
          </text>
          <text x="241" y="178" fill="#dbe8ff" fontSize="10.5" className="diagram-detail">
            Find the signal
          </text>
          <path
            d="M260 193 V223 Q260 235 244 235 H175 V253"
            stroke={isNoise ? "#d5dfec" : scenario.color}
            strokeWidth="2"
            fill="none"
            className={isNoise ? "" : "signal-active-line"}
          />
          <path
            d="M333 165 H394 Q410 165 410 181 V207"
            stroke={isNoise ? scenario.color : "#d6dfec"}
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="410" cy="217" r="11" fill={isNoise ? "#fff1d8" : "#eef2f7"} />
          <path d="M406 217 H414" stroke={isNoise ? scenario.color : "#7d8da3"} strokeWidth="2" />
          <text
            x="410"
            y="243"
            textAnchor="middle"
            fontSize="11"
            fill={isNoise ? "#9c6513" : "#64748b"}
          >
            Known noise
          </text>
          <g opacity={isNoise ? 0.42 : 1}>
            <rect x="97" y="254" width="154" height="57" rx="12" fill="white" stroke="#d8e2f1" />
            <image href="/logos/n8n.png" x="112" y="271" width="23" height="23" />
            <text
              x="147"
              y="279"
              fill="#18304d"
              fontSize="14"
              className="diagram-main"
              fontWeight="700"
            >
              n8n
            </text>
            <text x="147" y="295" fill="#53637a" fontSize="10.5" className="diagram-detail">
              Add the context
            </text>
            <path d="M251 282 H290" stroke={scenario.color} strokeWidth="2" />
            <path
              d="M283 278 L290 282 L283 286"
              stroke={scenario.color}
              strokeWidth="1.5"
              fill="none"
            />
            <rect x="291" y="254" width="141" height="57" rx="12" fill="white" stroke="#d8e2f1" />
            <image href="/logos/laya.svg" x="306" y="271" width="23" height="23" />
            <text
              x="341"
              y="279"
              fill="#18304d"
              fontSize="14"
              className="diagram-main"
              fontWeight="700"
            >
              Laya
            </text>
            <text x="341" y="295" fill="#53637a" fontSize="10.5" className="diagram-detail">
              Triage the alert
            </text>
          </g>
        </svg>
      </div>
      <div
        className="signal-result"
        style={{ "--result-color": scenario.color } as CSSProperties}
        aria-live="polite"
      >
        <span className="signal-result-icon">
          <OutcomeIcon size={19} aria-hidden="true" />
        </span>
        <div>
          <strong>{scenario.outcome}</strong>
          <p>{scenario.detail}</p>
        </div>
        <ArrowRight size={18} aria-hidden="true" />
      </div>
      <fieldset className="signal-scenarios">
        <legend>Choose a signal to follow</legend>
        <div>
          {SCENARIOS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={scenarioIndex === index}
              onClick={() => setScenarioIndex(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="signal-footnote">
        <Image src="/brand-mark-sm.png" alt="" width={15} height={13} />
        <span>Illustrated workflow · Sample signals</span>
      </div>
    </div>
  );
}
