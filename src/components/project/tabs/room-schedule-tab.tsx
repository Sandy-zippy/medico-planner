"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Building2 } from "lucide-react";
import type { OutputJSON } from "@/types";

export function RoomScheduleTab({ output }: { output: OutputJSON }) {
  const schedule = output.room_schedule;

  // Fallback to room_program if no room_schedule
  if (!schedule || schedule.length === 0) {
    const totalProgrammed = output.room_program.reduce((s, r) => s + r.total_sqft, 0);
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Room Program
            </CardTitle>
            <div className="text-sm text-stone-500">
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
                  <TableCell className="text-sm text-stone-500 max-w-xs truncate">{room.notes}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-stone-50 font-bold">
                <TableCell>Total Programmed</TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="text-right">{totalProgrammed.toLocaleString()}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  const totalSqft = schedule.reduce((s, r) => s + r.total_sqft, 0);
  const totalM2 = schedule.reduce((s, r) => s + r.total_m2, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Room Schedule
          </CardTitle>
          <div className="text-sm text-stone-500">
            {totalSqft.toLocaleString()} SF ({totalM2.toFixed(1)} m²) of {output.summary.total_area_sqft.toLocaleString()} SF
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Room #</TableHead>
              <TableHead>Room Name</TableHead>
              <TableHead className="text-right">SF</TableHead>
              <TableHead className="text-right">m²</TableHead>
              <TableHead className="text-center">Finish</TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead className="hidden md:table-cell">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((room, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-sm">{room.room_number}</TableCell>
                <TableCell className="font-medium">{room.room_name}</TableCell>
                <TableCell className="text-right">{room.area_sqft}</TableCell>
                <TableCell className="text-right text-stone-500">{room.area_m2}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono text-xs">{room.finish_code}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {room.equipment_refs.slice(0, 3).map(ref => (
                      <Badge key={ref} variant="secondary" className="text-xs font-mono">{ref}</Badge>
                    ))}
                    {room.equipment_refs.length > 3 && (
                      <Badge variant="secondary" className="text-xs">+{room.equipment_refs.length - 3}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-stone-500 max-w-[200px] truncate hidden md:table-cell">{room.notes}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-stone-50 font-bold">
              <TableCell />
              <TableCell>Total Programmed</TableCell>
              <TableCell className="text-right">{totalSqft.toLocaleString()}</TableCell>
              <TableCell className="text-right">{totalM2.toFixed(1)}</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="hidden md:table-cell" />
            </TableRow>
            <TableRow className="bg-stone-50">
              <TableCell />
              <TableCell className="text-stone-500">Circulation / Walls</TableCell>
              <TableCell className="text-right text-stone-500">
                {(output.summary.total_area_sqft - totalSqft).toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-stone-500">
                {((output.summary.total_area_sqft - totalSqft) * 0.092903).toFixed(1)}
              </TableCell>
              <TableCell />
              <TableCell className="text-sm text-stone-400">
                {((output.summary.total_area_sqft - totalSqft) / output.summary.total_area_sqft * 100).toFixed(0)}% of total
              </TableCell>
              <TableCell className="hidden md:table-cell" />
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
