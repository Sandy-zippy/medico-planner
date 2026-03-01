"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";
import type { OutputJSON } from "@/types";
import {
  FloorPlanSVG, FINISH_PALETTE, CORRIDOR_FILL, WALL_STYLES, WALL_THICKNESS_PX,
} from "@/components/project/floor-plan-svg";

export function FloorPlanTab({ output }: { output: OutputJSON }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const fp = output.floor_plan;

  const usedCodes = useMemo(() => {
    if (!fp) return [];
    const codes = new Set<string>();
    fp.rooms.forEach(r => {
      const key = r.finish_code.toUpperCase().replace(/\s/g, "");
      if (FINISH_PALETTE[key]) codes.add(key);
    });
    return Array.from(codes).sort();
  }, [fp]);

  const usedWallTypes = useMemo(() => {
    if (!fp) return [];
    const types = new Set<string>();
    fp.walls.forEach(w => types.add(w.wall_type));
    return Array.from(types).sort();
  }, [fp]);

  if (!fp) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" /> Floor Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-stone-500 text-sm">
            No floor plan data available. Generate or re-generate the project to produce an architectural floor plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hoveredRoom = fp.rooms.find(r => r.room_number === hovered);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" /> A100 — Floor Plan Layout
            </CardTitle>
            <span className="text-xs text-stone-400">
              {fp.envelope.width.toFixed(0)}&apos; x {fp.envelope.depth.toFixed(0)}&apos; | {fp.rooms.length} rooms
            </span>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="border border-stone-200 rounded-lg overflow-hidden">
            <FloorPlanSVG
              output={output}
              onRoomHover={(roomNumber, pos) => {
                setHovered(roomNumber);
                setMouse(pos);
              }}
            />
          </div>

          {/* Hover tooltip */}
          {hoveredRoom && (
            <div
              className="fixed z-50 bg-white border border-stone-200 shadow-lg rounded-lg p-3 text-sm max-w-xs pointer-events-none"
              style={{ left: mouse.x + 12, top: mouse.y + 12 }}
            >
              <div className="font-semibold text-stone-900">
                {hoveredRoom.room_number} — {hoveredRoom.room_name}
              </div>
              <div className="text-stone-500 mt-1">
                {hoveredRoom.area_programmed.toLocaleString()} SF
                {hoveredRoom.area_actual !== hoveredRoom.area_programmed && (
                  <span className="ml-1">/ {hoveredRoom.area_actual.toLocaleString()} SF actual</span>
                )}
              </div>
              <div className="text-stone-400 mt-1 text-xs">
                {hoveredRoom.width.toFixed(1)}&apos; x {hoveredRoom.depth.toFixed(1)}&apos;
                {hoveredRoom.finish_code && <span className="ml-2">Finish: {hoveredRoom.finish_code}</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legends */}
      <div className="grid sm:grid-cols-2 gap-4">
        {usedCodes.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Finish Legend</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {usedCodes.map(code => (
                  <div key={code} className="flex items-center gap-2">
                    <div className="w-5 h-3.5 rounded-sm border border-stone-300" style={{ backgroundColor: FINISH_PALETTE[code].fill }} />
                    <span className="text-xs text-stone-600"><span className="font-semibold">{code}</span> — {FINISH_PALETTE[code].label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-3.5 rounded-sm border border-stone-300" style={{ backgroundColor: CORRIDOR_FILL }} />
                  <span className="text-xs text-stone-600"><span className="font-semibold">COR</span> — Corridor</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle className="text-sm">Wall Types</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {usedWallTypes.map(code => {
                const style = WALL_STYLES[code];
                if (!style) return null;
                const thickness = WALL_THICKNESS_PX[code] ?? 2.8;
                return (
                  <div key={code} className="flex items-center gap-2">
                    <svg width={28} height={12}>
                      <rect x={0} y={6 - thickness / 2} width={28} height={thickness} fill={style.fill} />
                    </svg>
                    <span className="text-xs text-stone-600"><span className="font-semibold">{code}</span> — {style.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
