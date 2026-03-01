"use client";

import { useMemo } from "react";
import { X, Droplets, Zap, Flame, Wifi, Wind, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FINISH_PALETTE, ZONE_PALETTE } from "./floor-plan-svg";
import type { OutputJSON } from "@/types";

// Sherwin-Williams color name → hex (the ~8 colors used in finish-specs)
const SW_COLORS: Record<string, string> = {
  "7015": "#b5b0a8", // Repose Gray
  "7029": "#c8bfb0", // Agreeable Gray
  "7036": "#c9bda8", // Accessible Beige
  "7008": "#eee8db", // Alabaster
  "6119": "#f0e4d0", // Antique White
  "6244": "#363d5e", // Naval
  "7012": "#ede2cf", // Creamy
};

function parseSwColor(wallSpec: string): { hex: string; name: string } | null {
  const match = wallSpec.match(/SW\s*(\d{4})\s+([^,]+)/);
  if (!match) return null;
  const code = match[1];
  return { hex: SW_COLORS[code] ?? "#d4d4d4", name: match[2].trim() };
}

function getFloorIndicator(floorSpec: string): { color: string; label: string } {
  if (floorSpec.includes("LVP")) return { color: "#c4a882", label: "LVP" };
  if (floorSpec.includes("Sheet")) return { color: "#9cb4c4", label: "Sheet Vinyl" };
  if (floorSpec.includes("Rubber")) return { color: "#a0a0a0", label: "Rubber Tile" };
  if (floorSpec.includes("Ceramic") || floorSpec.includes("porcelain")) return { color: "#e8e0d8", label: "Ceramic" };
  if (floorSpec.includes("Carpet")) return { color: "#b8b0a8", label: "Carpet Tile" };
  if (floorSpec.includes("epoxy") || floorSpec.includes("concrete")) return { color: "#c8c8c8", label: "Epoxy" };
  return { color: "#d4d4d4", label: "Other" };
}

const priorityColors: Record<string, string> = {
  required: "bg-red-50 text-red-700",
  preferred: "bg-blue-50 text-blue-700",
  avoid: "bg-stone-100 text-stone-700",
};

export function RoomInspector({
  roomNumber,
  output,
  onClose,
}: {
  roomNumber: string;
  output: OutputJSON;
  onClose: () => void;
}) {
  const data = useMemo(() => {
    const fp = output.floor_plan;
    const fpRoom = fp?.rooms.find(r => r.room_number === roomNumber);
    const scheduleRoom = output.room_schedule?.find(r => r.room_number === roomNumber);
    const finishEntry = output.finish_schedule?.find(f =>
      f.room_name.toLowerCase() === (fpRoom?.room_name ?? "").toLowerCase()
    );

    // Equipment items referenced by this room
    const equipItems = (scheduleRoom?.equipment_refs ?? [])
      .map(ref => output.equipment_schedule?.find(eq => eq.id === ref))
      .filter(Boolean);

    // Adjacencies involving this room
    const adjacencies = output.adjacencies.filter(a =>
      a.room_a.toLowerCase() === (fpRoom?.room_name ?? "").toLowerCase() ||
      a.room_b.toLowerCase() === (fpRoom?.room_name ?? "").toLowerCase()
    );

    // Doors in this room
    const doors = output.door_schedule?.filter(d =>
      d.location.toLowerCase() === (fpRoom?.room_name ?? "").toLowerCase()
    ) ?? [];

    return { fpRoom, scheduleRoom, finishEntry, equipItems, adjacencies, doors };
  }, [roomNumber, output]);

  const { fpRoom, scheduleRoom, finishEntry, equipItems, adjacencies, doors } = data;
  if (!fpRoom) return null;

  const wallColor = finishEntry ? parseSwColor(finishEntry.wall) : null;
  const floorInfo = finishEntry ? getFloorIndicator(finishEntry.floor) : null;
  const finishCode = fpRoom.finish_code.toUpperCase().replace(/\s/g, "");
  const finishPalette = FINISH_PALETTE[finishCode];
  const zonePalette = ZONE_PALETTE[fpRoom.zone];

  return (
    <div className="bg-white border-l border-stone-200 w-80 overflow-y-auto max-h-[calc(100vh-200px)] shadow-xl">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-stone-100 p-4 z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-stone-900">{fpRoom.room_number}</span>
              {zonePalette && (
                <Badge variant="secondary" className="text-[10px]" style={{
                  backgroundColor: zonePalette.fill,
                  color: "#44403c",
                }}>
                  {zonePalette.label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-stone-600 mt-0.5">{fpRoom.room_name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded">
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {/* Area bar */}
        <div className="flex gap-4 mt-3 text-xs">
          <div>
            <span className="text-stone-400">Programmed</span>
            <div className="font-semibold text-stone-900">{fpRoom.area_programmed} SF</div>
          </div>
          <div>
            <span className="text-stone-400">Actual</span>
            <div className="font-semibold text-stone-900">{fpRoom.area_actual} SF</div>
          </div>
          <div>
            <span className="text-stone-400">Dimensions</span>
            <div className="font-semibold text-stone-900">{fpRoom.width.toFixed(1)}&apos; x {fpRoom.depth.toFixed(1)}&apos;</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Finish Swatches */}
        {finishEntry && (
          <div>
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Finishes</h4>
            <div className="grid grid-cols-3 gap-2">
              {/* Wall */}
              <div className="text-center">
                <div
                  className="w-full h-10 rounded border border-stone-200"
                  style={{ backgroundColor: wallColor?.hex ?? finishPalette?.fill ?? "#d4d4d4" }}
                />
                <div className="text-[10px] text-stone-500 mt-1">Wall</div>
                <div className="text-[10px] font-medium text-stone-700 truncate">
                  {wallColor?.name ?? finishCode}
                </div>
              </div>
              {/* Floor */}
              <div className="text-center">
                <div
                  className="w-full h-10 rounded border border-stone-200"
                  style={{ backgroundColor: floorInfo?.color ?? "#d4d4d4" }}
                />
                <div className="text-[10px] text-stone-500 mt-1">Floor</div>
                <div className="text-[10px] font-medium text-stone-700 truncate">
                  {floorInfo?.label ?? "—"}
                </div>
              </div>
              {/* Ceiling */}
              <div className="text-center">
                <div className="w-full h-10 rounded border border-stone-200 bg-white" />
                <div className="text-[10px] text-stone-500 mt-1">Ceiling</div>
                <div className="text-[10px] font-medium text-stone-700 truncate">
                  {finishEntry.ceiling.includes("ACT") ? "ACT" : "GWB"}
                </div>
              </div>
            </div>
            {finishEntry.countertop && finishEntry.countertop !== "N/A" && (
              <div className="mt-2 text-[11px] text-stone-500">
                Counter: <span className="text-stone-700">{finishEntry.countertop}</span>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Equipment */}
        {equipItems.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Equipment ({equipItems.length})
            </h4>
            <div className="space-y-2">
              {equipItems.map((eq) => (
                <div key={eq!.id} className="flex items-start gap-2 p-2 bg-stone-50 rounded">
                  <span className="text-[10px] font-mono font-bold text-stone-400 mt-0.5 shrink-0">{eq!.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-stone-800 truncate">{eq!.name}</div>
                    <div className="flex gap-1.5 mt-1">
                      {eq!.hot_water && <span title="Hot water"><Droplets className="w-3 h-3 text-red-400" /></span>}
                      {eq!.cold_water && <span title="Cold water"><Droplets className="w-3 h-3 text-blue-400" /></span>}
                      {eq!.drain && <span title="Drain"><Droplets className="w-3 h-3 text-stone-400" /></span>}
                      {eq!.gas && <span title="Gas"><Flame className="w-3 h-3 text-amber-500" /></span>}
                      {eq!.dedicated_circuit && <span title="Dedicated circuit"><Zap className="w-3 h-3 text-yellow-500" /></span>}
                      {eq!.data && <span title="Data"><Wifi className="w-3 h-3 text-green-500" /></span>}
                      {eq!.mechanical_vent && <span title="Ventilation"><Wind className="w-3 h-3 text-cyan-500" /></span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adjacencies */}
        {adjacencies.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Adjacencies</h4>
            <div className="space-y-1.5">
              {adjacencies.map((adj, i) => {
                const other = adj.room_a.toLowerCase() === fpRoom.room_name.toLowerCase()
                  ? adj.room_b : adj.room_a;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className={`text-[9px] ${priorityColors[adj.priority]}`}>
                      {adj.priority}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-stone-300" />
                    <span className="text-stone-700">{other}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Doors */}
        {doors.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Doors ({doors.length})
            </h4>
            <div className="space-y-1.5">
              {doors.map((door) => (
                <div key={door.mark} className="flex items-start gap-2 p-2 bg-stone-50 rounded text-xs">
                  <span className="font-mono font-bold text-stone-500">{door.mark}</span>
                  <div className="flex-1">
                    <div className="text-stone-700">{door.width_mm}×{door.height_mm}mm — {door.type}</div>
                    {door.fire_rating !== "Non-rated" && (
                      <Badge variant="secondary" className="text-[9px] bg-red-50 text-red-700 mt-1">
                        {door.fire_rating}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {scheduleRoom?.notes && (
          <div>
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Notes</h4>
            <p className="text-xs text-stone-600 leading-relaxed">{scheduleRoom.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
