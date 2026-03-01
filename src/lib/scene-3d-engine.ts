/**
 * 3D Scene Engine
 * Converts FloorPlanGeometry (feet) → Scene3DData (meters)
 * Pure geometry, no AI calls.
 */

import type { FloorPlanGeometry, Scene3DData, Wall3D, Floor3D, Door3D, Room3DLabel } from '@/types';

const FT_TO_M = 0.3048;
const WALL_HEIGHT = 2.7; // meters
const FLOOR_Y = 0.01; // slight offset to avoid z-fighting with grid

// Finish code → floor color mapping
const FINISH_COLORS: Record<string, string> = {
  F1: '#E8DDD3', // Reception — warm beige
  F2: '#D4DDE6', // Clinical — cool blue-gray
  F3: '#D6DDD4', // Sterilization — pale green
  F4: '#D0DCE0', // Wet areas — light teal
  F5: '#E0D8D0', // Staff — warm tan
  F6: '#DDD8D2', // Office — light stone
  F7: '#D0D0D0', // Utility — gray
  F8: '#E0D6CC', // Consultation — warm stone
};

// Wall type → color mapping
const WALL_COLORS: Record<string, string> = {
  W1: '#8B8B8B', // Exterior — dark gray
  W2: '#7A7A7A', // Demising — slightly darker
  P1: '#C0C0C0', // Standard partition — light gray
  P2: '#A0A0A0', // Fire-rated — medium gray
  P3: '#B0B8C0', // Acoustic — blue-gray
  P4: '#A8B8A8', // Wet wall — green-gray
  P5: '#C08080', // X-ray shielding — red-gray
  P6: '#B0A0B0', // Chase wall — purple-gray
};

export function generateScene3D(floorPlan: FloorPlanGeometry): Scene3DData {
  const { envelope, rooms, walls: wallSegments, doors: doorPlacements } = floorPlan;

  // Center the building at origin
  const offsetX = (envelope.width * FT_TO_M) / 2;
  const offsetZ = (envelope.depth * FT_TO_M) / 2;

  // ── Walls ──
  const walls: Wall3D[] = wallSegments.map((seg) => {
    const x1 = seg.x1 * FT_TO_M - offsetX;
    const z1 = seg.y1 * FT_TO_M - offsetZ;
    const x2 = seg.x2 * FT_TO_M - offsetX;
    const z2 = seg.y2 * FT_TO_M - offsetZ;

    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const thickness = (seg.thickness_inches / 12) * FT_TO_M;

    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;

    // Determine wall orientation
    const isHorizontal = Math.abs(dz) < 0.01;

    return {
      id: seg.id,
      position: [cx, WALL_HEIGHT / 2, cz] as [number, number, number],
      size: isHorizontal
        ? [length, WALL_HEIGHT, thickness] as [number, number, number]
        : [thickness, WALL_HEIGHT, length] as [number, number, number],
      color: WALL_COLORS[seg.wall_type] ?? '#C0C0C0',
      wall_type: seg.wall_type,
    };
  });

  // ── Floor tiles ──
  const floors: Floor3D[] = rooms.map((room) => {
    const rx = room.x * FT_TO_M - offsetX + (room.width * FT_TO_M) / 2;
    const rz = room.y * FT_TO_M - offsetZ + (room.depth * FT_TO_M) / 2;

    return {
      room_number: room.room_number,
      room_name: room.room_name,
      position: [rx, FLOOR_Y, rz] as [number, number, number],
      size: [room.width * FT_TO_M, room.depth * FT_TO_M] as [number, number],
      color: FINISH_COLORS[room.finish_code] ?? '#D8D8D8',
      finish_code: room.finish_code,
    };
  });

  // Add corridor floor
  const corridor = floorPlan.corridor;
  floors.push({
    room_number: 'COR',
    room_name: 'Corridor',
    position: [
      corridor.x * FT_TO_M - offsetX + (corridor.width * FT_TO_M) / 2,
      FLOOR_Y - 0.001,
      corridor.y * FT_TO_M - offsetZ + (corridor.depth * FT_TO_M) / 2,
    ],
    size: [corridor.width * FT_TO_M, corridor.depth * FT_TO_M],
    color: '#E8E4E0',
    finish_code: 'COR',
  });

  // ── Doors (as openings) ──
  const doors: Door3D[] = doorPlacements.map((dp) => {
    const dx = dp.x * FT_TO_M - offsetX;
    const dz = dp.y * FT_TO_M - offsetZ;
    const doorWidthM = dp.width_ft * FT_TO_M;
    const rotation = dp.orientation === 'horizontal' ? 0 : Math.PI / 2;

    return {
      mark: dp.mark,
      position: [dx, WALL_HEIGHT / 2, dz] as [number, number, number],
      size: [doorWidthM, WALL_HEIGHT] as [number, number],
      rotation,
    };
  });

  // ── Room labels ──
  const labels: Room3DLabel[] = rooms.map((room) => ({
    room_number: room.room_number,
    room_name: room.room_name,
    position: [
      room.x * FT_TO_M - offsetX + (room.width * FT_TO_M) / 2,
      WALL_HEIGHT + 0.3,
      room.y * FT_TO_M - offsetZ + (room.depth * FT_TO_M) / 2,
    ] as [number, number, number],
  }));

  // ── Camera ──
  const bw = envelope.width * FT_TO_M;
  const bd = envelope.depth * FT_TO_M;
  const camDist = Math.max(bw, bd) * 1.2;

  return {
    walls,
    floors,
    doors,
    labels,
    camera: {
      position: [camDist * 0.6, camDist * 0.8, camDist * 0.6],
      target: [0, 0, 0],
    },
    bounds: {
      width: bw,
      depth: bd,
    },
  };
}
