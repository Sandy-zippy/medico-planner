"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";
import type { EquipmentItem } from "@/types";

function Check({ val }: { val: boolean }) {
  if (!val) return <span className="text-stone-200">—</span>;
  return <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />;
}

export function EquipmentTab({ equipment }: { equipment: EquipmentItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Equipment Schedule & Utility Matrix</CardTitle>
        <p className="text-xs text-stone-400">{equipment.length} items</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Equipment</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="text-center w-10">Qty</TableHead>
              <TableHead className="text-center w-10" title="Hot Water">HW</TableHead>
              <TableHead className="text-center w-10" title="Cold Water">CW</TableHead>
              <TableHead className="text-center w-10" title="Drain">DR</TableHead>
              <TableHead className="text-center w-10" title="Gas">GAS</TableHead>
              <TableHead className="text-center w-10" title="Dedicated Circuit">DC</TableHead>
              <TableHead className="text-center w-10" title="Standard Outlet">SO</TableHead>
              <TableHead className="text-center w-10" title="Data">DATA</TableHead>
              <TableHead className="text-center w-10" title="Mechanical Ventilation">MV</TableHead>
              <TableHead className="hidden lg:table-cell">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((eq) => (
              <TableRow key={eq.id}>
                <TableCell className="font-mono text-xs">{eq.id}</TableCell>
                <TableCell className="font-medium text-sm">{eq.name}</TableCell>
                <TableCell className="text-sm text-stone-600">{eq.room}</TableCell>
                <TableCell className="text-center">{eq.quantity}</TableCell>
                <TableCell className="text-center"><Check val={eq.hot_water} /></TableCell>
                <TableCell className="text-center"><Check val={eq.cold_water} /></TableCell>
                <TableCell className="text-center"><Check val={eq.drain} /></TableCell>
                <TableCell className="text-center"><Check val={eq.gas} /></TableCell>
                <TableCell className="text-center"><Check val={eq.dedicated_circuit} /></TableCell>
                <TableCell className="text-center"><Check val={eq.standard_outlet} /></TableCell>
                <TableCell className="text-center"><Check val={eq.data} /></TableCell>
                <TableCell className="text-center"><Check val={eq.mechanical_vent} /></TableCell>
                <TableCell className="text-xs text-stone-500 max-w-[200px] truncate hidden lg:table-cell">{eq.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-400">
          <span>HW = Hot Water</span>
          <span>CW = Cold Water</span>
          <span>DR = Drain</span>
          <span>DC = Dedicated Circuit</span>
          <span>SO = Standard Outlet</span>
          <span>MV = Mech. Ventilation</span>
        </div>
      </CardContent>
    </Card>
  );
}
