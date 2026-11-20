import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Incident walkthrough | BLUSOC",
  description: "Explore the evidence and illustrated triage journey behind one sanitized alert.",
};

export default function WorkbenchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
