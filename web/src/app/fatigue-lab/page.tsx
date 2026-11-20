"use client";

import { PageIntro } from "@/components/PageIntro";
import { BeforeAfterToggle } from "@/components/fatigue/BeforeAfterToggle";
import { ImpactCounterGrid } from "@/components/fatigue/ImpactCounterGrid";
import { NoiseStormSimulator } from "@/components/fatigue/NoiseStormSimulator";
import { RuleOptimizerMatrix, SUPPRESSION_RULES } from "@/components/fatigue/RuleOptimizerMatrix";
import { calculateFatigueImpact } from "@/lib/fatigue-model.mjs";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

const ruleSelection = (enabled: boolean) =>
  Object.fromEntries(SUPPRESSION_RULES.map((rule) => [rule.id, enabled]));

export default function FatigueLabPage() {
  const [activeRules, setActiveRules] = useState<Record<string, boolean>>(() =>
    ruleSelection(true),
  );
  const activeRuleCount = Object.values(activeRules).filter(Boolean).length;
  const mode =
    activeRuleCount === SUPPRESSION_RULES.length
      ? "tuned"
      : activeRuleCount === 0
        ? "raw"
        : "custom";
  const suppressedVolume = SUPPRESSION_RULES.reduce(
    (total, rule) => total + (activeRules[rule.id] ? rule.eventsPerDay : 0),
    0,
  );
  const impact = calculateFatigueImpact(suppressedVolume);
  return (
    <div className="min-h-screen bg-brand-canvas pb-16">
      <div className="site-container space-y-8">
        <PageIntro
          title="Less noise. More room to think."
          description="Turn suppression rules on and off to see how a busy alert queue changes. Volumes, response times, and capacity estimates are illustrative model outputs, not live measurements."
          breadcrumb="Fatigue lab"
          status="Interactive tuning model"
        />
        <BeforeAfterToggle
          mode={mode}
          onSelectMode={(selected) => setActiveRules(ruleSelection(selected === "tuned"))}
          activeRuleCount={activeRuleCount}
          totalRuleCount={SUPPRESSION_RULES.length}
        />
        <NoiseStormSimulator suppressionRatio={impact.suppressionPct} />
        <ImpactCounterGrid {...impact} isTuned={mode === "tuned"} mode={mode} />
        <RuleOptimizerMatrix
          activeRules={activeRules}
          onToggleRule={(id) =>
            setActiveRules((previous) => ({ ...previous, [id]: !previous[id] }))
          }
          onEnableAll={() => setActiveRules(ruleSelection(true))}
          onDisableAll={() => setActiveRules(ruleSelection(false))}
        />
        <div className="flex flex-col gap-3 border-t border-brand-border pt-6 text-xs leading-relaxed text-brand-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>
            The model preserves 180 threat signals and four residual benign alerts when all
            known-noise filters are enabled.
          </p>
          <a
            className="button-text shrink-0"
            href="https://github.com/venkatvellapalem/BLUSOC/tree/main/detection-engineering"
            target="_blank"
            rel="noreferrer"
          >
            Inspect the actual rules <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
