import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pipeline | BLUSOC",
  description: "Follow a sample signal through collection, enrichment, triage, and response.",
};

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
