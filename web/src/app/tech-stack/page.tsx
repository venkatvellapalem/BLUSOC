import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield, Radar, Network, Bell, Lock, Layers, Server, Workflow, Code2, Boxes, Wrench, BookOpen, Sparkles } from "lucide-react";

type Item = {
  name: string;
  subtitle: string;
  description: string;
  logo?: string;
  logoW?: number;
  logoH?: number;
  icon?: React.ComponentType<{ className?: string }>;
  accent: string;
};

type Section = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Item[];
};

const SECTIONS: Section[] = [
  {
    id: "correlation",
    title: "Correlation, Orchestration & Triage",
    description: "Core platforms that collect telemetry, suppress noise, enrich context, decide, and track investigations.",
    icon: Layers,
    items: [
      {
        name: "Wazuh",
        subtitle: "SIEM & correlation engine",
        description: "Normalizes multi-source telemetry, correlates events, applies detection rules, and suppresses known benign noise. Forwards only qualifying alerts to n8n.",
        logo: "/logos/wazuh.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-blue-50 to-white border-blue-100",
      },
      {
        name: "n8n SOAR",
        subtitle: "Orchestration & enrichment workflows",
        description: "Receives qualifying alerts via custom-n8n integration (webhook, DLQ), enriches with multi-feed threat intel (VirusTotal, AbuseIPDB, OTX, etc.), and routes to Laya for verdicting.",
        logo: "/logos/n8n.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-rose-50 to-white border-rose-100",
      },
      {
        name: "Laya",
        subtitle: "AI-assisted alert triage",
        description: "Reviews enriched qualifying alerts, determines verdict and confidence, and routes outcomes: IRIS tickets for true positive high-confidence alerts, notifications to Discord/Slack, and containment to FortiGate.",
        logo: "/logos/laya.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-violet-50 to-white border-violet-100",
      },
      {
        name: "DFIR-IRIS",
        subtitle: "Case & ticket management",
        description: "Receives tickets only for true positive, high-confidence alerts. Analysts investigate, document, and close cases in IRIS (no direct alerting from Wazuh).",
        logo: "/logos/dfir-iris.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-sky-50 to-white border-sky-100",
      },
    ],
  },
  {
    id: "endpoint-network",
    title: "Endpoint & Network Detection",
    description: "Telemetry sources that surface endpoint, network, and perimeter activity.",
    icon: Radar,
    items: [
      {
        name: "CrowdStrike Falcon",
        subtitle: "Endpoint detection & response (EDR)",
        description: "High-fidelity endpoint telemetry and detections across workstations and servers, feeding process, identity, and threat signals into correlation.",
        logo: "/logos/crowdstrike.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-red-50 to-white border-red-100",
      },
      {
        name: "Suricata",
        subtitle: "Network IDS / DPI",
        description: "Deep packet inspection on network taps producing EVE JSON alerts for threat intel matches, protocol anomalies, and intrusion signatures.",
        logo: "/logos/suricata.png",
        logoW: 28,
        logoH: 28,
        accent: "from-orange-50 to-white border-orange-100",
      },
      {
        name: "Sophos",
        subtitle: "Endpoint protection",
        description: "Endpoint protection and malware prevention telemetry contributing detection and health signals for correlated analysis.",
        logo: "/logos/sophos.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-sky-50 to-white border-sky-100",
      },
    ],
  },
  {
    id: "identity-email-edge",
    title: "Identity, Email & Edge",
    description: "Identity, messaging, and edge controls that expand visibility and prevention.",
    icon: Shield,
    items: [
      {
        name: "Microsoft 365",
        subtitle: "Identity, email & audit telemetry",
        description: "Sign-in, audit, and service activity that helps detect account abuse, suspicious access, and risky cloud behavior.",
        logo: "/logos/microsoft-365.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-blue-50 to-white border-blue-100",
      },
      {
        name: "Barracuda",
        subtitle: "Email & gateway security",
        description: "Inbound/outbound email and gateway events for phishing, spam, and policy enforcement signals ingested for correlation.",
        logo: "/logos/barracuda.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-cyan-50 to-white border-cyan-100",
      },
      {
        name: "Cloudflare WAF",
        subtitle: "Edge & web application protection",
        description: "Edge traffic and WAF events that provide visibility into web attacks, abusive requests, and perimeter activity.",
        logo: "/logos/cloudflare.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-amber-50 to-white border-amber-100",
      },
    ],
  },
  {
    id: "response",
    title: "Notifications & Containment",
    description: "Channels and controls used to alert responders and isolate affected systems.",
    icon: Bell,
    items: [
      {
        name: "Discord",
        subtitle: "SOC alert notifications",
        description: "Receives routed alert notifications from Laya for timely SOC awareness and coordination.",
        logo: "/logos/discord.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-indigo-50 to-white border-indigo-100",
      },
      {
        name: "Slack",
        subtitle: "SOC alert notifications",
        description: "Delivers alert notifications to SOC channels so responders can track qualifying and triaged events in real time.",
        logo: "/logos/slack.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-fuchsia-50 to-white border-fuchsia-100",
      },
      {
        name: "FortiGate",
        subtitle: "Network firewall & containment",
        description: "Executes containment actions to isolate affected systems (quarantine/block) when Laya confirms a threat requiring response.",
        logo: "/logos/fortinet.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-rose-50 to-white border-rose-100",
      },
    ],
  },
  {
    id: "web",
    title: "Web Showcase & Frontend",
    description: "Technologies used to build this light-themed, animated portfolio showcase.",
    icon: Code2,
    items: [
      {
        name: "Next.js 14 (App Router)",
        subtitle: "React framework",
        description: "App Router pages and layouts, static/prerendered routes, optimized images, and Vercel-ready builds for the BLUSOC showcase.",
        icon: Code2,
        accent: "from-slate-50 to-white border-slate-200",
      },
      {
        name: "React 18 & TypeScript",
        subtitle: "UI and type safety",
        description: "Component-driven UI with strict TypeScript for pipeline simulations, data models, and interactive views.",
        icon: Code2,
        accent: "from-sky-50 to-white border-sky-100",
      },
      {
        name: "Tailwind CSS & Framer Motion",
        subtitle: "Design system & animation",
        description: "Utility-first styling, custom design tokens, and rich motion/transition effects for flow diagrams, simulators, and page reveals.",
        icon: Sparkles,
        accent: "from-cyan-50 to-white border-cyan-100",
      },
      {
        name: "Lucide React & SVG assets",
        subtitle: "Icons and branding",
        description: "Consistent iconography plus custom/brand SVG and image assets (product logos, BLUSOC mark) across pages and diagrams.",
        icon: Boxes,
        accent: "from-indigo-50 to-white border-indigo-100",
      },
    ],
  },
  {
    id: "engineering",
    title: "Detection Engineering & Integrations",
    description: "Rules, middleware, and automation artifacts that power correlation and response routing.",
    icon: Wrench,
    items: [
      {
        name: "Wazuh detection content",
        subtitle: "XML rules, decoders, and tests",
        description: "Custom suppression/correlation/threat-intel rules and decoders under detection-engineering/wazuh with sample events and validation harnesses (e.g. validate_rules.py).",
        icon: Shield,
        accent: "from-blue-50 to-white border-blue-100",
      },
      {
        name: "custom-n8n integration",
        subtitle: "Wazuh → n8n forwarding",
        description: "Integration path that forwards qualifying Wazuh alerts to n8n webhooks with normalization and DLQ handling for reliable orchestration.",
        icon: Workflow,
        accent: "from-rose-50 to-white border-rose-100",
      },
      {
        name: "custom-iris & sync daemon",
        subtitle: "IRIS ticketing and status sync",
        description: "custom-iris integration for alert/ticket creation and iris_status_daemon for synchronization workflows, exercised with tests and mock services.",
        icon: Network,
        accent: "from-violet-50 to-white border-violet-100",
      },
      {
        name: "Docker & mock services",
        subtitle: "Integration environment",
        description: "Docker Compose definitions, mock IRIS/server components, and integration test suites to validate end-to-end routing behavior.",
        icon: Boxes,
        accent: "from-slate-50 to-white border-slate-200",
      },
    ],
  },
  {
    id: "infra-data",
    title: "Infrastructure, Data & Documentation",
    description: "Deployment tooling and supporting artifacts included in the repository.",
    icon: Server,
    items: [
      {
        name: "Ubuntu deployment automation",
        subtitle: "Scripts, templates, systemd",
        description: "Bash deployment/provisioning scripts, configuration templates, and systemd units for operating BLUSOC services on Ubuntu hosts.",
        icon: Server,
        accent: "from-emerald-50 to-white border-emerald-100",
      },
      {
        name: "Sanitized alert dataset",
        subtitle: "data/alerts_sanitized.json",
        description: "Sanitized incident records spanning multiple attack categories used for read-only sample demonstrations in the showcase.",
        icon: BookOpen,
        accent: "from-amber-50 to-white border-amber-100",
      },
      {
        name: "Architecture & playbooks",
        subtitle: "docs/ and engineering references",
        description: "Architecture diagrams/notes, incident response playbook, and repository documentation describing detection and response design.",
        icon: BookOpen,
        accent: "from-sky-50 to-white border-sky-100",
      },
    ],
  },
];

export default function TechStackPage() {
  return (
    <div className="min-h-screen bg-brand-canvas">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-14 pb-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-secondary hover:text-brand-text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </Link>

        <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-3xl">
            <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-brand-text-secondary">BLUSOC Stack</p>
            <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-[-0.04em] text-brand-text-primary">Tech Stack</h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-brand-text-secondary">
              A deep view of the platforms, engineering artifacts, and web technologies behind BLUSOC — from sensors, Wazuh correlation, and n8n enrichment to Laya triage, DFIR-IRIS ticketing, notifications, containment, and this showcase site itself.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Detection", icon: Radar },
              { label: "Orchestration", icon: Workflow },
              { label: "Triage", icon: Network },
              { label: "Response", icon: Lock },
              { label: "Web", icon: Code2 },
              { label: "Engineering", icon: Wrench },
            ].map((chip) => {
              const Icon = chip.icon;
              return (
                <span key={chip.label} className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-brand-text-secondary shadow-sm">
                  <Icon className="h-3.5 w-3.5 text-blue-600" /> {chip.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-14">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-brand-border shadow-sm">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-[-0.02em] text-brand-text-primary">{section.title}</h2>
                  <p className="mt-1 text-sm text-brand-text-secondary max-w-2xl">{section.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {section.items.map((item) => (
                  <article key={item.name} className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${item.accent} p-6 shadow-sm hover:shadow-md transition-all`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 min-w-14 items-center justify-center rounded-xl bg-white/80 border border-white shadow-sm px-3">
                        {item.logo ? (
                          <Image
                            src={item.logo}
                            alt={`${item.name} logo`}
                            width={item.logoW ?? 28}
                            height={item.logoH ?? 28}
                            className="h-7 w-auto object-contain max-w-[110px]"
                          />
                        ) : item.icon ? (
                          <item.icon className="h-6 w-6 text-blue-600" />
                        ) : null}
                      </div>
                      <span className="font-mono text-[10px] tracking-wide uppercase text-brand-text-muted">Integrated</span>
                    </div>
                    <h3 className="mt-5 text-lg font-bold tracking-[-0.02em] text-brand-text-primary">{item.name}</h3>
                    <p className="mt-0.5 text-xs font-medium text-brand-text-secondary">{item.subtitle}</p>
                    <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
