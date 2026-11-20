"use client";

import { PageIntro } from "@/components/PageIntro";
import NodeDetailDrawer from "@/components/pipeline/NodeDetailDrawer";
import PipelineCanvas from "@/components/pipeline/PipelineCanvas";
import TelemetryPacketSimulator from "@/components/pipeline/TelemetryPacketSimulator";
import { SIMULATION_PRESETS, SimulationStepLog } from "@/components/pipeline/pipelineData";
import { Sparkles, Workflow } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export default function PipelinePage() {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("intel-tp-iris");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<SimulationStepLog[]>([]);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const activePreset =
    SIMULATION_PRESETS.find((p) => p.id === selectedPresetId) || SIMULATION_PRESETS[0];

  const pushStep = (step: number, presetId: string) => {
    const preset = SIMULATION_PRESETS.find((p) => p.id === presetId)!;
    const logs = preset.terminalLogs.filter((l) => l.step === step);
    setSimulationStep(step);
    if (logs.length) setTerminalLogs((prev) => [...prev, ...logs]);
  };

  const handleStartSimulation = () => {
    if (isSimulating) return;
    clearTimers();
    setIsSimulating(true);
    setSimulationStep(0);
    setTerminalLogs([]);
    const id = activePreset.id;
    const isSuppressed = activePreset.outcome === "suppressed";

    timersRef.current.push(setTimeout(() => pushStep(1, id), 150));
    timersRef.current.push(setTimeout(() => pushStep(2, id), 700));
    if (isSuppressed) {
      timersRef.current.push(setTimeout(() => setIsSimulating(false), 1150));
    } else {
      timersRef.current.push(setTimeout(() => pushStep(3, id), 1300));
      timersRef.current.push(setTimeout(() => pushStep(4, id), 1900));
      timersRef.current.push(
        setTimeout(() => {
          pushStep(5, id);
          setIsSimulating(false);
        }, 2500),
      );
    }
  };

  const handleResetSimulation = () => {
    clearTimers();
    setIsSimulating(false);
    setSimulationStep(0);
    setTerminalLogs([]);
  };

  const handleSelectPreset = (presetId: string) => {
    clearTimers();
    setSelectedPresetId(presetId);
    setIsSimulating(false);
    setSimulationStep(0);
    setTerminalLogs([]);
  };

  return (
    <div className="min-h-screen bg-brand-canvas pb-16">
      <div className="site-container space-y-8">
        <PageIntro
          title="Follow a signal. See what happens."
          description="Choose a scenario, send a sample alert, and follow its journey through collection, enrichment, triage, and response. Select a stage to look inside."
          breadcrumb="Pipeline"
          status="Simulated reference design"
        />
        <div>
          <TelemetryPacketSimulator
            selectedPresetId={selectedPresetId}
            onSelectPreset={handleSelectPreset}
            isSimulating={isSimulating}
            simulationStep={simulationStep}
            onStartSimulation={handleStartSimulation}
            onResetSimulation={handleResetSimulation}
            terminalLogs={terminalLogs}
          />
        </div>

        <div>
          <PipelineCanvas
            selectedStageId={selectedStageId}
            onSelectStage={(id) => setSelectedStageId(id)}
            activePreset={activePreset}
            simulationStep={simulationStep}
            isSimulating={isSimulating}
          />
        </div>

        <div className="rounded-2xl border border-brand-border bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-brand-text-primary">
                How this reference flow works
              </h2>
              <p className="mt-1 text-sm text-brand-text-secondary">
                This demo explores enrichment and triage with n8n and Laya. The included server
                deployment connects Wazuh directly to IRIS through the Python adapter. See the{" "}
                <a
                  className="text-blue-700 underline underline-offset-4"
                  href="https://github.com/venkatvellapalem/BLUSOC/blob/main/docs/architecture.md"
                >
                  architecture guide
                </a>{" "}
                for the implemented services.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/logos/wazuh.svg" alt="Wazuh" width={18} height={18} />
                <span className="text-sm font-semibold">Wazuh</span>
              </div>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Correlates and suppresses noise. Forwards only qualifying alerts to n8n.
              </p>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Workflow className="h-4 w-4 text-violet-700" />
                <span className="text-sm font-semibold">n8n SOAR</span>
              </div>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Enriches and normalizes qualifying alerts (TI/context) and routes them to Laya.
              </p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/logos/laya.svg" alt="Laya" width={18} height={18} />
                <span className="text-sm font-semibold">Laya</span>
              </div>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Assigns verdict/confidence and routes IRIS tickets, notifications, and containment.
              </p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/logos/dfir-iris.png" alt="DFIR-IRIS" width={18} height={18} />
                <span className="text-sm font-semibold">DFIR-IRIS</span>
              </div>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Receives tickets only for <strong>true positive, high-confidence</strong> alerts for
                analyst investigation.
              </p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-surface p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/logos/discord.svg" alt="Discord" width={16} height={16} />
                <Image src="/logos/slack.svg" alt="Slack" width={16} height={16} />
                <Image src="/logos/fortinet.svg" alt="FortiGate" width={16} height={16} />
                <span className="text-sm font-semibold">Notify &amp; Contain</span>
              </div>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Alerts to Discord/Slack. Containment isolates affected systems via FortiGate.
              </p>
            </div>
          </div>
        </div>
      </div>

      <NodeDetailDrawer
        selectedStageId={selectedStageId}
        onClose={() => setSelectedStageId(null)}
      />
    </div>
  );
}
