"use client";

import { FATIGUE_MODEL } from "@/lib/fatigue-model.mjs";
import { Activity, Shield } from "lucide-react";

export interface BeforeAfterToggleProps {
  mode: "raw" | "tuned" | "custom";
  onSelectMode: (mode: "raw" | "tuned") => void;
  activeRuleCount: number;
  totalRuleCount: number;
}

export function BeforeAfterToggle({
  mode,
  onSelectMode,
  activeRuleCount,
  totalRuleCount,
}: BeforeAfterToggleProps) {
  const description =
    mode === "raw"
      ? `The baseline has ${FATIGUE_MODEL.baselineVolume.toLocaleString()} daily alerts. Known noise and threat signals share the same queue.`
      : mode === "tuned"
        ? `All four filters leave ${FATIGUE_MODEL.tunedVolume} daily alerts in this model: ${FATIGUE_MODEL.trueSignals} threat signals and four residual benign events.`
        : "Your selection filters part of the known noise. Toggle rules below to compare their effect on the queue.";

  return (
    <section
      className="rounded-2xl border border-brand-border bg-white p-6 sm:p-8"
      aria-label="Compare tuning modes"
    >
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-brand-text-primary">Compare the queues</h2>
          <p className="mt-1 text-sm text-brand-text-secondary">
            Start with the baseline, then try the filters.
          </p>
        </div>
        <div className="inline-grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-brand-border bg-brand-muted p-1">
          {(
            [
              { id: "raw", label: "Before tuning", icon: Activity },
              { id: "tuned", label: "After tuning", icon: Shield },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => onSelectMode(id)}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-xs font-semibold transition-colors sm:text-sm ${mode === id ? "bg-white text-blue-700 shadow-subtle" : "text-brand-text-secondary hover:bg-white/60"}`}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 border-t border-brand-border pt-5">
        <p className="text-xs font-semibold text-blue-700">
          {activeRuleCount} of {totalRuleCount} filters enabled
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-text-secondary">
          {description}
        </p>
      </div>
    </section>
  );
}
