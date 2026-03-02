"use client";

import { useState } from "react";
import { ChevronDown, LayoutList, Cpu, Palette, DoorOpen, Shield, FileCode, ClipboardList, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OutputJSON } from "@/types";

import { RoomScheduleTab } from "./tabs/room-schedule-tab";
import { EquipmentTab } from "./tabs/equipment-tab";
import { ComplianceTab } from "./tabs/compliance-tab";
import { CodeAnalysisTab } from "./tabs/code-analysis-tab";
import { ScopeTab } from "./tabs/scope-tab";
import { FinishesTab } from "./tabs/finishes-tab";
import { CostEstimateTab } from "./tabs/cost-estimate-tab";

interface PanelConfig {
  id: string;
  label: string;
  icon: typeof LayoutList;
  badge: string;
  visible: boolean;
  render: () => React.ReactNode;
}

function Panel({
  config,
  isOpen,
  onToggle,
}: {
  config: PanelConfig;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = config.icon;
  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-stone-400" />
          <span className="text-sm font-medium text-stone-700">{config.label}</span>
          <Badge variant="secondary" className="text-[10px] bg-stone-100 text-stone-500">
            {config.badge}
          </Badge>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-stone-100 p-4">
          {config.render()}
        </div>
      )}
    </div>
  );
}

export function ContextPanels({ output }: { output: OutputJSON }) {
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenPanels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasEquipment = (output.equipment_schedule?.length ?? 0) > 0;
  const hasFinishes = (output.finish_schedule?.length ?? 0) > 0 || (output.wall_types?.length ?? 0) > 0;
  const hasDetailedCode = !!output.detailed_code_analysis;
  const hasScope = (output.scope_of_work?.length ?? 0) > 0 || (output.drawing_list?.length ?? 0) > 0;
  const hasDoors = (output.door_schedule?.length ?? 0) > 0;
  const complianceChecklist = output.compliance_checklist ?? [];
  const actionItems = complianceChecklist.filter(c => c.status === "action_required").length;
  const hasCost = !!output.cost_estimate;

  const panels: PanelConfig[] = [
    {
      id: "rooms",
      label: "Room Schedule",
      icon: LayoutList,
      badge: `${output.room_schedule?.length ?? output.room_program.length} rooms`,
      visible: true,
      render: () => <RoomScheduleTab output={output} />,
    },
    {
      id: "equipment",
      label: "Equipment Matrix",
      icon: Cpu,
      badge: `${output.equipment_schedule?.length ?? 0} items`,
      visible: hasEquipment,
      render: () => <EquipmentTab equipment={output.equipment_schedule!} />,
    },
    {
      id: "finishes",
      label: "Finishes & Wall Types",
      icon: Palette,
      badge: `${output.finish_schedule?.length ?? 0} specs`,
      visible: hasFinishes,
      render: () => (
        <FinishesTab
          finishes={output.finish_schedule ?? []}
          wallTypes={output.wall_types ?? []}
        />
      ),
    },
    {
      id: "code",
      label: "Code Analysis",
      icon: FileCode,
      badge: output.summary.building_code.split("/")[0].trim(),
      visible: hasDetailedCode,
      render: () => <CodeAnalysisTab output={output} />,
    },
    {
      id: "compliance",
      label: "Compliance Checklist",
      icon: Shield,
      badge: actionItems > 0 ? `${actionItems} action` : `${complianceChecklist.length} items`,
      visible: true,
      render: () => (
        <ComplianceTab items={complianceChecklist} codeAnalysis={output.code_analysis} />
      ),
    },
    {
      id: "cost",
      label: "Cost Estimate",
      icon: DollarSign,
      badge: output.cost_estimate
        ? `$${Math.round(output.cost_estimate.total / 1000)}K`
        : "N/A",
      visible: hasCost,
      render: () => <CostEstimateTab estimate={output.cost_estimate!} />,
    },
    {
      id: "scope",
      label: hasScope ? "Scope, Doors & Drawings" : "Next Steps",
      icon: hasDoors ? DoorOpen : ClipboardList,
      badge: hasScope
        ? `${(output.scope_of_work?.length ?? 0) + (output.drawing_list?.length ?? 0)} items`
        : `${output.next_steps.length} steps`,
      visible: true,
      render: () => (
        <ScopeTab
          scopeOfWork={output.scope_of_work}
          drawingList={output.drawing_list}
          nextSteps={output.next_steps}
          doorSchedule={output.door_schedule}
          plumbingLegend={output.plumbing_legend}
        />
      ),
    },
  ].filter(p => p.visible);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
          Schedules & Documentation
        </h3>
        <button
          onClick={() => {
            if (openPanels.size === panels.length) {
              setOpenPanels(new Set());
            } else {
              setOpenPanels(new Set(panels.map(p => p.id)));
            }
          }}
          className="text-[10px] text-stone-400 hover:text-stone-600"
        >
          {openPanels.size === panels.length ? "Collapse all" : "Expand all"}
        </button>
      </div>
      {panels.map(config => (
        <Panel
          key={config.id}
          config={config}
          isOpen={openPanels.has(config.id)}
          onToggle={() => toggle(config.id)}
        />
      ))}
    </div>
  );
}
