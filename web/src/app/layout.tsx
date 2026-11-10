import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BLUSOC - Enterprise Blue-Team Engineering and Detection Operations",
  description:
    "Production-grade Wazuh detection rules, Python middleware integrations, and interactive light-themed SOC telemetry lab with 67 confirmed true positive attack investigations.",
  keywords: [
    "SOC",
    "Detection Engineering",
    "Wazuh",
    "DFIR-IRIS",
    "Suricata",
    "Blue Team",
    "Threat Intelligence",
    "MITRE ATT&CK",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-brand-canvas font-sans text-brand-text-primary antialiased flex flex-col">
        {/* Sticky Top Telemetry Status Bar */}
        <aside aria-label="System telemetry status" className="sticky top-0 z-50 w-full border-b border-brand-border bg-slate-900 text-slate-100 text-xs font-mono py-1.5 px-4 shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold tracking-wide text-slate-200">
                BLUSOC OPERATIONAL: 87.1% NOISE SUPPRESSION ACTIVE
              </span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="hidden sm:inline text-slate-300">
                Daily Ingestion: 14,280 &rarr; 184 Incidents
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="hidden md:inline">
                Sensors: <span className="text-emerald-400 font-semibold">4 / 4 ONLINE</span>
              </span>
              <span className="hidden md:inline text-slate-600">•</span>
              <span>
                Pipeline Latency: <span className="text-blue-400 font-semibold">1.2ms</span>
              </span>
              <span className="hidden lg:inline text-slate-600">•</span>
              <span className="hidden lg:inline">
                Correlated Attacks: <span className="text-amber-400 font-semibold">67 TPs</span>
              </span>
            </div>
          </div>
        </aside>

        {/* Global Navigation Bar */}
        <Navbar />

        {/* Main Application Body */}
        <main className="flex-1">
          {children}
        </main>

        {/* Global Application Footer */}
        <Footer />
      </body>
    </html>
  );
}
