/**
 * Layout editor — update a single room's properties in OutputJSON
 * without full floor plan re-layout.
 */

import type { OutputJSON, FloorPlanRoom } from '@/types';

export interface RoomPatch {
  roomNumber: string;
  roomName?: string;
  width?: number;
  depth?: number;
  finishCode?: string;
}

/**
 * Apply a room patch to a deep-cloned OutputJSON.
 * Updates floor_plan rooms, room_schedule, and finish_schedule entries.
 */
export function applyRoomPatch(output: OutputJSON, patch: RoomPatch): OutputJSON {
  const result: OutputJSON = JSON.parse(JSON.stringify(output));

  // Find the room in floor plan
  const fpRoom = result.floor_plan?.rooms.find(r => r.room_number === patch.roomNumber);
  if (!fpRoom) return result;

  const oldName = fpRoom.room_name;

  // Apply name change
  if (patch.roomName !== undefined) {
    fpRoom.room_name = patch.roomName;
  }

  // Apply dimension changes
  if (patch.width !== undefined || patch.depth !== undefined) {
    const newW = patch.width ?? fpRoom.width;
    const newH = patch.depth ?? fpRoom.depth;
    fpRoom.width = newW;
    fpRoom.depth = newH;
    fpRoom.area_actual = Math.round(newW * newH);
    fpRoom.area_programmed = Math.round(newW * newH);
  }

  // Apply finish code
  if (patch.finishCode !== undefined) {
    fpRoom.finish_code = patch.finishCode;
  }

  // Sync room_schedule
  const schedEntry = result.room_schedule?.find(r => r.room_number === patch.roomNumber);
  if (schedEntry) {
    if (patch.roomName !== undefined) schedEntry.room_name = patch.roomName;
    if (patch.width !== undefined || patch.depth !== undefined) {
      const area = fpRoom.width * fpRoom.depth;
      schedEntry.area_sqft = Math.round(area);
      schedEntry.area_m2 = Math.round(area * 0.093);
      schedEntry.total_sqft = Math.round(area * schedEntry.quantity);
      schedEntry.total_m2 = Math.round(area * schedEntry.quantity * 0.093);
    }
    if (patch.finishCode !== undefined) schedEntry.finish_code = patch.finishCode;
  }

  // Sync finish_schedule
  if (result.finish_schedule) {
    const finishEntry = result.finish_schedule.find(
      f => f.room_name.toLowerCase() === oldName.toLowerCase()
    );
    if (finishEntry) {
      if (patch.roomName !== undefined) finishEntry.room_name = patch.roomName;
      if (patch.finishCode !== undefined) finishEntry.finish_code = patch.finishCode;
    }
  }

  return result;
}

/**
 * Reorder rooms in the floor plan by swapping positions.
 * Takes the current output and a new order of room numbers.
 */
export function reorderRooms(output: OutputJSON, newOrder: string[]): OutputJSON {
  const result: OutputJSON = JSON.parse(JSON.stringify(output));
  if (!result.floor_plan) return result;

  const rooms = result.floor_plan.rooms;

  // Capture current positions
  const positions = rooms.map(r => ({
    x: r.x, y: r.y, width: r.width, depth: r.depth, side: r.side,
  }));

  // Build index map: room_number → current index
  const currentOrder = rooms.map(r => r.room_number);

  // Map new order to existing rooms
  const reordered: FloorPlanRoom[] = newOrder
    .map(num => rooms.find(r => r.room_number === num))
    .filter((r): r is FloorPlanRoom => !!r);

  // Assign original positions to reordered rooms
  for (let i = 0; i < reordered.length && i < positions.length; i++) {
    reordered[i].x = positions[i].x;
    reordered[i].y = positions[i].y;
    // Keep each room's own dimensions — don't swap sizes
    reordered[i].side = positions[i].side;
  }

  result.floor_plan.rooms = reordered;

  // Reorder room_schedule to match
  if (result.room_schedule) {
    const schedMap = new Map(result.room_schedule.map(r => [r.room_number, r]));
    result.room_schedule = newOrder
      .map(num => schedMap.get(num))
      .filter((r): r is NonNullable<typeof r> => !!r);
  }

  return result;
}
