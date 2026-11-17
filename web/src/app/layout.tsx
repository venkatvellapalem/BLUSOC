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
  title: "BLUSOC | Enterprise Blue-Team Engineering & Detection Operations",
  description:
    "Production-grade Wazuh detection rules, Python middleware integrations, and an interactive light-themed SOC telemetry lab showcasing detection and response engineering.",
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
      <body className="min-h-screen bg-brand-canvas font-sans text-brand-text-primary antialiased flex flex-col relative overflow-x-hidden">
        {/* Subtle top ambient wash */}
        <div aria-hidden="true" className="pointer-events-none fixed -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-blue-100/40 blur-3xl" />

        {/* Global Navigation Bar */}
        <Navbar />

        {/* Main Application Body */}
        <main className="flex-1 relative z-10">
          {children}
        </main>

        {/* Global Application Footer */}
        <Footer />
      </body>
    </html>
  );
}
