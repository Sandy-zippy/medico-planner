"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ArrowRight, FileText, Hammer } from "lucide-react";
import type { DrawingListEntry, DoorScheduleEntry, PlumbingFixture } from "@/types";

export function ScopeTab({ scopeOfWork, drawingList, nextSteps, doorSchedule, plumbingLegend }: {
  scopeOfWork?: string[];
  drawingList?: DrawingListEntry[];
  nextSteps: string[];
  doorSchedule?: DoorScheduleEntry[];
  plumbingLegend?: PlumbingFixture[];
}) {
  return (
    <div className="space-y-6">
      {/* Scope of Work */}
      {scopeOfWork && scopeOfWork.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hammer className="w-5 h-5" /> Scope of Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scopeOfWork.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg">
                  <div className="w-6 h-6 bg-stone-800 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-stone-700">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Door Schedule */}
      {doorSchedule && doorSchedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Door Schedule</CardTitle>
            <p className="text-xs text-stone-400">{doorSchedule.length} doors</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Mark</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">W (mm)</TableHead>
                  <TableHead className="text-right">H (mm)</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fire Rating</TableHead>
                  <TableHead className="hidden md:table-cell">Hardware</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doorSchedule.map((d) => (
                  <TableRow key={d.mark}>
                    <TableCell className="font-mono text-xs font-medium">{d.mark}</TableCell>
                    <TableCell className="text-sm">{d.location}</TableCell>
                    <TableCell className="text-right text-sm">{d.width_mm}</TableCell>
                    <TableCell className="text-right text-sm">{d.height_mm}</TableCell>
                    <TableCell className="text-xs text-stone-600">{d.type}</TableCell>
                    <TableCell>
                      <Badge variant={d.fire_rating === 'Non-rated' ? 'outline' : 'secondary'}
                        className={d.fire_rating !== 'Non-rated' ? 'bg-red-50 text-red-700 text-xs' : 'text-xs'}>
                        {d.fire_rating}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-stone-500 hidden md:table-cell">{d.hardware}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Plumbing Legend */}
      {plumbingLegend && plumbingLegend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plumbing Fixture Legend</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Mark</TableHead>
                  <TableHead>Fixture Type</TableHead>
                  <TableHead>Model Reference</TableHead>
                  <TableHead className="text-center">HW</TableHead>
                  <TableHead className="text-center">CW</TableHead>
                  <TableHead className="text-center">DR</TableHead>
                  <TableHead className="text-center">GAS</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plumbingLegend.map((p) => (
                  <TableRow key={p.mark}>
                    <TableCell className="font-mono text-xs font-medium">{p.mark}</TableCell>
                    <TableCell className="text-sm font-medium">{p.fixture_type}</TableCell>
                    <TableCell className="text-xs text-stone-600">{p.model_reference}</TableCell>
                    <TableCell className="text-center">{p.hot_water ? <span className="text-emerald-600">&#10003;</span> : '—'}</TableCell>
                    <TableCell className="text-center">{p.cold_water ? <span className="text-emerald-600">&#10003;</span> : '—'}</TableCell>
                    <TableCell className="text-center">{p.drain ? <span className="text-emerald-600">&#10003;</span> : '—'}</TableCell>
                    <TableCell className="text-center">{p.gas ? <span className="text-emerald-600">&#10003;</span> : '—'}</TableCell>
                    <TableCell className="text-xs text-stone-500 hidden md:table-cell">{p.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Drawing List */}
      {drawingList && drawingList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Drawing List
            </CardTitle>
            <p className="text-xs text-stone-400">{drawingList.length} sheets</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {drawingList.map((d, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-stone-50 last:border-0">
                  <span className="font-mono text-xs font-medium w-12 text-stone-500">{d.drawing_number}</span>
                  <span className="text-sm flex-1">{d.title}</span>
                  <Badge variant="outline" className="text-xs font-normal">{d.discipline}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" /> Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nextSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg">
                <div className="w-6 h-6 bg-stone-200 rounded-full flex items-center justify-center text-xs font-bold text-stone-600 flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-stone-700">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
