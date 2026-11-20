import { NoisePreview } from "@/components/home/NoisePreview";
import { SignalFlow } from "@/components/home/SignalFlow";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  FileSearch,
  GitBranch,
  GitFork,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const REPOSITORY = "https://github.com/venkatvellapalem/BLUSOC";
const PLATFORMS = [
  { name: "Wazuh", logo: "/logos/wazuh.svg" },
  { name: "Suricata", logo: "/logos/suricata.png" },
  { name: "CrowdStrike", logo: "/logos/crowdstrike.png" },
  { name: "n8n", logo: "/logos/n8n.png" },
  { name: "Laya", logo: "/logos/laya.svg" },
  { name: "DFIR-IRIS", logo: "/logos/dfir-iris.png" },
];
const EXPLORATIONS = [
  {
    href: "/pipeline",
    title: "Follow the signal",
    description:
      "Send a sample alert through the pipeline. See what gets filtered, enriched, and escalated.",
    action: "Explore the pipeline",
    icon: GitFork,
    className: "exploration-blue",
  },
  {
    href: "/workbench",
    title: "Inside an investigation",
    description:
      "Open a sanitized incident and follow its evidence, triage decisions, and response.",
    action: "Open the walkthrough",
    icon: FileSearch,
    className: "exploration-ink",
  },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="site-container home-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">
            Cut through
            <br />
            the <span>noise.</span>
          </h1>
          <p className="hero-description">
            A clearer view of security operations. Explore how BLUSOC turns scattered alerts into
            the signals that deserve attention.
          </p>
          <div className="hero-actions">
            <Link href="/pipeline" className="button-primary">
              Explore the pipeline <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href={REPOSITORY} target="_blank" rel="noreferrer" className="button-text">
              View on GitHub <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="hero-note">
            <GitBranch size={15} aria-hidden="true" />
            <span>Open source. Real rules. Interactive demos.</span>
          </div>
        </div>
        <SignalFlow />
        <a href="#explore" className="hero-scroll">
          <ArrowDown size={15} aria-hidden="true" />
          <span>There’s a story behind every signal</span>
        </a>
      </section>
      <section className="platform-strip" aria-label="Platforms represented in the showcase">
        <div className="site-container platform-inner">
          <p>
            Different tools.
            <br />
            <strong>One connected story.</strong>
          </p>
          <div className="platform-logos">
            {PLATFORMS.map((platform) => (
              <div key={platform.name}>
                <Image
                  src={platform.logo}
                  alt=""
                  width={27}
                  height={27}
                  className="platform-logo"
                />
                <span>{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        id="explore"
        className="site-container explore-section"
        aria-labelledby="explore-title"
      >
        <div className="section-intro">
          <h2 id="explore-title">
            Security operations,
            <br />
            <span>made visible.</span>
          </h2>
          <p>
            You don’t need to run a security team to understand the journey. Step inside the demos
            and see how the pieces connect.
          </p>
        </div>
        <div className="exploration-grid">
          {EXPLORATIONS.map((item) => (
            <Link href={item.href} key={item.href} className={`exploration-link ${item.className}`}>
              <div className="exploration-top">
                <item.icon size={27} strokeWidth={1.5} aria-hidden="true" />
                <ArrowUpRight size={23} aria-hidden="true" />
              </div>
              {item.href === "/pipeline" ? (
                <div className="mini-flow" aria-hidden="true">
                  <span>Collect</span>
                  <i />
                  <span>Understand</span>
                  <i />
                  <span>Respond</span>
                </div>
              ) : (
                <div className="mini-incident" aria-hidden="true">
                  <span className="incident-dot" />
                  <span>Threat intelligence match</span>
                  <span>High</span>
                </div>
              )}
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className="exploration-action">
                {item.action} <ArrowRight size={16} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="noise-section" aria-labelledby="noise-title">
        <div className="site-container noise-layout">
          <div>
            <SlidersHorizontal size={29} strokeWidth={1.5} aria-hidden="true" />
            <h2 id="noise-title">
              Fewer distractions.
              <br />
              Better decisions.
            </h2>
            <p>
              What happens when familiar, harmless events stop filling the queue? Switch the filters
              and see for yourself.
            </p>
            <Link href="/fatigue-lab" className="button-primary">
              Try the fatigue lab <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <NoisePreview />
        </div>
      </section>
      <section className="site-container engineering-section" aria-labelledby="engineering-title">
        <div>
          <h2 id="engineering-title">Go beyond the demo.</h2>
          <p>
            Inspect the detection rules, explore the architecture, or set up your own environment.
            The engineering is open for you to build on.
          </p>
          <a className="button-text" href={REPOSITORY} target="_blank" rel="noreferrer">
            Explore the repository <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
        <div className="engineering-links">
          {[
            {
              href: `${REPOSITORY}/tree/main/detection-engineering`,
              title: "Detection rules",
              detail: "Wazuh rules and validation scenarios",
            },
            {
              href: `${REPOSITORY}/blob/main/deployment/README.md`,
              title: "Run it yourself",
              detail: "Environment setup and server provisioning",
            },
            {
              href: "/tech-stack",
              title: "Meet the stack",
              detail: "The tools and their role in the bigger picture",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="engineering-link"
              {...(item.href.startsWith("https") ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              <span>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </span>
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
