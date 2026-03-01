"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Loader2, LayoutGrid, Box, Palette, MapPin, Cpu, Ruler, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FloorPlanSVG, FINISH_PALETTE, CORRIDOR_FILL, ZONE_PALETTE, WALL_STYLES, WALL_THICKNESS_PX } from "./floor-plan-svg";
import type { OverlayMode } from "./floor-plan-svg";
import { RoomInspector } from "./room-inspector";
import type { OutputJSON } from "@/types";

const Scene3DTab = dynamic(
  () => import("./tabs/scene-3d-tab").then((mod) => mod.Scene3DTab),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    ),
  }
);

type ViewMode = "plan" | "3d";

const overlayOptions: { value: OverlayMode; icon: typeof Palette; label: string }[] = [
  { value: "finishes", icon: Palette, label: "Finishes" },
  { value: "zones", icon: MapPin, label: "Zones" },
  { value: "equipment", icon: Cpu, label: "Equipment" },
];

export function DesignCanvas({ output }: { output: OutputJSON }) {
  const [viewMode, setViewMode] = useState<ViewMode>("plan");
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("finishes");
  const [showDimensions, setShowDimensions] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const hasFloorPlan = !!output.floor_plan;
  const has3D = !!output.scene_3d;
  const fp = output.floor_plan;

  const hoveredRoomData = useMemo(() => {
    if (!hoveredRoom || !fp) return null;
    return fp.rooms.find(r => r.room_number === hoveredRoom) ?? null;
  }, [hoveredRoom, fp]);

  // Legend items for current overlay
  const legendItems = useMemo(() => {
    if (!fp) return [];
    if (overlayMode === "zones") {
      const zones = new Set(fp.rooms.map(r => r.zone));
      return Array.from(zones).sort().map(z => ({
        color: ZONE_PALETTE[z]?.fill ?? "#e5e7eb",
        label: ZONE_PALETTE[z]?.label ?? z,
        code: z,
      }));
    }
    if (overlayMode === "equipment") return [];
    // finishes
    const codes = new Set<string>();
    fp.rooms.forEach(r => {
      const key = r.finish_code.toUpperCase().replace(/\s/g, "");
      if (FINISH_PALETTE[key]) codes.add(key);
    });
    return Array.from(codes).sort().map(c => ({
      color: FINISH_PALETTE[c].fill,
      label: FINISH_PALETTE[c].label,
      code: c,
    }));
  }, [fp, overlayMode]);

  const usedWallTypes = useMemo(() => {
    if (!fp) return [];
    const types = new Set<string>();
    fp.walls.forEach(w => types.add(w.wall_type));
    return Array.from(types).sort();
  }, [fp]);

  if (!hasFloorPlan && !has3D) {
    return (
      <div className="bg-stone-50 border border-dashed border-stone-300 rounded-lg p-12 text-center">
        <LayoutGrid className="w-10 h-10 text-stone-300 mx-auto mb-3" />
        <p className="text-sm text-stone-400">No floor plan generated yet. Click Generate to create one.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-0">
      {/* Main canvas area */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-t-lg px-3 py-2">
          <div className="flex items-center gap-1">
            {/* View mode toggle */}
            {hasFloorPlan && (
              <button
                onClick={() => setViewMode("plan")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === "plan" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Plan
              </button>
            )}
            {has3D && (
              <button
                onClick={() => setViewMode("3d")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === "3d" ? "bg-stone-900 text-white" : "text-stone-500 hover:bg-stone-200"
                }`}
              >
                <Box className="w-3.5 h-3.5" /> 3D
              </button>
            )}

            {/* Separator */}
            {viewMode === "plan" && (
              <>
                <div className="w-px h-5 bg-stone-200 mx-2" />

                {/* Overlay mode */}
                {overlayOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setOverlayMode(opt.value)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                      overlayMode === opt.value ? "bg-blue-100 text-blue-700" : "text-stone-400 hover:bg-stone-200"
                    }`}
                  >
                    <opt.icon className="w-3 h-3" /> {opt.label}
                  </button>
                ))}

                <div className="w-px h-5 bg-stone-200 mx-2" />

                {/* Dimensions toggle */}
                <button
                  onClick={() => setShowDimensions(!showDimensions)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                    showDimensions ? "bg-blue-100 text-blue-700" : "text-stone-400 hover:bg-stone-200"
                  }`}
                >
                  <Ruler className="w-3 h-3" /> Dims
                </button>
              </>
            )}
          </div>

          {/* Info */}
          {fp && (
            <span className="text-[11px] text-stone-400">
              {fp.envelope.width.toFixed(0)}&apos; &times; {fp.envelope.depth.toFixed(0)}&apos; &middot; {fp.rooms.length} rooms
            </span>
          )}
        </div>

        {/* Canvas */}
        <div className="border border-t-0 border-stone-200 rounded-b-lg overflow-hidden bg-white relative">
          {viewMode === "plan" && hasFloorPlan ? (
            <FloorPlanSVG
              output={output}
              selectedRoom={selectedRoom}
              onRoomClick={(roomNumber) => setSelectedRoom(selectedRoom === roomNumber ? null : roomNumber)}
              onRoomHover={(roomNumber, pos) => {
                setHoveredRoom(roomNumber);
                setMouse(pos);
              }}
              overlayMode={overlayMode}
              showDimensions={showDimensions}
            />
          ) : has3D ? (
            <Scene3DTab scene={output.scene_3d!} />
          ) : null}

          {/* Hover tooltip */}
          {viewMode === "plan" && hoveredRoomData && !selectedRoom && (
            <div
              className="fixed z-50 bg-white border border-stone-200 shadow-lg rounded-lg p-3 text-sm max-w-xs pointer-events-none"
              style={{ left: mouse.x + 12, top: mouse.y + 12 }}
            >
              <div className="font-semibold text-stone-900">
                {hoveredRoomData.room_number} — {hoveredRoomData.room_name}
              </div>
              <div className="text-stone-500 mt-1 text-xs">
                {hoveredRoomData.area_programmed} SF &middot; {hoveredRoomData.width.toFixed(1)}&apos; &times; {hoveredRoomData.depth.toFixed(1)}&apos;
              </div>
              <div className="text-stone-400 text-[10px] mt-1">Click to inspect</div>
            </div>
          )}

          {/* Inline legend */}
          {viewMode === "plan" && legendItems.length > 0 && (
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-stone-200 rounded-lg px-3 py-2 shadow-sm">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {legendItems.map(item => (
                  <div key={item.code} className="flex items-center gap-1.5">
                    <div className="w-3 h-2.5 rounded-sm border border-stone-300" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-stone-500">
                      <span className="font-medium">{item.code}</span> {item.label}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2.5 rounded-sm border border-stone-300" style={{ backgroundColor: CORRIDOR_FILL }} />
                  <span className="text-[10px] text-stone-500"><span className="font-medium">COR</span> Corridor</span>
                </div>
              </div>
              {/* Wall types */}
              {usedWallTypes.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 pt-1.5 border-t border-stone-100">
                  {usedWallTypes.map(code => {
                    const style = WALL_STYLES[code];
                    if (!style) return null;
                    return (
                      <div key={code} className="flex items-center gap-1.5">
                        <svg width={16} height={8}>
                          <rect x={0} y={2} width={16} height={4} fill={style.fill} rx={1} />
                        </svg>
                        <span className="text-[10px] text-stone-500">
                          <span className="font-medium">{code}</span> {style.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Room inspector panel */}
      {selectedRoom && (
        <RoomInspector
          roomNumber={selectedRoom}
          output={output}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
