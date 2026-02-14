"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight, AlertTriangle, Lightbulb,
} from "lucide-react";
import type { Generation } from "@/types";

import { RoomScheduleTab } from "./tabs/room-schedule-tab";
import { CodeAnalysisTab } from "./tabs/code-analysis-tab";
import { EquipmentTab } from "./tabs/equipment-tab";
import { FinishesTab } from "./tabs/finishes-tab";
import { ComplianceTab } from "./tabs/compliance-tab";
import { ScopeTab } from "./tabs/scope-tab";
import { FloorPlanTab } from "./tabs/floor-plan-tab";

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

  const hasEquipment = output.equipment_schedule && output.equipment_schedule.length > 0;
  const hasFinishes = (output.finish_schedule && output.finish_schedule.length > 0) || (output.wall_types && output.wall_types.length > 0);
  const hasDoorsOrPlumbing = (output.door_schedule && output.door_schedule.length > 0) || (output.plumbing_legend && output.plumbing_legend.length > 0);
  const hasScope = (output.scope_of_work && output.scope_of_work.length > 0) || (output.drawing_list && output.drawing_list.length > 0);
  const hasDetailedCode = !!output.detailed_code_analysis;
  const hasFloorPlan = (output.room_schedule?.length ?? 0) > 0 || output.room_program.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-stone-900 text-white overflow-hidden">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-stone-400 mb-1">Concept Package</div>
              <h2 className="text-xl font-bold">{output.summary.clinic_type}</h2>
              <p className="text-sm text-stone-400">
                {output.summary.city ? `${output.summary.city}, ` : ""}{output.summary.province} &middot; Version {generation.version}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{output.summary.total_area_sqft.toLocaleString()}</div>
              <div className="text-xs text-stone-400">Square Feet</div>
            </div>
          </div>
          <Separator className="bg-stone-700 my-4" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{output.summary.occupancy_load}</div>
              <div className="text-xs text-stone-400">Occupant Load</div>
            </div>
            <div>
              <div className="text-lg font-bold">{output.summary.required_exits}</div>
              <div className="text-xs text-stone-400">Exits Required</div>
            </div>
            <div>
              <div className="text-lg font-bold">{output.summary.required_washrooms}</div>
              <div className="text-xs text-stone-400">Washrooms</div>
            </div>
            <div>
              <div className="text-lg font-bold">{output.summary.occupancy_group}</div>
              <div className="text-xs text-stone-400">Occupancy</div>
            </div>
            <div>
              <div className="text-lg font-bold">{output.summary.building_code.split("/")[0].trim()}</div>
              <div className="text-xs text-stone-400">Building Code</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="flex w-full overflow-x-auto justify-start">
          <TabsTrigger value="rooms" className="text-xs sm:text-sm">Rooms</TabsTrigger>
          {hasFloorPlan && (
            <TabsTrigger value="floorplan" className="text-xs sm:text-sm">Floor Plan</TabsTrigger>
          )}
          {hasDetailedCode && (
            <TabsTrigger value="code" className="text-xs sm:text-sm">Code Analysis</TabsTrigger>
          )}
          {hasEquipment && (
            <TabsTrigger value="equipment" className="text-xs sm:text-sm">Equipment</TabsTrigger>
          )}
          {hasFinishes && (
            <TabsTrigger value="finishes" className="text-xs sm:text-sm">Finishes</TabsTrigger>
          )}
          <TabsTrigger value="adjacencies" className="text-xs sm:text-sm">Adjacencies</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs sm:text-sm">Compliance</TabsTrigger>
          <TabsTrigger value="risks" className="text-xs sm:text-sm">Risks</TabsTrigger>
          <TabsTrigger value="scope" className="text-xs sm:text-sm">
            {hasScope ? "Scope & Drawings" : "Next Steps"}
          </TabsTrigger>
        </TabsList>

        {/* Room Schedule */}
        <TabsContent value="rooms">
          <RoomScheduleTab output={output} />
        </TabsContent>

        {/* Floor Plan */}
        {hasFloorPlan && (
          <TabsContent value="floorplan">
            <FloorPlanTab output={output} />
          </TabsContent>
        )}

        {/* Detailed Code Analysis */}
        {hasDetailedCode && (
          <TabsContent value="code">
            <CodeAnalysisTab output={output} />
          </TabsContent>
        )}

        {/* Equipment */}
        {hasEquipment && (
          <TabsContent value="equipment">
            <EquipmentTab equipment={output.equipment_schedule!} />
          </TabsContent>
        )}

        {/* Finishes & Walls */}
        {hasFinishes && (
          <TabsContent value="finishes">
            <FinishesTab
              finishes={output.finish_schedule ?? []}
              wallTypes={output.wall_types ?? []}
            />
          </TabsContent>
        )}

        {/* Adjacencies */}
        <TabsContent value="adjacencies">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5" /> Spatial Adjacencies
              </h3>
              {output.adjacencies.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-8">No adjacency rules defined.</p>
              ) : (
                <div className="space-y-3">
                  {output.adjacencies.map((adj, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg">
                      <Badge variant="secondary" className={priorityColors[adj.priority]}>
                        {adj.priority}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {adj.room_a} <ArrowRight className="w-3 h-3 inline mx-1 text-stone-400" /> {adj.room_b}
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">{adj.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance">
          <ComplianceTab items={output.compliance_checklist} codeAnalysis={output.code_analysis} />
        </TabsContent>

        {/* Risks */}
        <TabsContent value="risks">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Risk Assessment
              </h3>
              <div className="space-y-3">
                {output.risks.map((risk, i) => (
                  <div key={i} className="p-4 rounded-lg border border-stone-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className={severityColors[risk.severity]}>
                        {risk.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-stone-900 mb-2">{risk.description}</p>
                    <div className="flex items-start gap-2 text-sm text-stone-500">
                      <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{risk.mitigation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scope & Next Steps */}
        <TabsContent value="scope">
          <ScopeTab
            scopeOfWork={output.scope_of_work}
            drawingList={output.drawing_list}
            nextSteps={output.next_steps}
            doorSchedule={output.door_schedule}
            plumbingLegend={output.plumbing_legend}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
