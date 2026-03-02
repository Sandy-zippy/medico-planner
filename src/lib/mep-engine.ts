/**
 * MEP (Mechanical, Electrical, Plumbing) Layout Engine
 * Generates overlay data for electrical, plumbing, and HVAC plans.
 */

import type {
  FloorPlanGeometry, FloorPlanRoom, MEPLayout, MEPSymbol, MEPRun,
  EquipmentItem,
} from '@/types';

// ── Helpers ──────────────────────────────────────────────

function isWetRoom(name: string): boolean {
  const lower = name.toLowerCase();
  return ['sterilization', 'washroom', 'lab', 'hydrotherapy', 'compounding', 'kennel'].some(k => lower.includes(k));
}

function roomPerimeter(room: FloorPlanRoom): { x: number; y: number }[] {
  // Returns points along the room perimeter at regular intervals
  const points: { x: number; y: number }[] = [];
  const spacing = 12; // feet between outlets
  // Bottom wall
  for (let px = room.x + 3; px < room.x + room.width - 1; px += spacing) {
    points.push({ x: px, y: room.y + room.depth - 0.5 });
  }
  // Right wall
  for (let py = room.y + 3; py < room.y + room.depth - 1; py += spacing) {
    points.push({ x: room.x + room.width - 0.5, y: py });
  }
  // Top wall
  for (let px = room.x + room.width - 3; px > room.x + 1; px -= spacing) {
    points.push({ x: px, y: room.y + 0.5 });
  }
  // Left wall
  for (let py = room.y + room.depth - 3; py > room.y + 1; py -= spacing) {
    points.push({ x: room.x + 0.5, y: py });
  }
  return points;
}

// ── Electrical Plan ─────────────────────────────────────

export function generateElectricalPlan(
  floorPlan: FloorPlanGeometry,
  equipmentSchedule: EquipmentItem[],
): MEPLayout {
  const symbols: MEPSymbol[] = [];
  const runs: MEPRun[] = [];

  // Find service/utility room for panel
  const serviceRoom = floorPlan.rooms.find(r =>
    r.room_name.toLowerCase().includes('storage') ||
    r.room_name.toLowerCase().includes('mechanical')
  ) ?? floorPlan.rooms[floorPlan.rooms.length - 1];

  const panelLocation = {
    x: serviceRoom.x + 1,
    y: serviceRoom.y + serviceRoom.depth / 2,
  };

  symbols.push({ x: panelLocation.x, y: panelLocation.y, type: 'panel', label: 'EP' });

  for (const room of floorPlan.rooms) {
    const isWet = isWetRoom(room.room_name);
    const perimeterPoints = roomPerimeter(room);

    // Duplex outlets every 12ft along perimeter (code minimum)
    for (const pt of perimeterPoints) {
      symbols.push({
        x: pt.x, y: pt.y,
        type: isWet ? 'gfci' : 'duplex_outlet',
        label: isWet ? 'GFCI' : undefined,
      });
    }

    // At least one outlet per room
    if (perimeterPoints.length === 0) {
      symbols.push({
        x: room.x + room.width / 2, y: room.y + room.depth - 0.5,
        type: isWet ? 'gfci' : 'duplex_outlet',
      });
    }

    // Light switch near door (use room center-left as approximation)
    symbols.push({
      x: room.x + 1.5, y: room.y + room.depth / 2,
      type: 'switch',
    });

    // Dedicated circuits for equipment
    const roomEquip = equipmentSchedule.filter(eq =>
      eq.room.toLowerCase() === room.room_name.toLowerCase() ||
      room.room_name.toLowerCase().includes(eq.room.toLowerCase().split(' ')[0])
    );

    for (const eq of roomEquip) {
      if (eq.dedicated_circuit) {
        const dcSymbol: MEPSymbol = {
          x: room.x + room.width / 2 + (Math.random() - 0.5) * 2,
          y: room.y + room.depth / 2 + (Math.random() - 0.5) * 2,
          type: 'dedicated_circuit',
          label: eq.id,
        };
        symbols.push(dcSymbol);

        // Circuit run from panel to dedicated outlet
        runs.push({
          points: [panelLocation, { x: dcSymbol.x, y: dcSymbol.y }],
          type: 'circuit',
        });
      }
    }
  }

  return {
    symbols,
    runs,
    panel_location: panelLocation,
    legend: [
      { symbol: 'duplex_outlet', description: 'Duplex receptacle (120V)' },
      { symbol: 'gfci', description: 'GFCI receptacle (wet areas)' },
      { symbol: 'switch', description: 'Light switch' },
      { symbol: 'dedicated_circuit', description: 'Dedicated circuit (20A/30A)' },
      { symbol: 'panel', description: 'Electrical panel' },
    ],
  };
}

// ── Plumbing Plan ───────────────────────────────────────

export function generatePlumbingPlan(
  floorPlan: FloorPlanGeometry,
  equipmentSchedule: EquipmentItem[],
): MEPLayout {
  const symbols: MEPSymbol[] = [];
  const runs: MEPRun[] = [];

  // Main water entry — typically at service side of building
  const mainEntry = { x: 0, y: floorPlan.envelope.depth / 2 };
  symbols.push({ x: mainEntry.x, y: mainEntry.y, type: 'water_main', label: 'WM' });

  for (const room of floorPlan.rooms) {
    const roomEquip = equipmentSchedule.filter(eq =>
      eq.room.toLowerCase() === room.room_name.toLowerCase() ||
      room.room_name.toLowerCase().includes(eq.room.toLowerCase().split(' ')[0])
    );

    const needsWater = roomEquip.some(eq => eq.hot_water || eq.cold_water);
    const needsDrain = roomEquip.some(eq => eq.drain);

    if (needsWater) {
      // Hot water supply point
      if (roomEquip.some(eq => eq.hot_water)) {
        symbols.push({
          x: room.x + room.width * 0.3, y: room.y + 1,
          type: 'hot_supply', label: 'HW',
        });
      }
      // Cold water supply point
      if (roomEquip.some(eq => eq.cold_water)) {
        symbols.push({
          x: room.x + room.width * 0.5, y: room.y + 1,
          type: 'cold_supply', label: 'CW',
        });
      }

      // Supply run from main to fixtures
      runs.push({
        points: [mainEntry, { x: room.x + room.width * 0.4, y: room.y + 1 }],
        type: roomEquip.some(eq => eq.hot_water) ? 'hot' : 'cold',
      });
    }

    if (needsDrain) {
      symbols.push({
        x: room.x + room.width * 0.7, y: room.y + 1,
        type: 'floor_drain', label: 'FD',
      });

      // Waste run to building edge
      runs.push({
        points: [
          { x: room.x + room.width * 0.7, y: room.y + 1 },
          { x: room.x + room.width * 0.7, y: floorPlan.envelope.depth },
        ],
        type: 'waste',
      });
    }

    // Gas connections
    const needsGas = roomEquip.some(eq => eq.gas);
    if (needsGas) {
      symbols.push({
        x: room.x + room.width * 0.9, y: room.y + room.depth / 2,
        type: 'gas_valve', label: 'GAS',
      });
    }
  }

  return {
    symbols,
    runs,
    legend: [
      { symbol: 'water_main', description: 'Water main entry' },
      { symbol: 'hot_supply', description: 'Hot water supply' },
      { symbol: 'cold_supply', description: 'Cold water supply' },
      { symbol: 'floor_drain', description: 'Floor drain' },
      { symbol: 'gas_valve', description: 'Gas shut-off valve' },
    ],
  };
}

// ── HVAC Plan ───────────────────────────────────────────

export function generateHVACPlan(
  floorPlan: FloorPlanGeometry,
  rooms: { room_name: string; area_sqft: number }[],
): MEPLayout {
  const symbols: MEPSymbol[] = [];
  const runs: MEPRun[] = [];

  // AHU location — typically in service room or roof
  const corridorCenterX = floorPlan.corridor.x + floorPlan.corridor.width / 2;

  for (const fpRoom of floorPlan.rooms) {
    const roomData = rooms.find(r =>
      r.room_name.toLowerCase() === fpRoom.room_name.toLowerCase()
    );
    const area = roomData?.area_sqft ?? fpRoom.area_actual;

    // Supply diffusers: 1 per 150 SF
    const diffuserCount = Math.max(1, Math.round(area / 150));
    for (let i = 0; i < diffuserCount; i++) {
      const dx = fpRoom.x + ((i + 0.5) / diffuserCount) * fpRoom.width;
      const dy = fpRoom.y + fpRoom.depth * 0.4;
      symbols.push({ x: dx, y: dy, type: 'supply_diffuser', label: 'SD' });

      // Duct run from corridor to diffuser
      runs.push({
        points: [
          { x: corridorCenterX, y: dy },
          { x: dx, y: dy },
        ],
        type: 'duct',
      });
    }

    // Return air grilles: 1 per 200 SF
    const returnCount = Math.max(1, Math.round(area / 200));
    for (let i = 0; i < returnCount; i++) {
      symbols.push({
        x: fpRoom.x + ((i + 0.5) / returnCount) * fpRoom.width,
        y: fpRoom.y + fpRoom.depth * 0.7,
        type: 'return_grille',
        label: 'RA',
      });
    }

    // Thermostat: 1 per room
    symbols.push({
      x: fpRoom.x + 1.5,
      y: fpRoom.y + fpRoom.depth * 0.5,
      type: 'thermostat',
      label: 'T',
    });
  }

  // Main duct trunk along corridor
  runs.push({
    points: [
      { x: corridorCenterX, y: floorPlan.corridor.y },
      { x: corridorCenterX, y: floorPlan.corridor.y + floorPlan.corridor.depth },
    ],
    type: 'duct',
  });

  // For L-corridor, add horizontal duct trunk
  if (floorPlan.corridor_segments && floorPlan.corridor_segments.length > 1) {
    const seg2 = floorPlan.corridor_segments[1];
    const seg2CenterY = seg2.y + seg2.depth / 2;
    runs.push({
      points: [
        { x: seg2.x, y: seg2CenterY },
        { x: seg2.x + seg2.width, y: seg2CenterY },
      ],
      type: 'duct',
    });
  }

  return {
    symbols,
    runs,
    legend: [
      { symbol: 'supply_diffuser', description: 'Supply air diffuser' },
      { symbol: 'return_grille', description: 'Return air grille' },
      { symbol: 'thermostat', description: 'Thermostat' },
    ],
  };
}
