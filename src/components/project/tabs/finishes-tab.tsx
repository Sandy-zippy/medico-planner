"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { FinishScheduleEntry, WallType } from "@/types";

export function FinishesTab({ finishes, wallTypes }: {
  finishes: FinishScheduleEntry[];
  wallTypes: WallType[];
}) {
  return (
    <div className="space-y-6">
      {/* Finish Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Finish Schedule</CardTitle>
          <p className="text-xs text-stone-400">Room-by-room finish specifications</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead className="text-center">Code</TableHead>
                <TableHead>Wall</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Ceiling</TableHead>
                <TableHead className="hidden lg:table-cell">Base</TableHead>
                <TableHead className="hidden lg:table-cell">Countertop</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finishes.map((f, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-sm">{f.room_name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono text-xs">{f.finish_code}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-stone-600 max-w-[160px]">{f.wall}</TableCell>
                  <TableCell className="text-xs text-stone-600 max-w-[160px]">{f.floor}</TableCell>
                  <TableCell className="text-xs text-stone-600 max-w-[160px]">{f.ceiling}</TableCell>
                  <TableCell className="text-xs text-stone-600 hidden lg:table-cell">{f.base}</TableCell>
                  <TableCell className="text-xs text-stone-600 hidden lg:table-cell">{f.countertop}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Wall / Partition Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wall & Partition Types</CardTitle>
          <p className="text-xs text-stone-400">Standard construction partition specifications</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {wallTypes.map((w) => (
              <div key={w.type_code} className="p-4 rounded-lg border border-stone-100">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" className="font-mono">{w.type_code}</Badge>
                  <span className="font-medium text-sm">{w.description}</span>
                  {w.fire_rating !== '0 hr (non-rated)' && w.fire_rating !== 'As existing — verify' && (
                    <Badge variant="secondary" className="bg-red-50 text-red-700 text-xs">{w.fire_rating}</Badge>
                  )}
                  {w.stc_rating > 0 && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">STC {w.stc_rating}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-500">
                  <div><span className="font-medium text-stone-600">Stud:</span> {w.stud_size}</div>
                  <div><span className="font-medium text-stone-600">Layers:</span> {w.layers}</div>
                  <div><span className="font-medium text-stone-600">Insulation:</span> {w.insulation}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {w.use_locations.map((loc, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-normal">{loc}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
