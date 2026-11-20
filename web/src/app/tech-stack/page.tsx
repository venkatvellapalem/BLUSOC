import type { Metadata } from "next";
import { PageIntro } from "@/components/PageIntro";
import {
  Bell,
  BookOpen,
  Boxes,
  Code2,
  Layers,
  Network,
  Radar,
  Server,
  Shield,
  Sparkles,
  Workflow,
  Wrench,
} from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Tech stack | BLUSOC",
  description: "Explore the platforms and engineering behind the BLUSOC showcase.",
};

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
    description:
      "Core platforms that collect telemetry, suppress noise, enrich context, decide, and track investigations.",
    icon: Layers,
    items: [
      {
        name: "Wazuh",
        subtitle: "SIEM & correlation engine",
        description:
          "Normalizes multi-source telemetry, correlates events, applies detection rules, and suppresses known benign noise. Forwards only qualifying alerts to n8n.",
        logo: "/logos/wazuh.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-blue-50 to-white border-blue-100",
      },
      {
        name: "n8n SOAR",
        subtitle: "Orchestration & enrichment workflows",
        description:
          "In the illustrated workflow, enriches qualifying alerts with threat context and routes them to Laya. These workflows and provider connectors are supplied separately.",
        logo: "/logos/n8n.png",
        logoW: 28,
        logoH: 28,
        accent: "from-rose-50 to-white border-rose-100",
      },
      {
        name: "Laya",
        subtitle: "AI-assisted alert triage",
        description:
          "Reviews enriched qualifying alerts, determines verdict and confidence, and routes outcomes: IRIS tickets for true positive high-confidence alerts, notifications to Discord/Slack, and containment to FortiGate.",
        logo: "/logos/laya.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-violet-50 to-white border-violet-100",
      },
      {
        name: "DFIR-IRIS",
        subtitle: "Case & ticket management",
        description:
          "Stores alerts, evidence, and investigations. The runnable reference stack connects it to Wazuh through the included Python adapter.",
        logo: "/logos/dfir-iris.png",
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
        description:
          "High-fidelity endpoint telemetry and detections across workstations and servers, feeding process, identity, and threat signals into correlation.",
        logo: "/logos/crowdstrike.png",
        logoW: 28,
        logoH: 28,
        accent: "from-red-50 to-white border-red-100",
      },
      {
        name: "Suricata",
        subtitle: "Network IDS / DPI",
        description:
          "Deep packet inspection on network taps producing EVE JSON alerts for threat intel matches, protocol anomalies, and intrusion signatures.",
        logo: "/logos/suricata.png",
        logoW: 28,
        logoH: 28,
        accent: "from-orange-50 to-white border-orange-100",
      },
      {
        name: "Sophos",
        subtitle: "Endpoint protection",
        description:
          "Endpoint protection and malware prevention telemetry contributing detection and health signals for correlated analysis.",
        logo: "/logos/sophos.png",
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
        description:
          "Sign-in, audit, and service activity that helps detect account abuse, suspicious access, and risky cloud behavior.",
        logo: "/logos/microsoft-365.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-blue-50 to-white border-blue-100",
      },
      {
        name: "Barracuda",
        subtitle: "Email & gateway security",
        description:
          "Inbound/outbound email and gateway events for phishing, spam, and policy enforcement signals ingested for correlation.",
        logo: "/logos/barracuda.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-cyan-50 to-white border-cyan-100",
      },
      {
        name: "Cloudflare WAF",
        subtitle: "Edge & web application protection",
        description:
          "Edge traffic and WAF events that provide visibility into web attacks, abusive requests, and perimeter activity.",
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
        description:
          "Receives routed alert notifications from Laya for timely SOC awareness and coordination.",
        logo: "/logos/discord.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-indigo-50 to-white border-indigo-100",
      },
      {
        name: "Slack",
        subtitle: "SOC alert notifications",
        description:
          "Delivers alert notifications to SOC channels so responders can track qualifying and triaged events in real time.",
        logo: "/logos/slack.svg",
        logoW: 28,
        logoH: 28,
        accent: "from-fuchsia-50 to-white border-fuchsia-100",
      },
      {
        name: "FortiGate",
        subtitle: "Network firewall & containment",
        description:
          "Executes containment actions to isolate affected systems (quarantine/block) when Laya confirms a threat requiring response.",
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
        name: "Next.js 16 (App Router)",
        subtitle: "React framework",
        description:
          "App Router pages and layouts, static/prerendered routes, optimized images, and Vercel-ready builds for the BLUSOC showcase.",
        icon: Code2,
        accent: "from-slate-50 to-white border-slate-200",
      },
      {
        name: "React 19 & TypeScript",
        subtitle: "UI and type safety",
        description:
          "Component-driven UI with strict TypeScript for pipeline simulations, data models, and interactive views.",
        icon: Code2,
        accent: "from-sky-50 to-white border-sky-100",
      },
      {
        name: "Tailwind CSS & Framer Motion",
        subtitle: "Design system & animation",
        description:
          "Utility-first styling, custom design tokens, and rich motion/transition effects for flow diagrams, simulators, and page reveals.",
        icon: Sparkles,
        accent: "from-cyan-50 to-white border-cyan-100",
      },
      {
        name: "Lucide React & SVG assets",
        subtitle: "Icons and branding",
        description:
          "Consistent iconography plus custom/brand SVG and image assets (product logos, BLUSOC mark) across pages and diagrams.",
        icon: Boxes,
        accent: "from-indigo-50 to-white border-indigo-100",
      },
    ],
  },
  {
    id: "engineering",
    title: "Detection Engineering & Integrations",
    description:
      "Rules, middleware, and automation artifacts that power correlation and response routing.",
    icon: Wrench,
    items: [
      {
        name: "Wazuh detection content",
        subtitle: "XML rules and test scenarios",
        description:
          "Suppression, authentication, and threat-intelligence rules under detection-engineering/wazuh, with sample events and modeled validation scenarios.",
        icon: Shield,
        accent: "from-blue-50 to-white border-blue-100",
      },
      {
        name: "custom-iris adapter",
        subtitle: "Wazuh → IRIS forwarding",
        description:
          "Maps severity, classifies addresses, attaches typed IOCs, and forwards Wazuh alerts to IRIS over authenticated HTTPS.",
        icon: Workflow,
        accent: "from-rose-50 to-white border-rose-100",
      },
      {
        name: "IRIS status monitor",
        subtitle: "Persistent status tracking",
        description:
          "Follows paginated IRIS alerts, records status and owner changes, and preserves a local SQLite baseline across restarts.",
        icon: Network,
        accent: "from-violet-50 to-white border-violet-100",
      },
      {
        name: "Docker & mock services",
        subtitle: "Integration environment",
        description:
          "A Compose stack for IRIS and a separate loopback-only mock API for local HTTP integration tests.",
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
        description:
          "Bash deployment/provisioning scripts, configuration templates, and systemd units for operating BLUSOC services on Ubuntu hosts.",
        icon: Server,
        accent: "from-emerald-50 to-white border-emerald-100",
      },
      {
        name: "Sanitized alert dataset",
        subtitle: "data/alerts_sanitized.json",
        description:
          "Sanitized incident records spanning multiple attack categories used for read-only sample demonstrations in the showcase.",
        icon: BookOpen,
        accent: "from-amber-50 to-white border-amber-100",
      },
      {
        name: "Architecture & playbooks",
        subtitle: "docs/ and engineering references",
        description:
          "Architecture diagrams/notes, incident response playbook, and repository documentation describing detection and response design.",
        icon: BookOpen,
        accent: "from-sky-50 to-white border-sky-100",
      },
    ],
  },
];

export default function TechStackPage() {
  return (
    <div className="site-container">
      <PageIntro
        title="Different tools. A connected purpose."
        description="Meet the platforms behind the illustrated workflow, and the engineering you can explore in this repository."
        breadcrumb="Tech stack"
        status="Platform guide"
      />
      <div className="mb-8 rounded-lg border border-blue-100 bg-blue-50 px-5 py-4 text-xs leading-relaxed text-blue-900">
        The showcase illustrates the wider Wazuh → n8n → Laya workflow. The server deployment
        installs Wazuh and DFIR-IRIS with a direct Python integration. Vendor connectors and
        orchestration workflows are separate integrations.
      </div>
      <div className="stack-directory">
        <nav className="stack-index" aria-label="Stack categories">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>
        <div>
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="stack-category">
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              {section.items.map((item) => (
                <article key={item.name} className="stack-row">
                  <span className="stack-row-logo">
                    {item.logo ? (
                      <Image
                        src={item.logo}
                        alt=""
                        width={28}
                        height={28}
                        className="h-7 w-7 object-contain"
                      />
                    ) : item.icon ? (
                      <item.icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    ) : null}
                  </span>
                  <div>
                    <h3>{item.name}</h3>
                    <small>{item.subtitle}</small>
                  </div>
                  <p>{item.description}</p>
                </article>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
