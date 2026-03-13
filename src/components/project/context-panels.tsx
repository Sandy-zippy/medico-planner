"use client";

import { useState } from "react";
import { ChevronDown, LayoutList, Cpu, Palette, DoorOpen, Shield, FileCode, ClipboardList, BookOpen, Grid3x3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OutputJSON } from "@/types";

import { RoomScheduleTab } from "./tabs/room-schedule-tab";
import { EquipmentTab } from "./tabs/equipment-tab";
import { ComplianceTab } from "./tabs/compliance-tab";
import { CodeAnalysisTab } from "./tabs/code-analysis-tab";
import { ScopeTab } from "./tabs/scope-tab";
import { FinishesTab } from "./tabs/finishes-tab";

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

  const hasCoverSheet = !!output.cover_sheet;
  const hasCeilingPlan = !!output.ceiling_plan;
  const hasEquipment = (output.equipment_schedule?.length ?? 0) > 0;
  const hasFinishes = (output.finish_schedule?.length ?? 0) > 0 || (output.wall_types?.length ?? 0) > 0;
  const hasDetailedCode = !!output.detailed_code_analysis;
  const hasScope = (output.scope_of_work?.length ?? 0) > 0 || (output.drawing_list?.length ?? 0) > 0;
  const hasDoors = (output.door_schedule?.length ?? 0) > 0;
  const actionItems = output.compliance_checklist.filter(c => c.status === "action_required").length;

  const panels: PanelConfig[] = [
    {
      id: "cover_sheet",
      label: "Cover Sheet",
      icon: BookOpen,
      badge: "Project Info",
      visible: hasCoverSheet,
      render: () => {
        const cs = output.cover_sheet!;
        return (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div><span className="text-stone-400">Project:</span> <span className="font-medium">{cs.project_name}</span></div>
              <div><span className="text-stone-400">Address:</span> <span className="font-medium">{cs.address}</span></div>
              <div><span className="text-stone-400">Building Type:</span> <span className="font-medium">{cs.building_type}</span></div>
              <div><span className="text-stone-400">Project Type:</span> <span className="font-medium">{cs.project_type}</span></div>
              <div><span className="text-stone-400">Area:</span> <span className="font-medium">{cs.total_area_sqft.toLocaleString()} SF / {cs.total_area_m2} m²</span></div>
              <div><span className="text-stone-400">Rooms:</span> <span className="font-medium">{cs.room_count}</span></div>
              <div><span className="text-stone-400">Owner:</span> <span className="font-medium">{cs.owner}</span></div>
              <div><span className="text-stone-400">Architect:</span> <span className="font-medium">{cs.architect}</span></div>
              <div><span className="text-stone-400">Date:</span> <span className="font-medium">{cs.date}</span></div>
            </div>
            <div>
              <span className="text-xs text-stone-400">Applicable Codes:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {cs.applicable_codes.map((code, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{code}</Badge>
                ))}
              </div>
            </div>
            {cs.drawing_index.length > 0 && (
              <div>
                <span className="text-xs text-stone-400">Drawing Index:</span>
                <table className="w-full mt-1 text-xs">
                  <thead><tr className="text-stone-400 text-left"><th className="pr-3">No.</th><th className="pr-3">Title</th><th>Discipline</th></tr></thead>
                  <tbody>
                    {cs.drawing_index.map((d, i) => (
                      <tr key={i} className="border-t border-stone-50"><td className="pr-3 py-1 font-mono">{d.drawing_number}</td><td className="pr-3">{d.title}</td><td className="text-stone-500">{d.discipline}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "ceiling_plan",
      label: "Reflected Ceiling Plan",
      icon: Grid3x3,
      badge: hasCeilingPlan ? output.ceiling_plan!.ceiling_type.toUpperCase() : "",
      visible: hasCeilingPlan,
      render: () => {
        const cp = output.ceiling_plan!;
        return (
          <div className="space-y-3">
            <div className="flex gap-4 text-xs">
              <div><span className="text-stone-400">Ceiling System:</span> <span className="font-medium">{cp.ceiling_type === 'tbar' ? 'Suspended ACT (T-Bar)' : cp.ceiling_type === 'drywall' ? 'Drywall' : 'Mixed'}</span></div>
              <div><span className="text-stone-400">Grid Module:</span> <span className="font-medium">{cp.grid_module}</span></div>
            </div>
            <table className="w-full text-xs">
              <thead><tr className="text-stone-400 text-left border-b border-stone-100">
                <th className="pr-2 py-1">Room</th><th className="pr-2">Ceiling</th><th className="pr-2">Height</th><th className="pr-2">Lights</th><th className="pr-2">Diffusers</th><th>Sprinklers</th>
              </tr></thead>
              <tbody>
                {cp.rooms.map((r, i) => (
                  <tr key={i} className="border-t border-stone-50">
                    <td className="pr-2 py-1"><span className="font-mono text-stone-400 mr-1">{r.room_number}</span>{r.room_name}</td>
                    <td className="pr-2">{r.ceiling_type === 'tbar' ? 'ACT' : r.ceiling_type === 'drywall' ? 'GWB' : 'Mixed'}</td>
                    <td className="pr-2">{r.ceiling_height_ft}&apos;</td>
                    <td className="pr-2">{r.light_fixtures.length}</td>
                    <td className="pr-2">{r.diffusers.length}</td>
                    <td>{r.sprinklers.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      },
    },
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
      badge: actionItems > 0 ? `${actionItems} action` : `${output.compliance_checklist.length} items`,
      visible: true,
      render: () => (
        <ComplianceTab items={output.compliance_checklist} codeAnalysis={output.code_analysis} />
      ),
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
