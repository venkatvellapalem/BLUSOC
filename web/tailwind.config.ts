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
          canvas: "#FAFBFC",
          surface: "#FFFFFF",
          "surface-2": "#F4F6F9",
          border: "#E7EBF1",
          "border-subtle": "rgba(226, 232, 240, 0.7)",
          muted: "#F2F5F8",
          "text-primary": "#0F172A",
          "text-secondary": "#475569",
          "text-muted": "#94A3B8",
          accent: "#2563EB",
          "accent-soft": "#0EA5E9",
          signal: "#10B981",
          threat: "#F43F5E",
          warn: "#F59E0B",
        },
        status: {
          critical: "#E11D48",
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
        subtle: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 0 0 rgba(255,255,255,0.8) inset",
        "card-hover": "0 8px 24px -12px rgba(15, 23, 42, 0.14)",
        glow: "0 0 0 1px rgba(37, 99, 235, 0.08), 0 8px 24px -12px rgba(37, 99, 235, 0.25)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "radar-sweep": "radar 4s linear infinite",
        "dash-flow": "dashFlow 1.2s linear infinite",
        "dash-flow-slow": "dashFlow 2.4s linear infinite",
        "pulse-ring": "pulseRing 2.6s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        "pulse-ring-fast": "pulseRing 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        "float-slow": "floatSlow 6s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        beam: "beam 2.8s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
      },
      keyframes: {
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        dashFlow: {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.6)", opacity: "0.7" },
          "80%": { transform: "scale(2.2)", opacity: "0" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        beam: {
          "0%, 100%": { opacity: "0.35", transform: "translateX(-10%)" },
          "50%": { opacity: "0.9", transform: "translateX(10%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
