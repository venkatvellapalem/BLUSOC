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
      <body className="min-h-screen bg-brand-canvas font-sans text-brand-text-primary antialiased flex flex-col relative overflow-x-hidden">
        {/* Soft Ambient Light Glows */}
        <div aria-hidden="true" className="pointer-events-none fixed -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none fixed top-1/4 -right-32 w-[32rem] h-[32rem] rounded-full bg-emerald-400/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none fixed -bottom-32 left-1/3 w-96 h-96 rounded-full bg-sky-300/10 blur-3xl" />

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
