import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function WorkbenchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-brand-text-secondary hover:text-brand-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Overview</span>
      </Link>
      <div className="rounded-xl border border-brand-border bg-brand-surface p-8 shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-text-primary">
              Analyst Triage Workbench
            </h1>
            <p className="text-xs text-brand-text-secondary">
              67 Confirmed True Positive Attack Incident Queue
            </p>
          </div>
        </div>
        <p className="text-sm text-brand-text-secondary">
          Module ready for Task 7 real-time alert triage queue, raw log inspector, and verdict modal implementation.
        </p>
      </div>
    </div>
  );
}
