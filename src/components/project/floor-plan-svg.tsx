"use client";

import { useMemo } from "react";
import type { OutputJSON, FloorPlanRoom, WallSegment, DoorPlacement, DimensionAnnotation, MEPLayout } from "@/types";

// ── Palettes (exported for reuse by thumbnail + finish board) ─────

export const FINISH_PALETTE: Record<string, { fill: string; label: string }> = {
  F1: { fill: "#F5F0E8", label: "Reception / General" },
  F2: { fill: "#E0EBF0", label: "Clinical / Treatment" },
  F3: { fill: "#D9E8D9", label: "Sterilization / Lab" },
  F4: { fill: "#DCE8F0", label: "Wet / Tiled" },
  F5: { fill: "#F0ECD8", label: "Staff / Casual" },
  F6: { fill: "#F5E8D8", label: "Office / Admin" },
  F7: { fill: "#E0DCD5", label: "Utility / Storage" },
  F8: { fill: "#EDE8E0", label: "Consultation" },
};

export const CORRIDOR_FILL = "#F5F5F0";

export const ZONE_PALETTE: Record<string, { fill: string; label: string }> = {
  public:   { fill: "#FEF3C7", label: "Public" },
  clinical: { fill: "#DBEAFE", label: "Clinical" },
  support:  { fill: "#D1FAE5", label: "Support" },
  staff:    { fill: "#FDE68A", label: "Staff" },
  service:  { fill: "#E5E7EB", label: "Service" },
};

export const WALL_STYLES: Record<string, { fill: string; stroke: string; label: string }> = {
  W1: { fill: "#1c1917", stroke: "#1c1917", label: "Exterior Wall" },
  W2: { fill: "#292524", stroke: "#292524", label: "Demising Wall" },
  P2: { fill: "#44403c", stroke: "#44403c", label: "Fire-Rated (1hr)" },
  P3: { fill: "#6b7280", stroke: "#6b7280", label: "Acoustic Partition" },
  P4: { fill: "#64748b", stroke: "#64748b", label: "Wet Wall" },
  P5: { fill: "#b91c1c", stroke: "#b91c1c", label: "X-Ray Shielding" },
  P1: { fill: "#9ca3af", stroke: "#9ca3af", label: "Standard Partition" },
  P6: { fill: "#78716c", stroke: "#78716c", label: "Chase Wall" },
};

export const WALL_THICKNESS_PX: Record<string, number> = {
  W1: 5, W2: 4.5, P2: 3.8, P3: 3.2, P4: 3.2, P5: 4, P1: 2.8, P6: 3,
};

// ── Helpers ────────────────────────────────────────────────────

export function darken(hex: string, amount = 0.08): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - Math.round(255 * amount));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (n & 0xff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function getFill(code: string, overlayMode: OverlayMode = "finishes"): string {
  if (overlayMode === "finishes") {
    const key = code.toUpperCase().replace(/\s/g, "");
    return FINISH_PALETTE[key]?.fill ?? "#E8E4DE";
  }
  return "#E8E4DE";
}

function getZoneFill(zone: string): string {
  return ZONE_PALETTE[zone]?.fill ?? "#E8E4DE";
}

// ── Types ──────────────────────────────────────────────────────

export type OverlayMode = "finishes" | "zones" | "equipment" | "electrical" | "plumbing" | "hvac" | null;

export interface FloorPlanSVGProps {
  output: OutputJSON;
  selectedRoom?: string | null;
  onRoomClick?: (roomNumber: string) => void;
  onRoomHover?: (roomNumber: string | null, mouse: { x: number; y: number }) => void;
  overlayMode?: OverlayMode;
  showDimensions?: boolean;
  showEquipmentTags?: boolean;
  className?: string;
}

// ── SVG Sub-components ─────────────────────────────────────────

function RoomFill({
  room, scale, overlayMode, isHovered, isSelected, onEnter, onMove, onLeave, onClick, output,
}: {
  room: FloorPlanRoom;
  scale: number;
  overlayMode: OverlayMode;
  isHovered: boolean;
  isSelected: boolean;
  onEnter: (e: React.MouseEvent) => void;
  onMove: (e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: () => void;
  output: OutputJSON;
}) {
  const x = room.x * scale;
  const y = room.y * scale;
  const w = room.width * scale;
  const h = room.depth * scale;
  const minDim = Math.min(w, h);

  let fill: string;
  if (overlayMode === "zones") {
    fill = getZoneFill(room.zone);
  } else {
    fill = getFill(room.finish_code, overlayMode);
  }

  const numFontSize = Math.max(7, Math.min(12, minDim / 6));
  const nameFontSize = Math.max(6, Math.min(10, minDim / 8));
  const areaFontSize = Math.max(5.5, Math.min(8, minDim / 10));
  const roomSchedule = output.room_schedule?.find(rs => rs.room_number === room.room_number);
  const equipCount = roomSchedule?.equipment_refs?.length ?? 0;

  return (
    <g
      onMouseEnter={onEnter} onMouseMove={onMove} onMouseLeave={onLeave}
      onClick={onClick}
      className="cursor-pointer"
    >
      <rect
        x={x} y={y} width={w} height={h}
        fill={isHovered ? darken(fill) : fill}
        stroke={isSelected ? "#2563eb" : "none"}
        strokeWidth={isSelected ? 2 : 0}
      />

      {/* Room number in box */}
      {minDim > 28 && (
        <g>
          <rect
            x={x + w / 2 - numFontSize * 1.4}
            y={y + h / 2 - numFontSize * 1.8}
            width={numFontSize * 2.8}
            height={numFontSize * 1.4}
            fill="white" stroke="#44403c" strokeWidth={0.6} rx={1}
          />
          <text
            x={x + w / 2} y={y + h / 2 - numFontSize * 1.1}
            textAnchor="middle" dominantBaseline="central"
            fontSize={numFontSize} fontWeight={700}
            fill="#1c1917" className="pointer-events-none select-none"
          >
            {room.room_number}
          </text>
        </g>
      )}

      {/* Room name */}
      {minDim > 40 && (
        <text
          x={x + w / 2} y={y + h / 2 + nameFontSize * 0.3}
          textAnchor="middle" dominantBaseline="central"
          fontSize={nameFontSize}
          fill="#44403c" className="pointer-events-none select-none"
        >
          {room.room_name.length > Math.floor(w / (nameFontSize * 0.55))
            ? room.room_name.slice(0, Math.floor(w / (nameFontSize * 0.55))) + "\u2026"
            : room.room_name}
        </text>
      )}

      {/* Area */}
      {minDim > 55 && (
        <text
          x={x + w / 2} y={y + h / 2 + nameFontSize + areaFontSize * 0.6}
          textAnchor="middle" dominantBaseline="central"
          fontSize={areaFontSize}
          fill="#78716c" className="pointer-events-none select-none"
        >
          {room.area_programmed} SF
        </text>
      )}

      {/* Finish code */}
      {minDim > 65 && room.finish_code && overlayMode !== "equipment" && (
        <text
          x={x + w / 2} y={y + h / 2 + nameFontSize + areaFontSize * 2}
          textAnchor="middle" dominantBaseline="central"
          fontSize={areaFontSize - 0.5}
          fill="#a8a29e" className="pointer-events-none select-none"
        >
          {room.finish_code}
        </text>
      )}

      {/* Equipment count badge (in equipment overlay mode) */}
      {overlayMode === "equipment" && equipCount > 0 && minDim > 35 && (
        <g>
          <circle
            cx={x + w - 10} cy={y + 10} r={7}
            fill="#7c3aed" stroke="white" strokeWidth={1}
          />
          <text
            x={x + w - 10} y={y + 10}
            textAnchor="middle" dominantBaseline="central"
            fontSize={6} fontWeight={700} fill="white"
            className="pointer-events-none select-none"
          >
            {equipCount}
          </text>
        </g>
      )}

      {/* Equipment tags (in finishes mode) */}
      {overlayMode !== "equipment" && minDim > 70 && roomSchedule && roomSchedule.equipment_refs.length > 0 && (
        <g>
          {roomSchedule.equipment_refs.slice(0, 3).map((eq, i) => (
            <g key={eq}>
              <circle
                cx={x + 8 + i * 18} cy={y + h - 8} r={4}
                fill="none" stroke="#6b7280" strokeWidth={0.4}
              />
              <text
                x={x + 8 + i * 18} y={y + h - 8}
                textAnchor="middle" dominantBaseline="central"
                fontSize={3.5} fill="#6b7280"
                className="pointer-events-none select-none"
              >
                {eq}
              </text>
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

function WallRect({ wall, scale }: { wall: WallSegment; scale: number }) {
  const style = WALL_STYLES[wall.wall_type] ?? WALL_STYLES.P1;
  const thickness = WALL_THICKNESS_PX[wall.wall_type] ?? 2.8;
  const x1 = wall.x1 * scale;
  const y1 = wall.y1 * scale;
  const x2 = wall.x2 * scale;
  const y2 = wall.y2 * scale;
  const isHorizontal = Math.abs(y1 - y2) < 0.5;
  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  if (length < 1) return null;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  if (isHorizontal) {
    return (
      <g>
        <rect x={Math.min(x1, x2)} y={y1 - thickness / 2} width={Math.abs(x2 - x1)} height={thickness} fill={style.fill} />
        {length > 40 && (
          <text x={mx} y={my - thickness / 2 - 3} textAnchor="middle" dominantBaseline="auto"
            fontSize={4.5} fill="#78716c" fontWeight={600} className="pointer-events-none select-none">
            {wall.wall_type}
          </text>
        )}
      </g>
    );
  }
  return (
    <g>
      <rect x={x1 - thickness / 2} y={Math.min(y1, y2)} width={thickness} height={Math.abs(y2 - y1)} fill={style.fill} />
      {length > 40 && (
        <text x={mx + thickness / 2 + 4} y={my} textAnchor="start" dominantBaseline="central"
          fontSize={4.5} fill="#78716c" fontWeight={600} className="pointer-events-none select-none"
          transform={`rotate(-90, ${mx + thickness / 2 + 4}, ${my})`}>
          {wall.wall_type}
        </text>
      )}
    </g>
  );
}

function DoorSwing({ door, scale }: { door: DoorPlacement; scale: number }) {
  const x = door.x * scale;
  const y = door.y * scale;
  const r = door.width_ft * scale;
  const gapHalf = (door.width_ft * scale) / 2;
  const wallClear = 6;

  if (door.orientation === "vertical") {
    const arcDir = door.swing_direction === "right" ? 1 : -1;
    const swingDir = door.swing === "in" ? -arcDir : arcDir;
    return (
      <g>
        <rect x={x - wallClear / 2} y={y - gapHalf - 1} width={wallClear} height={gapHalf * 2 + 2} fill="white" stroke="none" />
        <line x1={x} y1={y - gapHalf} x2={x + r * swingDir} y2={y - gapHalf} stroke="#1c1917" strokeWidth={1.5} />
        <path
          d={`M ${x + r * swingDir} ${y - gapHalf} A ${r} ${r} 0 0 ${swingDir > 0 ? 1 : 0} ${x} ${y + gapHalf}`}
          fill="none" stroke="#78716c" strokeWidth={0.5} strokeDasharray="2 1.5"
        />
        <text x={x + r * swingDir * 0.5} y={y - gapHalf - 5} textAnchor="middle" fontSize={5} fontWeight={600}
          fill="#44403c" className="pointer-events-none select-none">{door.mark}</text>
      </g>
    );
  }
  const arcDir = door.swing_direction === "right" ? 1 : -1;
  const swingDir = door.swing === "in" ? 1 : -1;
  return (
    <g>
      <rect x={x - gapHalf - 1} y={y - wallClear / 2} width={gapHalf * 2 + 2} height={wallClear} fill="white" stroke="none" />
      <line x1={x - gapHalf} y1={y} x2={x - gapHalf} y2={y + r * swingDir} stroke="#1c1917" strokeWidth={1.5} />
      <path
        d={`M ${x - gapHalf} ${y + r * swingDir} A ${r} ${r} 0 0 ${swingDir > 0 ? (arcDir > 0 ? 1 : 0) : (arcDir > 0 ? 0 : 1)} ${x + gapHalf} ${y}`}
        fill="none" stroke="#78716c" strokeWidth={0.5} strokeDasharray="2 1.5"
      />
      <text x={x} y={y + r * swingDir + (swingDir > 0 ? 8 : -4)} textAnchor="middle" fontSize={5} fontWeight={600}
        fill="#44403c" className="pointer-events-none select-none">{door.mark}</text>
    </g>
  );
}

function DimensionLine({ dim, scale }: { dim: DimensionAnnotation; scale: number }) {
  const isHorizontal = Math.abs(dim.y1 - dim.y2) < 0.01;
  const x1 = dim.x1 * scale;
  const y1 = dim.y1 * scale;
  const x2 = dim.x2 * scale;
  const y2 = dim.y2 * scale;
  const off = dim.offset * scale;
  const isOverall = dim.type === "overall";
  const fontSize = isOverall ? 8 : 6;
  const lineColor = isOverall ? "#44403c" : "#a8a29e";
  const tickSize = isOverall ? 4 : 3;

  if (isHorizontal) {
    const ly = y1 - off;
    return (
      <g>
        <line x1={x1} y1={y1} x2={x1} y2={ly - 1} stroke={lineColor} strokeWidth={0.3} />
        <line x1={x2} y1={y1} x2={x2} y2={ly - 1} stroke={lineColor} strokeWidth={0.3} />
        <line x1={x1} y1={ly} x2={x2} y2={ly} stroke={lineColor} strokeWidth={0.5} />
        <line x1={x1 - 1} y1={ly + tickSize} x2={x1 + 1} y2={ly - tickSize} stroke={lineColor} strokeWidth={0.6} />
        <line x1={x2 - 1} y1={ly + tickSize} x2={x2 + 1} y2={ly - tickSize} stroke={lineColor} strokeWidth={0.6} />
        <rect x={(x1 + x2) / 2 - dim.label.length * 2.2} y={ly - fontSize - 2} width={dim.label.length * 4.4} height={fontSize + 2} fill="white" opacity={0.9} />
        <text x={(x1 + x2) / 2} y={ly - 3} textAnchor="middle" dominantBaseline="auto"
          fontSize={fontSize} fontWeight={isOverall ? 600 : 400} fill={lineColor} className="pointer-events-none select-none">
          {dim.label}
        </text>
      </g>
    );
  }
  const lx = x1 + off;
  return (
    <g>
      <line x1={x1} y1={y1} x2={lx + 1} y2={y1} stroke={lineColor} strokeWidth={0.3} />
      <line x1={x1} y1={y2} x2={lx + 1} y2={y2} stroke={lineColor} strokeWidth={0.3} />
      <line x1={lx} y1={y1} x2={lx} y2={y2} stroke={lineColor} strokeWidth={0.5} />
      <line x1={lx - tickSize} y1={y1 - 1} x2={lx + tickSize} y2={y1 + 1} stroke={lineColor} strokeWidth={0.6} />
      <line x1={lx - tickSize} y1={y2 - 1} x2={lx + tickSize} y2={y2 + 1} stroke={lineColor} strokeWidth={0.6} />
      <text x={lx + 5} y={(y1 + y2) / 2} textAnchor="middle" dominantBaseline="central"
        fontSize={fontSize} fontWeight={isOverall ? 600 : 400} fill={lineColor}
        className="pointer-events-none select-none" transform={`rotate(-90, ${lx + 5}, ${(y1 + y2) / 2})`}>
        {dim.label}
      </text>
    </g>
  );
}

function TitleBlock({ x, y, width, envelopeW, output }: {
  x: number; y: number; width: number; envelopeW: number; output: OutputJSON;
}) {
  const scaleRatio = Math.round(envelopeW / 10);
  return (
    <g>
      <rect x={x} y={y} width={width} height={50} fill="white" stroke="#44403c" strokeWidth={0.8} />
      <line x1={x} y1={y + 16} x2={x + width} y2={y + 16} stroke="#d6d3d1" strokeWidth={0.4} />
      <line x1={x} y1={y + 28} x2={x + width} y2={y + 28} stroke="#d6d3d1" strokeWidth={0.4} />
      <line x1={x} y1={y + 38} x2={x + width} y2={y + 38} stroke="#d6d3d1" strokeWidth={0.4} />
      <text x={x + 5} y={y + 11} fontSize={9} fontWeight={700} fill="#1c1917" className="select-none">A100 — FLOOR PLAN</text>
      <text x={x + 5} y={y + 24} fontSize={6} fill="#57534e" className="select-none">
        {output.summary.clinic_type} | {output.summary.total_area_sqft.toLocaleString()} SF
      </text>
      <text x={x + 5} y={y + 35} fontSize={5.5} fill="#78716c" className="select-none">
        Scale: 1:{scaleRatio} | {new Date().toLocaleDateString("en-CA")}
      </text>
      <text x={x + 5} y={y + 46} fontSize={5.5} fill="#78716c" className="select-none">
        {output.summary.city ? `${output.summary.city}, ` : ""}{output.summary.province} | {output.summary.building_code}
      </text>
      <g transform={`translate(${x + width - 18}, ${y + 25})`}>
        <line x1={0} y1={10} x2={0} y2={-8} stroke="#1c1917" strokeWidth={1.2} />
        <polygon points="0,-10 -3.5,-4 3.5,-4" fill="#1c1917" />
        <text x={0} y={-13} textAnchor="middle" fontSize={5.5} fontWeight={700} fill="#1c1917" className="select-none">N</text>
      </g>
    </g>
  );
}

// ── MEP Symbol shapes ──────────────────────────────────────────

const MEP_SHAPES: Record<string, { shape: 'circle' | 'square' | 'triangle' | 'diamond'; size: number }> = {
  duplex_outlet: { shape: 'circle', size: 3 },
  gfci: { shape: 'circle', size: 3.5 },
  switch: { shape: 'square', size: 3 },
  dedicated_circuit: { shape: 'diamond', size: 4 },
  panel: { shape: 'square', size: 6 },
  water_main: { shape: 'triangle', size: 5 },
  hot_supply: { shape: 'circle', size: 3 },
  cold_supply: { shape: 'circle', size: 3 },
  floor_drain: { shape: 'square', size: 3 },
  gas_valve: { shape: 'diamond', size: 3.5 },
  supply_diffuser: { shape: 'square', size: 4 },
  return_grille: { shape: 'square', size: 3.5 },
  thermostat: { shape: 'circle', size: 2.5 },
};

function MEPOverlay({ mep, scale, color, runColor }: { mep: MEPLayout; scale: number; color: string; runColor: string }) {
  return (
    <g opacity={0.85}>
      {/* Runs (lines) */}
      {mep.runs.map((run, i) => (
        <polyline
          key={`run-${i}`}
          points={run.points.map(p => `${p.x * scale},${p.y * scale}`).join(' ')}
          fill="none" stroke={runColor} strokeWidth={1} strokeDasharray="4 2"
          className="pointer-events-none"
        />
      ))}
      {/* Symbols */}
      {mep.symbols.map((sym, i) => {
        const shape = MEP_SHAPES[sym.type] ?? { shape: 'circle' as const, size: 3 };
        const cx = sym.x * scale;
        const cy = sym.y * scale;
        const s = shape.size;
        return (
          <g key={`sym-${i}`}>
            {shape.shape === 'circle' && (
              <circle cx={cx} cy={cy} r={s} fill="white" stroke={color} strokeWidth={1} />
            )}
            {shape.shape === 'square' && (
              <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} fill="white" stroke={color} strokeWidth={1} />
            )}
            {shape.shape === 'triangle' && (
              <polygon points={`${cx},${cy - s} ${cx - s},${cy + s} ${cx + s},${cy + s}`} fill="white" stroke={color} strokeWidth={1} />
            )}
            {shape.shape === 'diamond' && (
              <polygon points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`} fill="white" stroke={color} strokeWidth={1} />
            )}
            {sym.label && (
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                fontSize={Math.min(5, s * 0.9)} fontWeight={600} fill={color}
                className="pointer-events-none select-none">
                {sym.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

// ── Main SVG Component ─────────────────────────────────────────

export function FloorPlanSVG({
  output,
  selectedRoom = null,
  onRoomClick,
  onRoomHover,
  overlayMode = "finishes",
  showDimensions = true,
  className,
}: FloorPlanSVGProps) {
  const fp = output.floor_plan;
  if (!fp) return null;

  const margin = 60;
  const scale = 10;
  const svgW = fp.envelope.width * scale + margin * 2 + 30;
  const svgH = fp.envelope.depth * scale + margin * 2 + 60;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      className={`w-full h-auto bg-white ${className ?? ""}`}
      style={{ minHeight: 300 }}
    >
      <g transform={`translate(${margin}, ${margin})`}>
        {/* Background grid */}
        <defs>
          <pattern id="fp-grid" width={scale} height={scale} patternUnits="userSpaceOnUse">
            <path d={`M ${scale} 0 L 0 0 0 ${scale}`} fill="none" stroke="#f5f5f4" strokeWidth={0.3} />
          </pattern>
          <pattern id="fp-grid5" width={scale * 5} height={scale * 5} patternUnits="userSpaceOnUse">
            <path d={`M ${scale * 5} 0 L 0 0 0 ${scale * 5}`} fill="none" stroke="#e7e5e4" strokeWidth={0.3} />
          </pattern>
        </defs>
        <rect x={-5} y={-5} width={fp.envelope.width * scale + 10} height={fp.envelope.depth * scale + 10} fill="url(#fp-grid)" />
        <rect x={-5} y={-5} width={fp.envelope.width * scale + 10} height={fp.envelope.depth * scale + 10} fill="url(#fp-grid5)" />

        {/* Corridor segment(s) */}
        {(fp.corridor_segments ?? [fp.corridor]).map((seg, si) => (
          <g key={`corr-seg-${si}`}>
            <rect
              x={seg.x * scale} y={seg.y * scale}
              width={seg.width * scale} height={seg.depth * scale}
              fill={CORRIDOR_FILL} stroke="none"
            />
            {Array.from({ length: Math.max(1, Math.floor(Math.max(seg.width, seg.depth) / 18)) }).map((_, i) => {
              const isVertical = seg.depth > seg.width;
              return (
                <text key={`corr-${si}-${i}`}
                  x={(seg.x + seg.width / 2) * scale}
                  y={isVertical ? (seg.y + 10 + i * 18) * scale : (seg.y + seg.depth / 2) * scale}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={6} fontWeight={600} fill="#b8b5b0" letterSpacing={3}
                  className="pointer-events-none select-none">
                  CORRIDOR
                </text>
              );
            })}
          </g>
        ))}

        {/* Room fills */}
        {fp.rooms.map(room => (
          <RoomFill
            key={room.room_number}
            room={room} scale={scale}
            overlayMode={overlayMode}
            isHovered={false}
            isSelected={selectedRoom === room.room_number}
            onEnter={(e) => onRoomHover?.(room.room_number, { x: e.clientX, y: e.clientY })}
            onMove={(e) => onRoomHover?.(room.room_number, { x: e.clientX, y: e.clientY })}
            onLeave={() => onRoomHover?.(null, { x: 0, y: 0 })}
            onClick={() => onRoomClick?.(room.room_number)}
            output={output}
          />
        ))}

        {/* Walls */}
        {fp.walls.map(wall => (
          <WallRect key={wall.id} wall={wall} scale={scale} />
        ))}

        {/* Doors */}
        {fp.doors.map(door => (
          <DoorSwing key={door.mark} door={door} scale={scale} />
        ))}

        {/* MEP Overlay */}
        {overlayMode === "electrical" && output.electrical_plan && (
          <MEPOverlay mep={output.electrical_plan} scale={scale} color="#eab308" runColor="#ca8a04" />
        )}
        {overlayMode === "plumbing" && output.plumbing_plan && (
          <MEPOverlay mep={output.plumbing_plan} scale={scale} color="#3b82f6" runColor="#2563eb" />
        )}
        {overlayMode === "hvac" && output.hvac_plan && (
          <MEPOverlay mep={output.hvac_plan} scale={scale} color="#10b981" runColor="#059669" />
        )}

        {/* Dimensions */}
        {showDimensions && fp.dimensions.map((dim, i) => (
          <DimensionLine key={`dim-${i}`} dim={dim} scale={scale} />
        ))}

        {/* Title block */}
        <TitleBlock
          x={fp.envelope.width * scale - 160}
          y={fp.envelope.depth * scale + 12}
          width={160}
          envelopeW={fp.envelope.width}
          output={output}
        />
      </g>
    </svg>
  );
}
