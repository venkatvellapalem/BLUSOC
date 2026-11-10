import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          canvas: "#F8FAFC",
          surface: "#FFFFFF",
          border: "#E2E8F0",
          "border-subtle": "rgba(226, 232, 240, 0.8)",
          muted: "#F1F5F9",
          "text-primary": "#0F172A",
          "text-secondary": "#334155",
          "text-muted": "#64748B",
        },
        status: {
          critical: "#DC2626",
          high: "#EA580C",
          medium: "#D97706",
          low: "#2563EB",
          resolved: "#059669",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)",
        card: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
        "card-hover": "0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
        glass: "0 8px 32px 0 rgba(15, 23, 42, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)",
        glow: "0 0 24px -4px rgba(37, 99, 235, 0.15)",
        "glow-emerald": "0 0 24px -4px rgba(16, 185, 129, 0.2)",
        "glow-crimson": "0 0 24px -4px rgba(220, 38, 38, 0.2)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-sweep": "radar 4s linear infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
