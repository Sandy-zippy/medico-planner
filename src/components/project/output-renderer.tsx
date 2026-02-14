"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2, XCircle, AlertCircle, AlertTriangle,
  ArrowRight, Shield, Building2, Lightbulb,
} from "lucide-react";
import type { Generation, ComplianceItem, RiskItem, Adjacency } from "@/types";

const statusIcons: Record<string, React.ReactNode> = {
  met: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  review: <AlertCircle className="w-4 h-4 text-amber-500" />,
  action_required: <XCircle className="w-4 h-4 text-red-500" />,
};

const statusColors: Record<string, string> = {
  met: "bg-emerald-50 text-emerald-700",
  review: "bg-amber-50 text-amber-700",
  action_required: "bg-red-50 text-red-700",
};

const severityColors: Record<string, string> = {
  low: "bg-blue-50 text-blue-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
};

const priorityColors: Record<string, string> = {
  required: "bg-red-50 text-red-700",
  preferred: "bg-blue-50 text-blue-700",
  avoid: "bg-slate-100 text-slate-700",
};

export function OutputRenderer({ generation }: { generation: Generation }) {
  const output = generation.output_json;
  const totalProgrammed = output.room_program.reduce((s, r) => s + r.total_sqft, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-900 text-white overflow-hidden">
        <CardContent className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Concept Package</div>
              <h2 className="text-xl font-bold">{output.summary.clinic_type}</h2>
              <p className="text-sm text-slate-400">
                {output.summary.city ? `${output.summary.city}, ` : ""}{output.summary.province} &middot; Version {generation.version}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{output.summary.total_area_sqft.toLocaleString()}</div>
              <div className="text-xs text-slate-400">Square Feet</div>
            </div>
          </div>
          <Separator className="bg-slate-700 my-4" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{output.summary.occupancy_load}</div>
              <div className="text-xs text-slate-400">Occupant Load</div>
            </div>
            <div>
              <div className="text-lg font-bold">{output.summary.required_exits}</div>
              <div className="text-xs text-slate-400">Exits Required</div>
            </div>
            <div>
              <div className="text-lg font-bold">{output.summary.required_washrooms}</div>
              <div className="text-xs text-slate-400">Washrooms</div>
            </div>
            <div>
              <div className="text-lg font-bold">{output.summary.occupancy_group}</div>
              <div className="text-xs text-slate-400">Occupancy</div>
            </div>
            <div>
              <div className="text-lg font-bold">{output.summary.building_code.split("/")[0].trim()}</div>
              <div className="text-xs text-slate-400">Building Code</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="adjacencies">Adjacencies</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="next">Next Steps</TabsTrigger>
        </TabsList>

        {/* Room Program */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" /> Room Program
                </CardTitle>
                <div className="text-sm text-slate-500">
                  {totalProgrammed.toLocaleString()} SF programmed of {output.summary.total_area_sqft.toLocaleString()} SF
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Unit SF</TableHead>
                    <TableHead className="text-right">Total SF</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {output.room_program.map((room, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{room.room_name}</TableCell>
                      <TableCell className="text-center">{room.quantity}</TableCell>
                      <TableCell className="text-right">{room.area_sqft}</TableCell>
                      <TableCell className="text-right font-medium">{room.total_sqft}</TableCell>
                      <TableCell className="text-sm text-slate-500 max-w-xs truncate">{room.notes}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-50 font-bold">
                    <TableCell>Total Programmed</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right">{totalProgrammed.toLocaleString()}</TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow className="bg-slate-50">
                    <TableCell className="text-slate-500">Circulation / Walls</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right text-slate-500">
                      {(output.summary.total_area_sqft - totalProgrammed).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {((output.summary.total_area_sqft - totalProgrammed) / output.summary.total_area_sqft * 100).toFixed(0)}% of total
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adjacencies */}
        <TabsContent value="adjacencies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" /> Spatial Adjacencies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {output.adjacencies.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No adjacency rules defined.</p>
              ) : (
                <div className="space-y-3">
                  {output.adjacencies.map((adj, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Badge variant="secondary" className={priorityColors[adj.priority]}>
                        {adj.priority}
                      </Badge>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {adj.room_a} <ArrowRight className="w-3 h-3 inline mx-1 text-slate-400" /> {adj.room_b}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{adj.reason}</p>
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Compliance Checklist
                </CardTitle>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Met</span>
                  <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Review</span>
                  <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-500" /> Action</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {output.compliance_checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100">
                    <div className="mt-0.5">{statusIcons[item.status]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm">{item.category}</span>
                        <Badge variant="secondary" className={statusColors[item.status]}>
                          {item.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{item.requirement}</p>
                      <p className="text-xs text-slate-400 mt-1">Ref: {item.code_reference}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Code Analysis Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-500">Code Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Classification</span>
                <span className="font-medium">{output.code_analysis.occupancy_classification}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Construction Type</span>
                <span className="font-medium">{output.code_analysis.construction_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fire Rating</span>
                <span className="font-medium">{output.code_analysis.fire_rating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sprinkler Required</span>
                <span className="font-medium">{output.code_analysis.sprinkler_required ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Barrier-Free</span>
                <span className="font-medium">{output.code_analysis.barrier_free_required ? "Required" : "Not Required"}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {output.risks.map((risk, i) => (
                  <div key={i} className="p-4 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className={severityColors[risk.severity]}>
                        {risk.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-900 mb-2">{risk.description}</p>
                    <div className="flex items-start gap-2 text-sm text-slate-500">
                      <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{risk.mitigation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Next Steps */}
        <TabsContent value="next">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" /> Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {output.next_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
