"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid } from "lucide-react";
import type { OutputJSON, FloorPlanRoom, WallSegment, DoorPlacement, DimensionAnnotation } from "@/types";

// ── Finish palette (same codes as before) ──────────────────

const FINISH_PALETTE: Record<string, { fill: string; label: string }> = {
  F1: { fill: "#F5F0E8", label: "Reception / General" },
  F2: { fill: "#E0EBF0", label: "Clinical / Treatment" },
  F3: { fill: "#D9E8D9", label: "Sterilization / Lab" },
  F4: { fill: "#DCE8F0", label: "Wet / Tiled" },
  F5: { fill: "#F0ECD8", label: "Staff / Casual" },
  F6: { fill: "#F5E8D8", label: "Office / Admin" },
  F7: { fill: "#E0DCD5", label: "Utility / Storage" },
  F8: { fill: "#EDE8E0", label: "Consultation" },
};

const DEFAULT_FILL = "#E8E4DE";
const CORRIDOR_FILL = "#F5F5F0";

// Wall rendering styles by type
const WALL_STYLES: Record<string, { stroke: string; width: number }> = {
  W1: { stroke: "#1c1917", width: 3 },      // exterior
  W2: { stroke: "#1c1917", width: 2.5 },    // demising
  P2: { stroke: "#292524", width: 2 },       // corridor / fire-rated
  P3: { stroke: "#78716c", width: 1.5 },     // acoustic
  P4: { stroke: "#64748b", width: 1.5 },     // wet wall (blue-gray)
  P5: { stroke: "#dc2626", width: 2 },       // lead-lined (red)
  P1: { stroke: "#a8a29e", width: 1.2 },     // standard partition
  P6: { stroke: "#78716c", width: 1.5 },     // chase wall
};

function darken(hex: string, amount = 0.12): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(255 * amount));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function getFill(code: string): string {
  const key = code.toUpperCase().replace(/\s/g, "");
  return FINISH_PALETTE[key]?.fill ?? DEFAULT_FILL;
}

// ── SVG sub-components ─────────────────────────────────────

function RoomRect({
  room, scale, isHovered, onEnter, onMove, onLeave,
}: {
  room: FloorPlanRoom;
  scale: number;
  isHovered: boolean;
  onEnter: (e: React.MouseEvent) => void;
  onMove: (e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const x = room.x * scale;
  const y = room.y * scale;
  const w = room.width * scale;
  const h = room.depth * scale;
  const fill = getFill(room.finish_code);
  const minDim = Math.min(w, h);
  const fontSize = Math.max(7, Math.min(11, minDim / 7));

  return (
    <g onMouseEnter={onEnter} onMouseMove={onMove} onMouseLeave={onLeave} className="cursor-pointer">
      <rect
        x={x} y={y} width={w} height={h}
        fill={isHovered ? darken(fill) : fill}
        stroke="none"
      />
      {/* Room number (bold) */}
      {minDim > 30 && (
        <text
          x={x + w / 2} y={y + h / 2 - fontSize * 0.8}
          textAnchor="middle" dominantBaseline="central"
          fontSize={fontSize} fontWeight={700}
          fill="#44403c" className="pointer-events-none select-none"
        >
          {room.room_number}
        </text>
      )}
      {/* Room name */}
      {minDim > 45 && (
        <text
          x={x + w / 2} y={y + h / 2 + 1}
          textAnchor="middle" dominantBaseline="central"
          fontSize={Math.max(6, fontSize - 2)}
          fill="#78716c" className="pointer-events-none select-none"
        >
          {room.room_name.length > Math.floor(w / (fontSize * 0.55))
            ? room.room_name.slice(0, Math.floor(w / (fontSize * 0.55))) + "\u2026"
            : room.room_name}
        </text>
      )}
      {/* Area */}
      {minDim > 60 && (
        <text
          x={x + w / 2} y={y + h / 2 + fontSize + 2}
          textAnchor="middle" dominantBaseline="central"
          fontSize={Math.max(6, fontSize - 3)}
          fill="#a8a29e" className="pointer-events-none select-none"
        >
          {room.area_programmed.toLocaleString()} SF
        </text>
      )}
    </g>
  );
}

function WallLine({ wall, scale }: { wall: WallSegment; scale: number }) {
  const style = WALL_STYLES[wall.wall_type] ?? WALL_STYLES.P1;
  return (
    <line
      x1={wall.x1 * scale} y1={wall.y1 * scale}
      x2={wall.x2 * scale} y2={wall.y2 * scale}
      stroke={style.stroke}
      strokeWidth={style.width}
      strokeLinecap="round"
    />
  );
}

function DoorSwing({ door, scale }: { door: DoorPlacement; scale: number }) {
  const x = door.x * scale;
  const y = door.y * scale;
  const r = door.width_ft * scale;
  const gapHalf = (door.width_ft * scale) / 2;

  if (door.orientation === "vertical") {
    // Door on a vertical wall — gap is vertical, arc sweeps horizontally
    const arcDir = door.swing_direction === "right" ? 1 : -1;
    const swingDir = door.swing === "in" ? -arcDir : arcDir;

    return (
      <g>
        {/* Gap in wall (white rect to cover wall line) */}
        <rect
          x={x - 2} y={y - gapHalf}
          width={4} height={gapHalf * 2}
          fill="white" stroke="none"
        />
        {/* Door leaf */}
        <line
          x1={x} y1={y - gapHalf}
          x2={x + r * swingDir} y2={y - gapHalf}
          stroke="#44403c" strokeWidth={1.5}
        />
        {/* Swing arc */}
        <path
          d={`M ${x + r * swingDir} ${y - gapHalf} A ${r} ${r} 0 0 ${swingDir > 0 ? 1 : 0} ${x} ${y + gapHalf}`}
          fill="none" stroke="#a8a29e" strokeWidth={0.7}
          strokeDasharray="3 2"
        />
      </g>
    );
  } else {
    // Door on a horizontal wall — gap is horizontal, arc sweeps vertically
    const arcDir = door.swing_direction === "right" ? 1 : -1;
    const swingDir = door.swing === "in" ? 1 : -1;

    return (
      <g>
        {/* Gap */}
        <rect
          x={x - gapHalf} y={y - 2}
          width={gapHalf * 2} height={4}
          fill="white" stroke="none"
        />
        {/* Door leaf */}
        <line
          x1={x - gapHalf} y1={y}
          x2={x - gapHalf} y2={y + r * swingDir}
          stroke="#44403c" strokeWidth={1.5}
        />
        {/* Swing arc */}
        <path
          d={`M ${x - gapHalf} ${y + r * swingDir} A ${r} ${r} 0 0 ${swingDir > 0 ? (arcDir > 0 ? 1 : 0) : (arcDir > 0 ? 0 : 1)} ${x + gapHalf} ${y}`}
          fill="none" stroke="#a8a29e" strokeWidth={0.7}
          strokeDasharray="3 2"
        />
      </g>
    );
  }
}

function DimensionLine({ dim, scale }: { dim: DimensionAnnotation; scale: number }) {
  const isHorizontal = Math.abs(dim.y1 - dim.y2) < 0.01;
  const x1 = dim.x1 * scale;
  const y1 = dim.y1 * scale;
  const x2 = dim.x2 * scale;
  const y2 = dim.y2 * scale;
  const off = dim.offset * scale;
  const fontSize = dim.type === "overall" ? 8 : 6.5;

  if (isHorizontal) {
    const ly = y1 - off;
    return (
      <g>
        {/* Extension lines */}
        <line x1={x1} y1={y1} x2={x1} y2={ly - 2} stroke="#a8a29e" strokeWidth={0.4} />
        <line x1={x2} y1={y1} x2={x2} y2={ly - 2} stroke="#a8a29e" strokeWidth={0.4} />
        {/* Dimension line */}
        <line x1={x1} y1={ly} x2={x2} y2={ly} stroke="#78716c" strokeWidth={0.5} />
        {/* Tick marks */}
        <line x1={x1} y1={ly - 3} x2={x1} y2={ly + 3} stroke="#78716c" strokeWidth={0.5} />
        <line x1={x2} y1={ly - 3} x2={x2} y2={ly + 3} stroke="#78716c" strokeWidth={0.5} />
        {/* Label */}
        <text
          x={(x1 + x2) / 2} y={ly - 3}
          textAnchor="middle" dominantBaseline="auto"
          fontSize={fontSize} fill="#57534e"
          className="pointer-events-none select-none"
        >
          {dim.label}
        </text>
      </g>
    );
  } else {
    const lx = x1 + off;
    return (
      <g>
        <line x1={x1} y1={y1} x2={lx + 2} y2={y1} stroke="#a8a29e" strokeWidth={0.4} />
        <line x1={x1} y1={y2} x2={lx + 2} y2={y2} stroke="#a8a29e" strokeWidth={0.4} />
        <line x1={lx} y1={y1} x2={lx} y2={y2} stroke="#78716c" strokeWidth={0.5} />
        <line x1={lx - 3} y1={y1} x2={lx + 3} y2={y1} stroke="#78716c" strokeWidth={0.5} />
        <line x1={lx - 3} y1={y2} x2={lx + 3} y2={y2} stroke="#78716c" strokeWidth={0.5} />
        <text
          x={lx + 5} y={(y1 + y2) / 2}
          textAnchor="start" dominantBaseline="central"
          fontSize={fontSize} fill="#57534e"
          className="pointer-events-none select-none"
          transform={`rotate(-90, ${lx + 5}, ${(y1 + y2) / 2})`}
        >
          {dim.label}
        </text>
      </g>
    );
  }
}

// ── Title block ────────────────────────────────────────────

function TitleBlock({ x, y, width, scale, envelopeW }: {
  x: number; y: number; width: number; scale: number; envelopeW: number;
}) {
  const scaleRatio = Math.round(envelopeW / 10); // approximate
  return (
    <g>
      <rect x={x} y={y} width={width} height={36} fill="white" stroke="#78716c" strokeWidth={0.5} />
      <line x1={x} y1={y + 14} x2={x + width} y2={y + 14} stroke="#d6d3d1" strokeWidth={0.3} />
      <line x1={x} y1={y + 24} x2={x + width} y2={y + 24} stroke="#d6d3d1" strokeWidth={0.3} />
      <text x={x + 4} y={y + 10} fontSize={8} fontWeight={700} fill="#1c1917" className="select-none">
        A100 — FLOOR PLAN
      </text>
      <text x={x + 4} y={y + 21} fontSize={6} fill="#57534e" className="select-none">
        Scale: 1:{scaleRatio}
      </text>
      <text x={x + width / 2} y={y + 21} fontSize={6} fill="#57534e" className="select-none">
        {new Date().toLocaleDateString("en-CA")}
      </text>
      {/* North arrow */}
      <g transform={`translate(${x + width - 18}, ${y + 18})`}>
        <line x1={0} y1={10} x2={0} y2={-8} stroke="#44403c" strokeWidth={1} />
        <polygon points="0,-10 -3,-5 3,-5" fill="#44403c" />
        <text x={0} y={-12} textAnchor="middle" fontSize={5} fontWeight={700} fill="#44403c" className="select-none">N</text>
      </g>
    </g>
  );
}

// ── Main component ─────────────────────────────────────────

export function FloorPlanTab({ output }: { output: OutputJSON }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const fp = output.floor_plan;

  // Collect finish codes used
  const usedCodes = useMemo(() => {
    if (!fp) return [];
    const codes = new Set<string>();
    fp.rooms.forEach(r => {
      const key = r.finish_code.toUpperCase().replace(/\s/g, "");
      if (FINISH_PALETTE[key]) codes.add(key);
    });
    return Array.from(codes).sort();
  }, [fp]);

  // Filter dimensions to only show overall + corridor (room dims are too noisy at default zoom)
  const visibleDims = useMemo(() => {
    if (!fp) return [];
    return fp.dimensions.filter(d => d.type === "overall" || d.type === "corridor");
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
            No floor plan data available. Re-generate the project to produce an architectural floor plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Scale: fit into reasonable SVG viewbox
  const margin = 50;
  const scale = 10; // 10px per foot
  const svgW = fp.envelope.width * scale + margin * 2;
  const svgH = fp.envelope.depth * scale + margin * 2 + 40; // +40 for title block
  const offsetX = margin;
  const offsetY = margin;

  const hoveredRoom = fp.rooms.find(r => r.room_number === hovered);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" /> Floor Plan — Architectural Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto border border-stone-200 rounded-lg bg-white"
            onMouseLeave={() => setHovered(null)}
          >
            <g transform={`translate(${offsetX}, ${offsetY})`}>
              {/* Corridor fill */}
              <rect
                x={fp.corridor.x * scale}
                y={fp.corridor.y * scale}
                width={fp.corridor.width * scale}
                height={fp.corridor.depth * scale}
                fill={CORRIDOR_FILL}
                stroke="none"
              />
              {/* Corridor label — repeating */}
              {Array.from({ length: Math.max(1, Math.floor(fp.corridor.depth / 15)) }).map((_, i) => (
                <text
                  key={`corr-${i}`}
                  x={(fp.corridor.x + fp.corridor.width / 2) * scale}
                  y={(fp.corridor.y + 8 + i * 15) * scale}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={7} fontWeight={600} fill="#a8a29e"
                  letterSpacing={2}
                  className="pointer-events-none select-none"
                >
                  CORRIDOR
                </text>
              ))}

              {/* Room fills */}
              {fp.rooms.map(room => (
                <RoomRect
                  key={room.room_number}
                  room={room}
                  scale={scale}
                  isHovered={hovered === room.room_number}
                  onEnter={(e) => {
                    setHovered(room.room_number);
                    setMouse({ x: e.clientX, y: e.clientY });
                  }}
                  onMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
                  onLeave={() => setHovered(null)}
                />
              ))}

              {/* Wall segments */}
              {fp.walls.map(wall => (
                <WallLine key={wall.id} wall={wall} scale={scale} />
              ))}

              {/* Doors */}
              {fp.doors.map(door => (
                <DoorSwing key={door.mark} door={door} scale={scale} />
              ))}

              {/* Dimension annotations (overall + corridor only) */}
              {visibleDims.map((dim, i) => (
                <DimensionLine key={`dim-${i}`} dim={dim} scale={scale} />
              ))}

              {/* Title block */}
              <TitleBlock
                x={fp.envelope.width * scale - 140}
                y={fp.envelope.depth * scale + 8}
                width={140}
                scale={scale}
                envelopeW={fp.envelope.width}
              />
            </g>
          </svg>

          {/* Tooltip */}
          {hoveredRoom && (
            <div
              className="fixed z-50 bg-white border border-stone-200 shadow-lg rounded-lg p-3 text-sm max-w-xs pointer-events-none"
              style={{ left: mouse.x + 12, top: mouse.y + 12 }}
            >
              <div className="font-semibold text-stone-900">
                {hoveredRoom.room_number} — {hoveredRoom.room_name}
              </div>
              <div className="text-stone-500 mt-1">
                {hoveredRoom.area_programmed.toLocaleString()} SF (programmed)
                {hoveredRoom.area_actual !== hoveredRoom.area_programmed && (
                  <span className="ml-1">
                    / {hoveredRoom.area_actual.toLocaleString()} SF (actual)
                  </span>
                )}
              </div>
              <div className="text-stone-400 mt-1 text-xs">
                {hoveredRoom.width.toFixed(1)}&apos; x {hoveredRoom.depth.toFixed(1)}&apos;
                {hoveredRoom.finish_code && (
                  <span className="ml-2">
                    Finish: {hoveredRoom.finish_code}
                  </span>
                )}
              </div>
              <div className="text-stone-400 text-xs mt-0.5 capitalize">
                Zone: {hoveredRoom.zone} | Side: {hoveredRoom.side}
              </div>
              {/* Equipment from room_schedule */}
              {output.room_schedule?.find(rs => rs.room_number === hoveredRoom.room_number)?.equipment_refs.length ? (
                <div className="text-stone-400 mt-1 text-xs">
                  Equipment: {output.room_schedule.find(rs => rs.room_number === hoveredRoom.room_number)!.equipment_refs.join(", ")}
                </div>
              ) : null}
              {/* Adjacencies */}
              {output.adjacencies
                .filter(a =>
                  a.room_a.toLowerCase() === hoveredRoom.room_name.toLowerCase() ||
                  a.room_b.toLowerCase() === hoveredRoom.room_name.toLowerCase()
                ).length > 0 && (
                <div className="mt-2 pt-2 border-t border-stone-100">
                  <div className="text-xs font-medium text-stone-600 mb-1">Adjacencies:</div>
                  {output.adjacencies
                    .filter(a =>
                      a.room_a.toLowerCase() === hoveredRoom.room_name.toLowerCase() ||
                      a.room_b.toLowerCase() === hoveredRoom.room_name.toLowerCase()
                    )
                    .slice(0, 4)
                    .map((a, i) => {
                      const other = a.room_a.toLowerCase() === hoveredRoom.room_name.toLowerCase()
                        ? a.room_b : a.room_a;
                      return (
                        <div key={i} className="text-xs text-stone-400">
                          <span className={
                            a.priority === "required" ? "text-red-600" :
                            a.priority === "preferred" ? "text-blue-600" : "text-stone-400"
                          }>
                            {a.priority}
                          </span>{" "}
                          &rarr; {other}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Finish Legend */}
      {usedCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Finish Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {usedCodes.map(code => (
                <div key={code} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded border border-stone-300"
                    style={{ backgroundColor: FINISH_PALETTE[code].fill }}
                  />
                  <span className="text-xs text-stone-600">
                    {code} — {FINISH_PALETTE[code].label}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded border border-stone-300"
                  style={{ backgroundColor: CORRIDOR_FILL }}
                />
                <span className="text-xs text-stone-600">Corridor</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wall Type Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Wall Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(WALL_STYLES).map(([code, style]) => (
              <div key={code} className="flex items-center gap-2">
                <svg width={24} height={12}>
                  <line
                    x1={0} y1={6} x2={24} y2={6}
                    stroke={style.stroke} strokeWidth={style.width}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-xs text-stone-600">{code}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
