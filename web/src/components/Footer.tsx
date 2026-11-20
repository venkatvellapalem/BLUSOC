import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-top">
          <div>
            <Link href="/" className="footer-brand">
              <Image src="/brand-mark.png" alt="" width={38} height={33} />
              <span>BLUSOC</span>
            </Link>
            <p>
              A closer look at detection engineering.
              <br />
              Built to explore. Open to build on.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/pipeline">Pipeline</Link>
            <Link href="/tech-stack">Tech stack</Link>
            <Link href="/workbench">Incident walkthrough</Link>
            <Link href="/fatigue-lab">Fatigue lab</Link>
          </nav>
          <div className="footer-source">
            <a href="https://github.com/venkatvellapalem/BLUSOC" target="_blank" rel="noreferrer">
              Find it on GitHub <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <a
              href="https://github.com/venkatvellapalem/BLUSOC/blob/main/deployment/README.md"
              target="_blank"
              rel="noreferrer"
            >
              Deployment guide <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Open source under the MIT license.</p>
          <p>Interactive showcase · Sanitized data · Simulated workflows</p>
        </div>
      </div>
    </footer>
  );
}
