import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fatigue lab | BLUSOC",
  description: "Explore an illustrative alert-suppression model with adjustable detection rules.",
};

export default function FatigueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
