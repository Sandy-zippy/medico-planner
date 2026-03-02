/**
 * Builds a standalone SVG string from FloorPlanGeometry for PDF rendering.
 * Reuses palettes from floor-plan-svg.tsx.
 */

import type { FloorPlanGeometry, OutputJSON } from '@/types';

const FINISH_PALETTE: Record<string, string> = {
  F1: '#F5F0E8', F2: '#E0EBF0', F3: '#D9E8D9', F4: '#DCE8F0',
  F5: '#F0ECD8', F6: '#F5E8D8', F7: '#E0DCD5', F8: '#EDE8E0',
};

const CORRIDOR_FILL = '#F5F5F0';

const WALL_FILLS: Record<string, string> = {
  W1: '#1c1917', W2: '#292524', P2: '#44403c', P3: '#6b7280',
  P4: '#64748b', P5: '#b91c1c', P1: '#9ca3af', P6: '#78716c',
};

const WALL_PX: Record<string, number> = {
  W1: 5, W2: 4.5, P2: 3.8, P3: 3.2, P4: 3.2, P5: 4, P1: 2.8, P6: 3,
};

export function buildFloorPlanSVG(output: OutputJSON): string {
  const fp = output.floor_plan;
  if (!fp) return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';

  const scale = 10;
  const margin = 40;
  const svgW = fp.envelope.width * scale + margin * 2 + 30;
  const svgH = fp.envelope.depth * scale + margin * 2 + 20;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`);
  parts.push(`<g transform="translate(${margin},${margin})">`);

  // Corridor(s)
  const segments = fp.corridor_segments ?? [fp.corridor];
  for (const seg of segments) {
    parts.push(`<rect x="${seg.x * scale}" y="${seg.y * scale}" width="${seg.width * scale}" height="${seg.depth * scale}" fill="${CORRIDOR_FILL}" />`);
  }

  // Room fills
  for (const room of fp.rooms) {
    const fill = FINISH_PALETTE[room.finish_code.toUpperCase()] ?? '#E8E4DE';
    parts.push(`<rect x="${room.x * scale}" y="${room.y * scale}" width="${room.width * scale}" height="${room.depth * scale}" fill="${fill}" />`);
    // Room label
    const cx = (room.x + room.width / 2) * scale;
    const cy = (room.y + room.depth / 2) * scale;
    parts.push(`<text x="${cx}" y="${cy - 5}" text-anchor="middle" font-size="8" font-weight="700" fill="#1c1917">${room.room_number}</text>`);
    parts.push(`<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="6" fill="#44403c">${escapeXml(room.room_name)}</text>`);
    parts.push(`<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="5" fill="#78716c">${room.area_programmed} SF</text>`);
  }

  // Walls
  for (const wall of fp.walls) {
    const fill = WALL_FILLS[wall.wall_type] ?? '#9ca3af';
    const thick = WALL_PX[wall.wall_type] ?? 2.8;
    const x1 = wall.x1 * scale, y1 = wall.y1 * scale;
    const x2 = wall.x2 * scale, y2 = wall.y2 * scale;
    const isH = Math.abs(y1 - y2) < 0.5;
    if (isH) {
      parts.push(`<rect x="${Math.min(x1, x2)}" y="${y1 - thick / 2}" width="${Math.abs(x2 - x1)}" height="${thick}" fill="${fill}" />`);
    } else {
      parts.push(`<rect x="${x1 - thick / 2}" y="${Math.min(y1, y2)}" width="${thick}" height="${Math.abs(y2 - y1)}" fill="${fill}" />`);
    }
  }

  // Doors (simplified arcs)
  for (const door of fp.doors) {
    const x = door.x * scale, y = door.y * scale;
    const r = door.width_ft * scale;
    const gapHalf = r / 2;
    if (door.orientation === 'vertical') {
      parts.push(`<rect x="${x - 3}" y="${y - gapHalf - 1}" width="6" height="${gapHalf * 2 + 2}" fill="white" />`);
      parts.push(`<line x1="${x}" y1="${y - gapHalf}" x2="${x + r}" y2="${y - gapHalf}" stroke="#1c1917" stroke-width="1.5" />`);
    } else {
      parts.push(`<rect x="${x - gapHalf - 1}" y="${y - 3}" width="${gapHalf * 2 + 2}" height="6" fill="white" />`);
      parts.push(`<line x1="${x - gapHalf}" y1="${y}" x2="${x - gapHalf}" y2="${y + r}" stroke="#1c1917" stroke-width="1.5" />`);
    }
    parts.push(`<text x="${x}" y="${y - 8}" text-anchor="middle" font-size="5" font-weight="600" fill="#44403c">${door.mark}</text>`);
  }

  parts.push('</g></svg>');
  return parts.join('\n');
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
