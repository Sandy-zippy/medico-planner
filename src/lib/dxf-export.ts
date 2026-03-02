/**
 * DXF/CAD Export — generates a DXF file from FloorPlanGeometry
 * Uses dxf-writer with AIA standard layers.
 */

import Drawing from 'dxf-writer';
import type { FloorPlanGeometry } from '@/types';

// Convert feet to inches (DXF standard units)
const FT_TO_IN = 12;

// AIA standard layer names and colors (AutoCAD color index)
const LAYERS = {
  'A-WALL': 7,       // White — walls
  'A-DOOR': 3,       // Green — doors
  'A-ROOM-IDEN': 2,  // Yellow — room labels
  'A-DIMS': 8,       // Gray — dimensions
  'A-AREA': 4,       // Cyan — room outlines
  'A-CORR': 1,       // Red — corridors
} as const;

export function exportProjectDXF(floorPlan: FloorPlanGeometry): Blob {
  const d = new Drawing();

  // Add layers
  for (const [name, color] of Object.entries(LAYERS)) {
    d.addLayer(name, color, 'CONTINUOUS');
  }

  // ── Corridor outline ──
  d.setActiveLayer('A-CORR');
  const segments = floorPlan.corridor_segments ?? [floorPlan.corridor];
  for (const seg of segments) {
    const x = seg.x * FT_TO_IN;
    const y = seg.y * FT_TO_IN;
    const w = seg.width * FT_TO_IN;
    const h = seg.depth * FT_TO_IN;
    // Closed polyline for corridor
    drawClosedRect(d, x, y, w, h);
  }

  // ── Room outlines (A-AREA layer) ──
  d.setActiveLayer('A-AREA');
  for (const room of floorPlan.rooms) {
    const x = room.x * FT_TO_IN;
    const y = room.y * FT_TO_IN;
    const w = room.width * FT_TO_IN;
    const h = room.depth * FT_TO_IN;
    drawClosedRect(d, x, y, w, h);
  }

  // ── Room labels (A-ROOM-IDEN layer) ──
  d.setActiveLayer('A-ROOM-IDEN');
  for (const room of floorPlan.rooms) {
    const cx = (room.x + room.width / 2) * FT_TO_IN;
    const cy = (room.y + room.depth / 2) * FT_TO_IN;
    // Room number
    d.drawText(cx, cy + 6, 4, 0, room.room_number);
    // Room name
    d.drawText(cx, cy - 2, 3, 0, room.room_name);
    // Area
    d.drawText(cx, cy - 8, 2.5, 0, `${room.area_programmed} SF`);
  }

  // ── Walls (A-WALL layer) ──
  d.setActiveLayer('A-WALL');
  for (const wall of floorPlan.walls) {
    const x1 = wall.x1 * FT_TO_IN;
    const y1 = wall.y1 * FT_TO_IN;
    const x2 = wall.x2 * FT_TO_IN;
    const y2 = wall.y2 * FT_TO_IN;
    d.drawLine(x1, y1, x2, y2);
  }

  // ── Doors (A-DOOR layer) ──
  d.setActiveLayer('A-DOOR');
  for (const door of floorPlan.doors) {
    const x = door.x * FT_TO_IN;
    const y = door.y * FT_TO_IN;
    const r = door.width_ft * FT_TO_IN;

    if (door.orientation === 'vertical') {
      // Door leaf as line
      d.drawLine(x, y - r / 2, x + r, y - r / 2);
      // Arc approximation as a series of short lines
      drawArc(d, x, y - r / 2, r, 0, 90);
    } else {
      d.drawLine(x - r / 2, y, x - r / 2, y + r);
      drawArc(d, x - r / 2, y, r, 270, 360);
    }

    // Door mark text
    d.drawText(x, y - r - 4, 2.5, 0, door.mark);
  }

  // ── Dimensions (A-DIMS layer) ──
  d.setActiveLayer('A-DIMS');
  for (const dim of floorPlan.dimensions) {
    if (dim.type === 'overall') {
      const x1 = dim.x1 * FT_TO_IN;
      const y1 = dim.y1 * FT_TO_IN;
      const x2 = dim.x2 * FT_TO_IN;
      const y2 = dim.y2 * FT_TO_IN;
      d.drawLine(x1, y1, x2, y2);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      d.drawText(mx, my - 3, 2, 0, dim.label);
    }
  }

  const dxfString = d.toDxfString();
  return new Blob([dxfString], { type: 'application/dxf' });
}

// ── Drawing helpers ──

function drawClosedRect(d: Drawing, x: number, y: number, w: number, h: number) {
  d.drawLine(x, y, x + w, y);
  d.drawLine(x + w, y, x + w, y + h);
  d.drawLine(x + w, y + h, x, y + h);
  d.drawLine(x, y + h, x, y);
}

function drawArc(d: Drawing, cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const steps = 8;
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const step = (endRad - startRad) / steps;
  for (let i = 0; i < steps; i++) {
    const a1 = startRad + i * step;
    const a2 = startRad + (i + 1) * step;
    d.drawLine(
      cx + r * Math.cos(a1), cy + r * Math.sin(a1),
      cx + r * Math.cos(a2), cy + r * Math.sin(a2),
    );
  }
}
