"use client";

import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowRight } from "lucide-react";
import type { Generation } from "@/types";

import { DesignCanvas } from "./design-canvas";
import { ContextPanels } from "./context-panels";

const severityColors: Record<string, string> = {
  low: "bg-blue-50 text-blue-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
};

const priorityColors: Record<string, string> = {
  required: "bg-red-50 text-red-700",
  preferred: "bg-blue-50 text-blue-700",
  avoid: "bg-stone-100 text-stone-700",
};

export function OutputRenderer({ generation }: { generation: Generation }) {
  const output = generation.output_json;

  const complianceMet = output.compliance_checklist.filter(c => c.status === "met").length;
  const complianceTotal = output.compliance_checklist.length;
  const highRisks = output.risks.filter(r => r.severity === "high").length;

  return (
    <div className="space-y-6">
      {/* Compact summary bar */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-900">{output.summary.clinic_type}</span>
          <span className="text-xs text-stone-400">&middot;</span>
          <span className="text-xs text-stone-500">
            {output.summary.city ? `${output.summary.city}, ` : ""}{output.summary.province}
          </span>
          <span className="text-xs text-stone-400">&middot;</span>
          <span className="text-xs text-stone-500">v{generation.version}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="secondary" className="text-[10px] bg-stone-100">
            {output.summary.total_area_sqft.toLocaleString()} SF
          </Badge>
          <Badge variant="secondary" className="text-[10px] bg-stone-100">
            {output.summary.occupancy_group}
          </Badge>
          <Badge variant="secondary" className="text-[10px] bg-stone-100">
            {output.summary.occupancy_load} occ
          </Badge>
          <Badge variant="secondary" className="text-[10px] bg-stone-100">
            {output.summary.required_exits} exits
          </Badge>
          <Badge variant="secondary" className="text-[10px] bg-stone-100">
            {output.summary.required_washrooms} WR
          </Badge>
          <Badge variant="secondary" className={`text-[10px] ${complianceMet === complianceTotal ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            {complianceMet}/{complianceTotal} compliant
          </Badge>
          {highRisks > 0 && (
            <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-700">
              {highRisks} high risk
            </Badge>
          )}
        </div>
      </div>

      {/* Hero: Floor plan / 3D canvas */}
      <DesignCanvas output={output} />

      {/* Adjacencies — compact visual */}
      {output.adjacencies.length > 0 && (
        <div className="px-1">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Spatial Adjacencies
          </h3>
          <div className="flex flex-wrap gap-2">
            {output.adjacencies.map((adj, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-50 border border-stone-100 rounded-full text-xs"
              >
                <Badge variant="secondary" className={`text-[9px] px-1.5 ${priorityColors[adj.priority]}`}>
                  {adj.priority[0].toUpperCase()}
                </Badge>
                <span className="text-stone-600">{adj.room_a}</span>
                <ArrowRight className="w-3 h-3 text-stone-300" />
                <span className="text-stone-600">{adj.room_b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risks — compact cards */}
      {output.risks.length > 0 && (
        <div className="px-1">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Risk Assessment
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {output.risks.map((risk, i) => (
              <div key={i} className="p-3 rounded-lg border border-stone-100 bg-white">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="secondary" className={`text-[10px] ${severityColors[risk.severity]}`}>
                    {risk.severity}
                  </Badge>
                </div>
                <p className="text-xs text-stone-700 mb-1.5">{risk.description}</p>
                <div className="flex items-start gap-1.5 text-xs text-stone-500">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{risk.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible schedule panels */}
      <ContextPanels output={output} />
    </div>
  );
}
