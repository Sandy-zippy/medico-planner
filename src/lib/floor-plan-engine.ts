/**
 * Floor Plan Layout Engine
 * Generates spatial geometry for architectural floor plans using a
 * double-loaded corridor algorithm (standard for small/medium clinics).
 */

import type {
  FloorPlanGeometry, FloorPlanRoom, WallSegment, DoorPlacement,
  DimensionAnnotation, RoomScheduleEntry, Adjacency, DoorScheduleEntry,
  WallType,
} from '@/types';

// ── Constants ──────────────────────────────────────────────

const CORRIDOR_WIDTH = 5;       // feet
const EXT_WALL_THICK = 0.5;    // 6 inches
const INT_WALL_THICK = 0.383;  // ~4.6 inches (corridor walls)
const PART_WALL_THICK = 0.333; // ~4 inches (room partitions)
const MIN_ROOM_WIDTH = 8;
const MIN_ROOM_DEPTH = 8;
const MAX_ASPECT_RATIO = 3;
const SNAP_INCHES = 6;         // round to nearest 6"

// ── Zone classification ────────────────────────────────────

type Zone = 'public' | 'clinical' | 'support' | 'staff' | 'service';

const ZONE_KEYWORDS: Record<Zone, string[]> = {
  public: ['reception', 'waiting', 'dispensary', 'retail', 'optical', 'lobby', 'entry'],
  clinical: ['operatory', 'exam', 'treatment', 'surgery', 'consultation', 'pre-test', 'contact lens', 'private treatment', 'bay'],
  support: ['sterilization', 'x-ray', 'pano', 'lab', 'pharmacy', 'compounding', 'blood draw', 'cbct'],
  staff: ['doctor', 'staff', 'office', 'nurse', 'break'],
  service: ['storage', 'mechanical', 'wc', 'washroom', 'janitor', 'cold storage', 'receiving', 'kennel', 'recovery'],
};

function classifyZone(roomName: string): Zone {
  const lower = roomName.toLowerCase();
  for (const [zone, keywords] of Object.entries(ZONE_KEYWORDS) as [Zone, string[]][]) {
    if (keywords.some(kw => lower.includes(kw))) return zone;
  }
  return 'service';
}

// ── Helpers ────────────────────────────────────────────────

function snapToHalfFoot(val: number): number {
  return Math.round(val * (12 / SNAP_INCHES)) / (12 / SNAP_INCHES);
}

function feetToArchString(feet: number): string {
  const totalInches = Math.round(feet * 12);
  const ft = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  if (inches === 0) return `${ft}'-0"`;
  return `${ft}'-${inches}"`;
}

function getWallTypeForPartition(
  roomA: FloorPlanRoom | null,
  roomB: FloorPlanRoom | null,
): { type: string; thickness: number } {
  const names = [roomA?.room_name ?? '', roomB?.room_name ?? ''].map(n => n.toLowerCase());
  // X-ray: lead-lined
  if (names.some(n => n.includes('x-ray') || n.includes('pano') || n.includes('cbct'))) {
    return { type: 'P5', thickness: 6 };
  }
  // Wet rooms
  if (names.some(n => n.includes('washroom') || n.includes('sterilization') || n.includes('hydrotherapy') || n.includes('compounding'))) {
    return { type: 'P4', thickness: 4.6 };
  }
  // Clinical: acoustic
  if (names.some(n => n.includes('exam') || n.includes('operatory') || n.includes('treatment') || n.includes('consultation') || n.includes('surgery'))) {
    return { type: 'P3', thickness: 4.6 };
  }
  // Standard
  return { type: 'P1', thickness: 3.625 };
}

// ── Main algorithm ─────────────────────────────────────────

interface LayoutRoom {
  room_number: string;
  room_name: string;
  area_programmed: number;
  finish_code: string;
  zone: Zone;
  doorMark?: string;
  doorWidth_ft: number;
}

export function generateFloorPlanLayout(
  roomSchedule: RoomScheduleEntry[],
  adjacencies: Adjacency[],
  doorSchedule: DoorScheduleEntry[],
  wallTypes: WallType[],
  totalAreaSqft: number,
  clinicType: string,
): FloorPlanGeometry {
  // ── Step 1: Prepare rooms with zones ──
  const layoutRooms: LayoutRoom[] = roomSchedule.map(rs => {
    const doorEntry = doorSchedule.find(d =>
      d.location.toLowerCase() === rs.room_name.toLowerCase()
    );
    return {
      room_number: rs.room_number,
      room_name: rs.room_name,
      area_programmed: rs.area_sqft,
      finish_code: rs.finish_code,
      zone: classifyZone(rs.room_name),
      doorMark: doorEntry?.mark,
      doorWidth_ft: doorEntry ? doorEntry.width_mm / 304.8 : 3,
    };
  });

  // Separate reception (front) from rest
  const receptionIdx = layoutRooms.findIndex(r => r.zone === 'public' && r.room_name.toLowerCase().includes('reception'));
  const reception = receptionIdx >= 0 ? layoutRooms.splice(receptionIdx, 1)[0] : null;

  // ── Step 2: Compute building envelope ──
  const grossArea = totalAreaSqft;
  let buildingWidth = Math.ceil(Math.sqrt(grossArea / 1.8));
  buildingWidth = Math.max(buildingWidth, 2 * MIN_ROOM_WIDTH + CORRIDOR_WIDTH + 2 * EXT_WALL_THICK);
  buildingWidth = Math.round(buildingWidth / 2) * 2; // round to nearest 2ft

  const stripWidth = (buildingWidth - CORRIDOR_WIDTH) / 2;

  // Check for single-loaded corridor (small buildings)
  const singleLoaded = grossArea < 1500;
  const leftStripWidth = singleLoaded ? 0 : stripWidth;
  const rightStripWidth = stripWidth;
  const effectiveWidth = singleLoaded
    ? rightStripWidth + CORRIDOR_WIDTH
    : buildingWidth;

  // ── Step 3: Place reception at front ──
  const receptionDepth = reception
    ? Math.max(10, snapToHalfFoot(reception.area_programmed / effectiveWidth))
    : 0;

  // ── Step 4: Sort rooms by zone and group by side ──
  const zoneOrder: Zone[] = ['public', 'clinical', 'support', 'staff', 'service'];
  const sortedRooms = [...layoutRooms].sort((a, b) => {
    const za = zoneOrder.indexOf(a.zone);
    const zb = zoneOrder.indexOf(b.zone);
    if (za !== zb) return za - zb;
    return b.area_programmed - a.area_programmed;
  });

  // Enforce required adjacencies: rooms that must be adjacent go on the same side, consecutive
  const requiredAdj = adjacencies.filter(a => a.priority === 'required');
  const avoidAdj = adjacencies.filter(a => a.priority === 'avoid');

  // Build adjacency groups (connected components of required adjacencies)
  const adjGroups: string[][] = [];
  for (const adj of requiredAdj) {
    const groupA = adjGroups.find(g => g.includes(adj.room_a.toLowerCase()));
    const groupB = adjGroups.find(g => g.includes(adj.room_b.toLowerCase()));
    if (groupA && groupB && groupA !== groupB) {
      groupA.push(...groupB);
      adjGroups.splice(adjGroups.indexOf(groupB), 1);
    } else if (groupA) {
      if (!groupA.includes(adj.room_b.toLowerCase())) groupA.push(adj.room_b.toLowerCase());
    } else if (groupB) {
      if (!groupB.includes(adj.room_a.toLowerCase())) groupB.push(adj.room_a.toLowerCase());
    } else {
      adjGroups.push([adj.room_a.toLowerCase(), adj.room_b.toLowerCase()]);
    }
  }

  // Assign sides: left = public/support, right = clinical, back rooms spread
  const leftRooms: LayoutRoom[] = [];
  const rightRooms: LayoutRoom[] = [];
  const fullWidthRooms: LayoutRoom[] = [];
  const assigned = new Set<string>();

  // First pass: assign adjacency groups
  for (const group of adjGroups) {
    const groupRooms = sortedRooms.filter(r => group.includes(r.room_name.toLowerCase()));
    const totalGroupArea = groupRooms.reduce((s, r) => s + r.area_programmed, 0);
    const leftArea = leftRooms.reduce((s, r) => s + r.area_programmed, 0);
    const rightArea = rightRooms.reduce((s, r) => s + r.area_programmed, 0);

    // Assign group to less-loaded side (or right if single-loaded)
    const target = singleLoaded ? rightRooms : (leftArea <= rightArea ? leftRooms : rightRooms);
    for (const r of groupRooms) {
      target.push(r);
      assigned.add(r.room_number);
    }
  }

  // Second pass: assign remaining rooms
  for (const room of sortedRooms) {
    if (assigned.has(room.room_number)) continue;

    // Check for oversized rooms → full width
    const maxStripDepth = 40;
    const roomDepthIfStrip = room.area_programmed / (singleLoaded ? rightStripWidth : stripWidth);
    if (roomDepthIfStrip > maxStripDepth && !singleLoaded) {
      fullWidthRooms.push(room);
      assigned.add(room.room_number);
      continue;
    }

    if (singleLoaded) {
      rightRooms.push(room);
    } else {
      // Balance sides: public/support left, clinical/staff right
      const leftArea = leftRooms.reduce((s, r) => s + r.area_programmed, 0);
      const rightArea = rightRooms.reduce((s, r) => s + r.area_programmed, 0);

      if (room.zone === 'clinical') {
        rightRooms.push(room);
      } else if (room.zone === 'public' || room.zone === 'support') {
        leftRooms.push(room);
      } else {
        // Balance
        if (leftArea <= rightArea) leftRooms.push(room);
        else rightRooms.push(room);
      }
    }
    assigned.add(room.room_number);
  }

  // ── Step 5: Pack strips ──
  const placedRooms: FloorPlanRoom[] = [];
  let corridorStartY = receptionDepth;

  // Place reception
  if (reception) {
    placedRooms.push({
      room_number: reception.room_number,
      room_name: reception.room_name,
      x: 0,
      y: 0,
      width: effectiveWidth,
      depth: receptionDepth,
      area_actual: Math.round(effectiveWidth * receptionDepth),
      area_programmed: reception.area_programmed,
      finish_code: reception.finish_code,
      zone: 'public',
      side: 'front',
    });
  }

  function packStrip(
    rooms: LayoutRoom[],
    stripX: number,
    sw: number,
    startY: number,
    side: 'left' | 'right',
  ): number {
    let curY = startY;
    for (const room of rooms) {
      let depth = room.area_programmed / sw;
      // Clamp aspect ratio
      if (depth / sw > MAX_ASPECT_RATIO) depth = sw * MAX_ASPECT_RATIO;
      if (sw / depth > MAX_ASPECT_RATIO) depth = sw / MAX_ASPECT_RATIO;
      depth = Math.max(depth, MIN_ROOM_DEPTH);
      depth = snapToHalfFoot(depth);

      placedRooms.push({
        room_number: room.room_number,
        room_name: room.room_name,
        x: stripX,
        y: curY,
        width: snapToHalfFoot(sw),
        depth,
        area_actual: Math.round(snapToHalfFoot(sw) * depth),
        area_programmed: room.area_programmed,
        finish_code: room.finish_code,
        zone: room.zone,
        side,
      });
      curY += depth;
    }
    return curY;
  }

  // Left strip
  const leftX = 0;
  let leftEndY = corridorStartY;
  if (!singleLoaded && leftRooms.length > 0) {
    leftEndY = packStrip(leftRooms, leftX, leftStripWidth, corridorStartY, 'left');
  }

  // Right strip
  const rightX = singleLoaded ? CORRIDOR_WIDTH : leftStripWidth + CORRIDOR_WIDTH;
  let rightEndY = corridorStartY;
  if (rightRooms.length > 0) {
    rightEndY = packStrip(rightRooms, rightX, rightStripWidth, corridorStartY, 'right');
  }

  // Full-width rooms at back
  let backY = Math.max(leftEndY, rightEndY);
  for (const room of fullWidthRooms) {
    let depth = room.area_programmed / effectiveWidth;
    depth = Math.max(depth, MIN_ROOM_DEPTH);
    depth = snapToHalfFoot(depth);

    placedRooms.push({
      room_number: room.room_number,
      room_name: room.room_name,
      x: 0,
      y: backY,
      width: effectiveWidth,
      depth,
      area_actual: Math.round(effectiveWidth * depth),
      area_programmed: room.area_programmed,
      finish_code: room.finish_code,
      zone: room.zone,
      side: 'full_width',
    });
    backY += depth;
  }

  const buildingDepth = Math.max(backY, corridorStartY + 10); // min building depth
  const corridorX = singleLoaded ? 0 : leftStripWidth;
  const corridorDepth = buildingDepth - corridorStartY;

  // ── Step 6: Generate wall segments ──
  const walls: WallSegment[] = [];
  let wallId = 0;

  function addWall(
    x1: number, y1: number, x2: number, y2: number,
    type: string, thickness: number,
  ) {
    walls.push({
      id: `W${++wallId}`,
      x1, y1, x2, y2,
      wall_type: type,
      thickness_inches: thickness,
    });
  }

  // Exterior walls (W1, 6")
  addWall(0, 0, effectiveWidth, 0, 'W1', 6);                           // top
  addWall(0, buildingDepth, effectiveWidth, buildingDepth, 'W1', 6);    // bottom
  addWall(0, 0, 0, buildingDepth, 'W1', 6);                            // left
  addWall(effectiveWidth, 0, effectiveWidth, buildingDepth, 'W1', 6);   // right

  // Corridor walls (P2, 4.6")
  if (!singleLoaded) {
    addWall(corridorX, corridorStartY, corridorX, buildingDepth, 'P2', 4.6);
  }
  addWall(corridorX + CORRIDOR_WIDTH, corridorStartY, corridorX + CORRIDOR_WIDTH, buildingDepth, 'P2', 4.6);

  // Reception back wall
  if (reception) {
    addWall(0, receptionDepth, effectiveWidth, receptionDepth, 'P2', 4.6);
  }

  // Room partition walls
  for (const room of placedRooms) {
    if (room.side === 'front') continue; // reception walls already handled

    const roomObj = room as FloorPlanRoom;
    // Bottom wall of each room (horizontal partition between stacked rooms)
    const bottomY = room.y + room.depth;
    if (bottomY < buildingDepth - 0.1) {
      const neighbor = placedRooms.find(r =>
        r !== room &&
        r.side === room.side &&
        Math.abs(r.y - bottomY) < 0.5
      );
      const wallInfo = getWallTypeForPartition(roomObj, neighbor ?? null);
      if (room.side === 'left') {
        addWall(room.x, bottomY, room.x + room.width, bottomY, wallInfo.type, wallInfo.thickness);
      } else if (room.side === 'right') {
        addWall(room.x, bottomY, room.x + room.width, bottomY, wallInfo.type, wallInfo.thickness);
      } else {
        addWall(0, bottomY, effectiveWidth, bottomY, wallInfo.type, wallInfo.thickness);
      }
    }
  }

  // ── Step 7: Place doors ──
  const doors: DoorPlacement[] = [];

  // Main entry — centered on reception front wall
  const mainDoorEntry = doorSchedule.find(d => d.location === 'Main Entry');
  if (mainDoorEntry && reception) {
    doors.push({
      mark: mainDoorEntry.mark,
      room_name: 'Main Entry',
      x: effectiveWidth / 2,
      y: 0,
      width_ft: mainDoorEntry.width_mm / 304.8,
      orientation: 'horizontal',
      swing: 'in',
      swing_direction: 'right',
    });
  }

  // Room doors — on corridor-facing wall
  for (const room of placedRooms) {
    if (room.side === 'front') continue; // reception has main entry

    const lr = layoutRooms.find(r => r.room_number === room.room_number);
    const origRoom = roomSchedule.find(r => r.room_number === room.room_number);
    if (!lr && !origRoom) continue;

    const doorEntry = doorSchedule.find(d =>
      d.location.toLowerCase() === room.room_name.toLowerCase()
    );
    if (!doorEntry) continue;

    const doorW = doorEntry.width_mm / 304.8;
    const isWashroom = room.room_name.toLowerCase().includes('washroom');

    if (room.side === 'left') {
      // Door on right edge (corridor side), centered vertically
      doors.push({
        mark: doorEntry.mark,
        room_name: room.room_name,
        x: room.x + room.width,
        y: room.y + room.depth / 2,
        width_ft: doorW,
        orientation: 'vertical',
        swing: isWashroom ? 'in' : 'out',
        swing_direction: 'right',
      });
    } else if (room.side === 'right') {
      // Door on left edge (corridor side), centered vertically
      doors.push({
        mark: doorEntry.mark,
        room_name: room.room_name,
        x: room.x,
        y: room.y + room.depth / 2,
        width_ft: doorW,
        orientation: 'vertical',
        swing: isWashroom ? 'in' : 'out',
        swing_direction: 'left',
      });
    } else if (room.side === 'full_width') {
      // Door on corridor side (top of room)
      doors.push({
        mark: doorEntry.mark,
        room_name: room.room_name,
        x: room.x + room.width / 2,
        y: room.y,
        width_ft: doorW,
        orientation: 'horizontal',
        swing: isWashroom ? 'in' : 'out',
        swing_direction: 'right',
      });
    }
  }

  // ── Step 8: Dimension annotations ──
  const dimensions: DimensionAnnotation[] = [];

  // Overall building dimensions
  dimensions.push({
    label: feetToArchString(effectiveWidth),
    x1: 0, y1: -2, x2: effectiveWidth, y2: -2,
    offset: 3,
    type: 'overall',
  });
  dimensions.push({
    label: feetToArchString(buildingDepth),
    x1: -2, y1: 0, x2: -2, y2: buildingDepth,
    offset: 3,
    type: 'overall',
  });

  // Corridor width
  dimensions.push({
    label: feetToArchString(CORRIDOR_WIDTH),
    x1: corridorX, y1: corridorStartY - 1,
    x2: corridorX + CORRIDOR_WIDTH, y2: corridorStartY - 1,
    offset: 1.5,
    type: 'corridor',
  });

  // Room dimensions (width × depth for each room)
  for (const room of placedRooms) {
    // Width
    dimensions.push({
      label: feetToArchString(room.width),
      x1: room.x, y1: room.y + room.depth,
      x2: room.x + room.width, y2: room.y + room.depth,
      offset: 1,
      type: 'room',
    });
    // Depth
    dimensions.push({
      label: feetToArchString(room.depth),
      x1: room.x + room.width, y1: room.y,
      x2: room.x + room.width, y2: room.y + room.depth,
      offset: 1,
      type: 'room',
    });
  }

  return {
    envelope: {
      width: effectiveWidth,
      depth: buildingDepth,
      total_area: Math.round(effectiveWidth * buildingDepth),
    },
    corridor: {
      x: corridorX,
      y: corridorStartY,
      width: CORRIDOR_WIDTH,
      depth: corridorDepth,
    },
    rooms: placedRooms,
    walls,
    doors,
    dimensions,
  };
}
