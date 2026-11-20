import { Footer } from "@/components/Footer";
import { MotionPreferences } from "@/components/MotionPreferences";
import { Navbar } from "@/components/Navbar";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const plusJakartaSans = localFont({
  src: "../fonts/plusjakartasans.ttf",
  weight: "200 800",
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "../fonts/jetbrainsmono.ttf",
  weight: "100 800",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BLUSOC | Cut through the noise",
  description:
    "Explore how security alerts become meaningful signals. Interactive detection and response demos, open-source Wazuh rules, and practical deployment guides.",
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
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Navbar />

        {/* Main Application Body */}
        <main id="main-content" className="flex-1 relative" tabIndex={-1}>
          <MotionPreferences>{children}</MotionPreferences>
        </main>

        {/* Global Application Footer */}
        <Footer />
      </body>
    </html>
  );
}
