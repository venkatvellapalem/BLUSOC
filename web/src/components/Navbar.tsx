"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { name: "Overview", href: "/" },
  { name: "Pipeline", href: "/pipeline" },
  { name: "Tech stack", href: "/tech-stack" },
  { name: "Incident walkthrough", href: "/workbench" },
  { name: "Fatigue lab", href: "/fatigue-lab" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileMenuOpen]);
  return (
    <header className="site-header">
      <div className="site-container nav-inner">
        <Link href="/" className="brand-link" aria-label="BLUSOC overview">
          <Image src="/brand-mark.png" alt="" width={43} height={37} priority />
          <span>
            BLUSOC<span>Blue team. Clear signals.</span>
          </span>
        </Link>
        <nav className="desktop-navigation" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <a
          href="https://github.com/venkatvellapalem/BLUSOC"
          target="_blank"
          rel="noreferrer"
          className="nav-source"
        >
          GitHub <ArrowUpRight size={16} aria-hidden="true" />
        </a>
        <button
          type="button"
          className="menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileMenuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.name}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          ))}
          <a href="https://github.com/venkatvellapalem/BLUSOC" target="_blank" rel="noreferrer">
            GitHub
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </nav>
      )}
    </header>
  );
}
