import type {
  OutputJSON, RoomProgramEntry, Adjacency, ComplianceItem, RiskItem,
  CodeAnalysis, ProjectSummary, RoomScheduleEntry, DetailedCodeAnalysis,
  EquipmentItem, DoorScheduleEntry, PlumbingFixture, DrawingListEntry,
  FinishScheduleEntry, WallType, CoverSheet, CeilingPlan,
} from '@/types';
import {
  calculateOccupancy, getProvinceCode, getClinicLabel, getClinicGroup,
  getFireCodeRequirements, OCCUPANCY_DESCRIPTIONS, getConstructionType,
} from './constants';
import { generateFloorPlanLayout } from './floor-plan-engine';
import { generateScene3D } from './scene-3d-engine';
import { getDefaultRooms } from './room-templates';
import { getEquipmentForClinicType } from './data/equipment-database';
import { getFinishSchedule } from './data/finish-specs';
import { getWallTypesForClinic } from './data/wall-types';
import { getDrawingList } from './data/drawing-templates';
import { generateElectricalPlan, generatePlumbingPlan, generateHVACPlan } from './mep-engine';
import type { RoomConfig } from '@/types';

const ADJACENCY_RULES: Record<string, Adjacency[]> = {
  dental: [
    { room_a: 'Reception / Waiting', room_b: 'Operatory', priority: 'preferred', reason: 'Patient flow from check-in to treatment' },
    { room_a: 'Operatory', room_b: 'Sterilization', priority: 'required', reason: 'Instrument processing must be adjacent to operatories' },
    { room_a: 'Operatory', room_b: 'X-Ray / Pano Room', priority: 'preferred', reason: 'Minimize patient movement for diagnostics' },
    { room_a: 'Staff Room', room_b: 'Reception / Waiting', priority: 'avoid', reason: 'Staff break area should be private from patients' },
  ],
  optometry: [
    { room_a: 'Reception / Waiting', room_b: 'Pre-Test Room', priority: 'required', reason: 'Direct patient flow to pre-testing' },
    { room_a: 'Pre-Test Room', room_b: 'Exam Room', priority: 'required', reason: 'Sequential diagnostic workflow' },
    { room_a: 'Exam Room', room_b: 'Optical Dispensary', priority: 'preferred', reason: 'Post-exam lens selection convenience' },
    { room_a: 'Staff Room', room_b: 'Optical Dispensary', priority: 'avoid', reason: 'Separate staff and retail zones' },
  ],
  veterinary: [
    { room_a: 'Reception / Waiting', room_b: 'Exam Room', priority: 'required', reason: 'Minimize animal stress during transition' },
    { room_a: 'Exam Room', room_b: 'Treatment Area', priority: 'required', reason: 'Quick transfer for procedures' },
    { room_a: 'Treatment Area', room_b: 'Surgery Suite', priority: 'required', reason: 'Sterile corridor connection needed' },
    { room_a: 'Kennel / Recovery', room_b: 'Reception / Waiting', priority: 'avoid', reason: 'Noise separation from client areas' },
    { room_a: 'X-Ray Room', room_b: 'Treatment Area', priority: 'preferred', reason: 'Diagnostic imaging workflow' },
  ],
  physiotherapy: [
    { room_a: 'Reception / Waiting', room_b: 'Treatment Bay', priority: 'preferred', reason: 'Direct patient access to treatment' },
    { room_a: 'Treatment Bay', room_b: 'Open Gym / Exercise Area', priority: 'required', reason: 'Progressive treatment workflow' },
    { room_a: 'Hydrotherapy Room', room_b: 'Accessible Washroom', priority: 'required', reason: 'Change/shower access for wet therapy' },
  ],
};

function getAdjacencies(clinicType: string, rooms: RoomConfig[]): Adjacency[] {
  const specific = ADJACENCY_RULES[clinicType] ?? [];
  const roomNames = rooms.map(r => r.name);
  const filtered = specific.filter(a => roomNames.includes(a.room_a) && roomNames.includes(a.room_b));
  if (roomNames.includes('Accessible Washroom')) {
    filtered.push({
      room_a: 'Accessible Washroom', room_b: 'Reception / Waiting',
      priority: 'preferred', reason: 'Public washroom access from waiting area'
    });
  }
  return filtered;
}

function getComplianceChecklist(province: string, clinicType: string, occupancy: number): ComplianceItem[] {
  const code = getProvinceCode(province);
  const group = getClinicGroup(clinicType);
  const items: ComplianceItem[] = [
    {
      category: 'Occupancy Classification',
      requirement: `Building classified as Group ${group} per ${code}`,
      code_reference: `${code} §3.1.2`,
      status: 'met',
    },
    {
      category: 'Barrier-Free Access',
      requirement: 'Barrier-free path of travel from entrance to all public areas',
      code_reference: `${code} §3.8.1`,
      status: 'review',
    },
    {
      category: 'Washroom Accessibility',
      requirement: 'At least one barrier-free washroom with 60" turning radius',
      code_reference: `${code} §3.8.3.12`,
      status: 'met',
    },
    {
      category: 'Corridor Width',
      requirement: 'Minimum 44" (1100mm) corridor width for public corridors',
      code_reference: `${code} §3.3.1.9`,
      status: 'met',
    },
    {
      category: 'Exit Requirements',
      requirement: `${occupancy > 60 ? 'Two exits required' : 'Single exit permitted'} for occupant load of ${occupancy}`,
      code_reference: `${code} §3.4.2`,
      status: occupancy > 60 ? 'review' : 'met',
    },
    {
      category: 'Fire Separation',
      requirement: 'Suite separation: 1-hour fire-rated construction to corridor',
      code_reference: `${code} §3.3.4`,
      status: 'review',
    },
    {
      category: 'Sprinkler System',
      requirement: occupancy > 150 ? 'Sprinkler system required per building area' : 'Sprinkler status to be confirmed with base building',
      code_reference: `${code} §3.2.5`,
      status: 'review',
    },
    {
      category: 'Ventilation',
      requirement: 'Mechanical ventilation per ASHRAE 62.1 for healthcare occupancy',
      code_reference: `${code} §6.2.2 / ASHRAE 62.1`,
      status: 'review',
    },
  ];

  if (province === 'ON') {
    items.push({
      category: 'AODA Compliance',
      requirement: 'Ontario Accessibility for Ontarians with Disabilities Act compliance required',
      code_reference: 'AODA O.Reg 191/11',
      status: 'review',
    });
  }
  if (province === 'BC') {
    items.push({
      category: 'Energy Code',
      requirement: 'BC Energy Step Code compliance (Step 3 minimum for new commercial)',
      code_reference: 'BCBC 2024 §10.2',
      status: 'review',
    });
  }

  if (clinicType === 'dental' || clinicType === 'veterinary') {
    items.push({
      category: 'X-Ray Shielding',
      requirement: 'Lead-lined walls for radiography rooms per Health Canada Safety Code 30',
      code_reference: 'Health Canada SC 30',
      status: 'action_required',
    });
  }

  return items;
}

function getRisks(clinicType: string, areaSqft: number, rooms: RoomConfig[]): RiskItem[] {
  const totalRoomArea = rooms.reduce((sum, r) => sum + (r.area_sqft ?? 0) * r.quantity, 0);
  const circulationPercent = ((areaSqft - totalRoomArea) / areaSqft) * 100;
  const risks: RiskItem[] = [];

  if (circulationPercent < 15) {
    risks.push({
      severity: 'high',
      description: `Circulation space is only ${circulationPercent.toFixed(0)}% of total area (minimum 20% recommended)`,
      mitigation: 'Consider reducing room sizes or removing lower-priority spaces to meet circulation requirements',
    });
  } else if (circulationPercent < 25) {
    risks.push({
      severity: 'medium',
      description: `Circulation space is ${circulationPercent.toFixed(0)}% of total area (25-30% typical for healthcare)`,
      mitigation: 'Program fits but corridors may be tight. Review during schematic design for optimization.',
    });
  }

  if (totalRoomArea > areaSqft) {
    risks.push({
      severity: 'high',
      description: `Room program totals ${totalRoomArea} SF but available area is only ${areaSqft} SF (${(totalRoomArea - areaSqft)} SF over)`,
      mitigation: 'Reduce room count or areas. Consider multi-use spaces or phased buildout.',
    });
  }

  if (clinicType === 'veterinary') {
    risks.push({
      severity: 'medium',
      description: 'Veterinary clinics require enhanced HVAC for odor control and animal comfort',
      mitigation: 'Budget for dedicated exhaust systems in kennel and treatment areas. Verify base building capacity.',
    });
  }

  if (clinicType === 'dental') {
    risks.push({
      severity: 'low',
      description: 'Dental operatories require dedicated plumbing and compressed air infrastructure',
      mitigation: 'Verify base building plumbing capacity early. Plan chase walls for dental services.',
    });
  }

  risks.push({
    severity: 'low',
    description: 'Existing conditions may differ from provided plans — field verification required',
    mitigation: 'Schedule site survey before advancing to design development phase',
  });

  return risks;
}

function getNextSteps(): string[] {
  return [
    'Review room program and provide feedback on space priorities',
    'Schedule site survey to verify existing conditions',
    'Confirm mechanical/electrical capacity with base building landlord',
    'Review compliance items flagged for action or review',
    'Approve concept package to advance to Schematic Design phase',
    'Discuss phasing strategy if program exceeds available area',
  ];
}

function getRoomNote(roomName: string, clinicType: string): string {
  const notes: Record<string, string> = {
    'Reception / Waiting': 'Include accessible seating and clear sightlines to entry',
    'Operatory': 'Minimum 10\' x 12\', dental chair with rear delivery preferred',
    'Sterilization': 'Dirty-to-clean workflow, separate entry/exit points',
    'X-Ray / Pano Room': 'Lead-lined walls, door with radiation warning signage',
    'Exam Room': clinicType === 'veterinary' ? 'Non-slip flooring, exam table with scale' : 'Standard exam room with sink and exam table',
    'Surgery Suite': 'Positive pressure, scrub station at entry, non-porous finishes',
    'Treatment Area': 'Open plan with wet/dry zones, overhead lighting tracks',
    'Kennel / Recovery': 'Sound isolation, drainage, ventilation exhaust to exterior',
    'Optical Dispensary': 'Display cases, mirrors, seating. Premium retail finish.',
    'Pre-Test Room': 'Auto-refractor, lensometer, visual field equipment',
    'Open Gym / Exercise Area': 'Rubber flooring, mirrors, ceiling height min 10\'',
    'Hydrotherapy Room': 'Waterproof finishes, floor drain, humidity control',
    'Compounding Room': 'Clean room standards, laminar flow hood space',
    'Accessible Washroom': '60" turning radius, grab bars, accessible fixtures',
  };
  return notes[roomName] ?? '';
}

// ─── New generator functions ───────────────────────────────

export function generateRoomSchedule(rooms: RoomConfig[], clinicType: string): RoomScheduleEntry[] {
  const equipmentDb = getEquipmentForClinicType(clinicType);
  let roomCounter = 100;

  return rooms.flatMap(r => {
    const entries: RoomScheduleEntry[] = [];
    for (let i = 0; i < r.quantity; i++) {
      roomCounter++;
      const area = r.area_sqft ?? 100;
      const areaM2 = Math.round(area * 0.092903 * 10) / 10;
      const equipRefs = equipmentDb
        .filter(eq => eq.room === r.name)
        .map(eq => eq.id);
      const finishCode = getFinishCodeForRoom(r.name, clinicType);

      entries.push({
        room_number: String(roomCounter),
        room_name: r.quantity > 1 ? `${r.name} ${i + 1}` : r.name,
        quantity: 1,
        area_sqft: area,
        area_m2: areaM2,
        total_sqft: area,
        total_m2: areaM2,
        finish_code: finishCode,
        equipment_refs: equipRefs,
        notes: getRoomNote(r.name, clinicType),
      });
    }
    return entries;
  });
}

export function getFinishCodeForRoom(roomName: string, clinicType: string): string {
  const map: Record<string, Record<string, string>> = {
    dental: { 'Reception / Waiting': 'F1', 'Operatory': 'F2', 'Sterilization': 'F3', 'X-Ray / Pano Room': 'F2', "Doctor's Office": 'F6', 'Staff Room': 'F5', 'Accessible Washroom': 'F4', 'Storage / Mechanical': 'F7' },
    optometry: { 'Reception / Waiting': 'F1', 'Pre-Test Room': 'F2', 'Exam Room': 'F2', 'Optical Dispensary': 'F1', 'Contact Lens Room': 'F2', "Doctor's Office": 'F6', 'Staff Room': 'F5', 'Accessible Washroom': 'F4', 'Storage': 'F7' },
    veterinary: { 'Reception / Waiting': 'F1', 'Exam Room': 'F3', 'Surgery Suite': 'F3', 'Treatment Area': 'F3', 'Kennel / Recovery': 'F7', 'Lab / Pharmacy': 'F2', 'X-Ray Room': 'F2', "Doctor's Office": 'F6', 'Staff Room': 'F5', 'Accessible Washroom': 'F4', 'Storage / Mechanical': 'F7' },
    physiotherapy: { 'Reception / Waiting': 'F1', 'Treatment Bay': 'F2', 'Open Gym / Exercise Area': 'F5', 'Private Treatment Room': 'F2', 'Hydrotherapy Room': 'F4', 'Staff Office': 'F6', 'Accessible Washroom': 'F4', 'Storage': 'F7' },
    medical_office: { 'Reception / Waiting': 'F1', 'Exam Room': 'F2', 'Nurse Station': 'F2', "Doctor's Office": 'F6', 'Lab / Blood Draw': 'F3', 'Staff Room': 'F5', 'Accessible Washroom': 'F4', 'Medical Records / Storage': 'F7' },
    pharmacy: { 'Retail / Dispensary Floor': 'F1', 'Prescription Counter': 'F2', 'Compounding Room': 'F3', 'Consultation Room': 'F8', 'Cold Storage': 'F7', 'Office': 'F6', 'Staff Area': 'F5', 'Accessible Washroom': 'F4', 'Storage / Receiving': 'F7' },
  };
  return map[clinicType]?.[roomName] ?? 'F1';
}

export function generateDetailedCodeAnalysis(config: {
  province: string;
  city: string;
  clinic_type: string;
  area_sqft: number;
  existing_space: boolean;
  address: string;
  occupancyLoad: number;
  requiredExits: number;
  requiredWashrooms: number;
  areaM2: number;
}): DetailedCodeAnalysis {
  const code = getProvinceCode(config.province);
  const group = getClinicGroup(config.clinic_type);
  const groupDesc = OCCUPANCY_DESCRIPTIONS[group] ?? 'Business and Personal Services';
  const fire = getFireCodeRequirements(config.province);
  const sprinklered = config.occupancyLoad > 150 || config.area_sqft > 5000;
  const constructionType = getConstructionType(config.area_sqft, sprinklered);
  const factor = group === 'E' ? 3.7 : group === 'A2' ? 2.8 : 9.3;
  const maleCount = Math.ceil(config.occupancyLoad * 0.5);
  const femaleCount = config.occupancyLoad - maleCount;

  return {
    project_info: {
      address: config.address || `${config.city}, ${config.province}`,
      permit_type: config.existing_space ? 'Tenant Improvement (Interior Alteration)' : 'New Construction — Commercial Interior',
      zoning: 'Commercial (C-2) — Verify with municipal zoning',
      applicable_code: code,
      clinic_type: getClinicLabel(config.clinic_type),
    },
    building_description: {
      gross_area_m2: Math.round(config.areaM2 * 10) / 10,
      gross_area_sqft: config.area_sqft,
      num_storeys: 1,
      construction_type: constructionType,
      existing_or_new: config.existing_space ? 'Existing space — tenant improvement' : 'New construction',
    },
    occupancy: {
      classification: `Group ${group}`,
      nbc_section: `${code} §3.1.2.1`,
      description: groupDesc,
    },
    fire_ratings: {
      floor_assembly: fire.floor_assembly_rating,
      roof_assembly: fire.roof_assembly_rating,
      load_bearing: '1 hr (if supporting fire-rated assembly)',
      exit_corridor: fire.exit_corridor_rating,
      suite_separation: fire.suite_separation_rating,
    },
    spatial_separation: {
      north: 'As per base building — verify existing fire rating',
      south: 'As per base building — verify existing fire rating',
      east: 'As per base building — verify existing fire rating',
      west: 'As per base building — verify existing fire rating',
    },
    occupant_load: {
      area_m2: Math.round(config.areaM2 * 10) / 10,
      factor_m2_per_person: factor,
      occupant_count: config.occupancyLoad,
      male_count: maleCount,
      female_count: femaleCount,
    },
    washroom_calc: {
      male_required: Math.ceil(maleCount / 75),
      female_required: Math.ceil(femaleCount / 40),
      accessible_required: 1,
      male_provided: Math.max(1, Math.ceil(maleCount / 75)),
      female_provided: Math.max(1, Math.ceil(femaleCount / 40)),
      accessible_provided: 1,
    },
    exit_requirements: {
      min_exits: config.requiredExits,
      corridor_width_mm: fire.corridor_min_width_mm,
      max_travel_distance_m: fire.max_travel_distance_m,
      door_min_width_mm: fire.door_min_width_mm,
      headroom_mm: fire.headroom_mm,
    },
    accessibility: {
      barrier_free_entrance: true,
      barrier_free_path: true,
      power_door_operator: true,
      tactile_signage: true,
      accessible_washroom: true,
    },
    interior_finishes: {
      flame_spread_rating: 'Class A (FSR ≤ 25) for exits and corridors; Class B (FSR ≤ 75) for rooms',
      smoke_classification: 'SDI ≤ 50 for exits; SDI ≤ 100 for corridors; SDI ≤ 300 for rooms',
    },
    fire_protection: {
      alarm_type: config.area_sqft > 3000 ? 'Single-stage fire alarm system' : 'Smoke detectors per NBC — confirm with base building',
      sprinklers: sprinklered
        ? 'Required — NFPA 13 light hazard throughout'
        : 'Not required for suite area — verify base building sprinkler status',
      smoke_detectors: 'Photoelectric smoke detectors in all rooms, corridors, and ceiling spaces',
      standpipe: config.area_sqft > 10000 ? 'Class II standpipe — verify base building' : 'Not required at this scale — verify base building',
    },
  };
}

export function generateEquipmentSchedule(clinicType: string): EquipmentItem[] {
  return getEquipmentForClinicType(clinicType);
}

export function generateFinishSchedule(clinicType: string, rooms: RoomConfig[]): FinishScheduleEntry[] {
  // Deduplicate room names for finish schedule
  const uniqueRooms = rooms.reduce<{ name: string }[]>((acc, r) => {
    if (!acc.find(x => x.name === r.name)) acc.push({ name: r.name });
    return acc;
  }, []);
  return getFinishSchedule(clinicType, uniqueRooms);
}

export function generateWallTypes(clinicType: string): WallType[] {
  return getWallTypesForClinic(clinicType);
}

export function generateDoorSchedule(rooms: RoomConfig[], clinicType: string): DoorScheduleEntry[] {
  const doors: DoorScheduleEntry[] = [];
  let doorNum = 100;

  // Entry door
  doorNum++;
  doors.push({
    mark: `D${doorNum}`,
    location: 'Main Entry',
    width_mm: 915,
    height_mm: 2134,
    type: 'Aluminum storefront, glazed',
    fire_rating: 'Non-rated',
    hardware: 'Lever handle, closer, power operator',
    notes: 'Barrier-free. Auto operator with push plate.',
  });

  for (const room of rooms) {
    for (let i = 0; i < room.quantity; i++) {
      doorNum++;
      const isWashroom = room.name.toLowerCase().includes('washroom');
      const isXray = room.name.toLowerCase().includes('x-ray') || room.name.toLowerCase().includes('pano');
      const isSurgery = room.name.toLowerCase().includes('surgery');
      const isMech = room.name.toLowerCase().includes('mechanical') || room.name.toLowerCase().includes('storage');
      const isEntry = room.name.toLowerCase().includes('reception');

      let type = 'Solid core wood, paint grade';
      let fireRating = 'Non-rated';
      let hardware = 'Lever handle, closer';
      let width = 915;

      if (isWashroom) {
        width = 915;
        type = 'Solid core wood, paint grade';
        hardware = 'Privacy lever, closer, kick plate';
      } else if (isXray) {
        type = 'Lead-lined solid core, paint grade';
        fireRating = '20 min (to match partition)';
        hardware = 'Lever handle, closer, radiation warning sign';
      } else if (isSurgery) {
        type = 'Solid core FRP-faced';
        hardware = 'Lever handle, closer, kick plate, vision panel';
      } else if (isMech) {
        width = 864;
        type = 'Solid core wood, paint grade';
        hardware = 'Lever handle, keyed lock';
      } else if (isEntry) {
        continue; // Already added main entry
      }

      if (isWashroom) {
        fireRating = 'Non-rated';
      }

      doors.push({
        mark: `D${doorNum}`,
        location: room.quantity > 1 ? `${room.name} ${i + 1}` : room.name,
        width_mm: width,
        height_mm: 2134,
        type,
        fire_rating: fireRating,
        hardware,
        notes: '',
      });
    }
  }

  return doors;
}

export function generatePlumbingLegend(clinicType: string): PlumbingFixture[] {
  const fixtures: PlumbingFixture[] = [
    { mark: 'PF-1', fixture_type: 'Lavatory — Wall-Mount', model_reference: 'Kohler K-2005 or eq.', hot_water: true, cold_water: true, drain: true, gas: false, notes: 'Hands-free sensor faucet in clinical areas' },
    { mark: 'PF-2', fixture_type: 'Water Closet — Floor-Mount', model_reference: 'Kohler K-3999 or eq.', hot_water: false, cold_water: true, drain: true, gas: false, notes: '4.8L low-flow. Accessible units: elongated bowl, side transfer' },
    { mark: 'PF-3', fixture_type: 'Mop Sink — Floor', model_reference: 'Fiat MSB3624 or eq.', hot_water: true, cold_water: true, drain: true, gas: false, notes: 'Service room. Hose bib.' },
    { mark: 'PF-4', fixture_type: 'Break Room Sink', model_reference: 'Elkay LR2219 or eq.', hot_water: true, cold_water: true, drain: true, gas: false, notes: 'Stainless steel drop-in. Staff kitchenette.' },
    { mark: 'PF-5', fixture_type: 'Floor Drain', model_reference: 'Zurn ZN415 or eq.', hot_water: false, cold_water: false, drain: true, gas: false, notes: 'Trap primer required. Washrooms and wet areas.' },
  ];

  if (clinicType === 'dental') {
    fixtures.push(
      { mark: 'PF-6', fixture_type: 'Dental Cuspidor / Chair Drain', model_reference: 'Per dental unit mfr', hot_water: false, cold_water: true, drain: true, gas: false, notes: 'Amalgam separator on drain. Each operatory.' },
      { mark: 'PF-7', fixture_type: 'Sterilization Sink — Triple Basin', model_reference: 'Just SL-1830 or eq.', hot_water: true, cold_water: true, drain: true, gas: false, notes: 'Deep basins. Dirty-rinse-clean workflow.' },
    );
  }

  if (clinicType === 'veterinary') {
    fixtures.push(
      { mark: 'PF-6', fixture_type: 'Wet Table Sink', model_reference: 'Stainless fabricated', hot_water: true, cold_water: true, drain: true, gas: false, notes: 'Integrated ramp and drain. Treatment area.' },
      { mark: 'PF-7', fixture_type: 'Scrub Sink — Surgical', model_reference: 'Just Manufacturing', hot_water: true, cold_water: true, drain: true, gas: false, notes: 'Foot/knee operated. At surgery entry.' },
      { mark: 'PF-8', fixture_type: 'Kennel Drain', model_reference: 'Zurn ZN415 or eq.', hot_water: false, cold_water: false, drain: true, gas: false, notes: 'Floor drain each kennel zone. Hose bib adjacent.' },
    );
  }

  if (clinicType === 'pharmacy') {
    fixtures.push(
      { mark: 'PF-6', fixture_type: 'Compounding Sink', model_reference: 'Just SL-1830 or eq.', hot_water: true, cold_water: true, drain: true, gas: false, notes: 'Deep basin. Purified water connection option.' },
    );
  }

  if (clinicType === 'physiotherapy') {
    fixtures.push(
      { mark: 'PF-6', fixture_type: 'Hydrotherapy Tub Drain', model_reference: 'Per hydro unit mfr', hot_water: true, cold_water: true, drain: true, gas: false, notes: 'Thermostatic mixing valve. Floor drain in surround.' },
    );
  }

  return fixtures;
}

export function generateScopeOfWork(clinicType: string, existingSpace: boolean): string[] {
  const scope: string[] = [];

  if (existingSpace) {
    scope.push('Selective demolition of existing partitions, ceiling, and flooring as indicated on demolition plan.');
  }

  scope.push(
    'Construct new interior partitions per wall type schedule (P1-P6). Install fire-rated assemblies at suite separation and exit corridors.',
    'Supply and install all doors, frames, and hardware per door schedule. Include power operator at barrier-free entrance.',
    'Install suspended acoustical ceiling tile (ACT) throughout, with GWB bulkheads at washrooms and feature areas per reflected ceiling plan.',
    'Supply and install all flooring finishes per finish schedule — LVP, rubber tile, ceramic tile, and carpet tile as specified.',
    'Paint all GWB surfaces per finish schedule. Apply semi-gloss in wet areas, eggshell in dry areas.',
    'Supply and install millwork at reception desk, treatment rooms, and staff areas. Quartz and solid surface countertops per spec.',
    'Rough-in and connect HVAC system per mechanical drawings. Ensure ASHRAE 62.1 ventilation rates for healthcare occupancy.',
    'Rough-in and connect plumbing per plumbing plan. Install all fixtures per plumbing legend.',
    'Electrical rough-in per electrical plan. Install dedicated circuits for medical equipment, general power, and lighting.',
    'Install fire alarm devices per E300. Connect to base building fire alarm panel.',
    'Install data/telecom cabling per E400. CAT6 to all workstations and medical equipment locations.',
  );

  // Clinic-specific scope
  if (clinicType === 'dental') {
    scope.push(
      'Install dental compressed air, vacuum, and N2O piping systems per P101. Connect to operatory locations.',
      'Install lead shielding at X-ray / panoramic room per Health Canada Safety Code 30. Verify with radiation physicist.',
    );
  }
  if (clinicType === 'veterinary') {
    scope.push(
      'Install enhanced ventilation / exhaust at kennel and surgery areas per M101.',
      'Install lead shielding at X-ray room per Health Canada Safety Code 30.',
      'Install floor drains with hose bibs at kennel / recovery area.',
    );
  }
  if (clinicType === 'pharmacy') {
    scope.push(
      'Construct compounding room to clean room standards. Install HEPA filtration and dedicated exhaust per M101.',
    );
  }
  if (clinicType === 'physiotherapy') {
    scope.push(
      'Waterproof hydrotherapy room. Install floor drains and humidity exhaust per P101.',
    );
  }

  scope.push('Final cleaning, deficiency walkthrough, and commissioning of all systems prior to occupancy.');

  return scope;
}

export function generateDrawingListOutput(clinicType: string): DrawingListEntry[] {
  return getDrawingList(clinicType);
}

// ─── Cover Sheet ──────────────────────────────────────────

export function generateCoverSheet(config: {
  clinic_type: string;
  province: string;
  city: string;
  area_sqft: number;
  address: string;
  building_type: string;
  rooms: RoomScheduleEntry[];
  drawing_list: DrawingListEntry[];
}): CoverSheet {
  const areaM2 = Math.round(config.area_sqft * 0.092903 * 10) / 10;
  const provinceCode = getProvinceCode(config.province);
  const codes = [provinceCode];
  if (config.province === 'ON') codes.push('AODA O.Reg 191/11');
  if (config.province === 'BC') codes.push('BC Energy Step Code');
  codes.push('ASHRAE 62.1', 'NFPA 13');

  const buildingTypeLabels: Record<string, string> = {
    stand_alone: 'Stand Alone', strip_mall: 'Strip Mall',
    inside_mall: 'Inside Mall', high_rise: 'High Rise',
  };

  return {
    project_name: `${getClinicLabel(config.clinic_type)} — ${config.city || config.province}`,
    address: config.address || `${config.city}, ${config.province}`,
    building_type: buildingTypeLabels[config.building_type] || config.building_type,
    project_type: getClinicLabel(config.clinic_type),
    total_area_sqft: config.area_sqft,
    total_area_m2: areaM2,
    room_count: config.rooms.length,
    applicable_codes: codes,
    drawing_index: config.drawing_list,
    owner: 'TBD — Owner',
    architect: 'TBD — Architect of Record',
    date: new Date().toISOString().split('T')[0],
  };
}

// ─── Reflected Ceiling Plan ──────────────────────────────

export function generateCeilingPlan(
  rooms: RoomScheduleEntry[],
  floorPlan: import('@/types').FloorPlanGeometry,
  ceilingType: string,
): CeilingPlan {
  const gridModule = ceilingType === 'drywall' ? 'N/A — Drywall' : "2' x 4' (600 x 1200mm)";

  const ceilingRooms = floorPlan.rooms.map(fpRoom => {
    const isWet = ['washroom', 'sterilization', 'hydrotherapy', 'kennel'].some(
      k => fpRoom.room_name.toLowerCase().includes(k)
    );
    const roomCeiling: 'tbar' | 'drywall' | 'mixed' =
      ceilingType === 'drywall' ? 'drywall' :
      ceilingType === 'mixed' ? (isWet ? 'drywall' : 'tbar') :
      'tbar';

    const lightFixtures: { x: number; y: number; type: string }[] = [];
    const lightSpacing = 8;
    const cols = Math.max(1, Math.floor(fpRoom.width / lightSpacing));
    const rows = Math.max(1, Math.floor(fpRoom.depth / lightSpacing));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        lightFixtures.push({
          x: fpRoom.x + (c + 0.5) * (fpRoom.width / cols),
          y: fpRoom.y + (r + 0.5) * (fpRoom.depth / rows),
          type: roomCeiling === 'tbar' ? '2x4 LED Troffer' : 'Recessed LED Downlight',
        });
      }
    }

    const diffusers: { x: number; y: number }[] = [];
    const diffuserCount = Math.max(1, Math.round(fpRoom.area_actual / 200));
    for (let d = 0; d < diffuserCount; d++) {
      diffusers.push({
        x: fpRoom.x + ((d + 0.5) / diffuserCount) * fpRoom.width,
        y: fpRoom.y + fpRoom.depth * 0.5,
      });
    }

    const sprinklers: { x: number; y: number }[] = [];
    const sprinklerCount = Math.max(1, Math.round(fpRoom.area_actual / 130));
    for (let s = 0; s < sprinklerCount; s++) {
      sprinklers.push({
        x: fpRoom.x + ((s + 0.5) / sprinklerCount) * fpRoom.width,
        y: fpRoom.y + fpRoom.depth * 0.3,
      });
    }

    return {
      room_number: fpRoom.room_number,
      room_name: fpRoom.room_name,
      x: fpRoom.x, y: fpRoom.y, width: fpRoom.width, depth: fpRoom.depth,
      ceiling_type: roomCeiling,
      ceiling_height_ft: isWet ? 8.5 : 9,
      light_fixtures: lightFixtures,
      diffusers,
      sprinklers,
    };
  });

  return { ceiling_type: ceilingType, grid_module: gridModule, rooms: ceilingRooms };
}

// ─── Main export ───────────────────────────────────────────

export function generateMockOutput(config: {
  clinic_type: string;
  province: string;
  city: string;
  area_sqft: number;
  rooms_json: RoomConfig[];
  existing_space?: boolean;
  address?: string;
  building_type?: string;
  ceiling_type?: string;
}): OutputJSON {
  const rooms = config.rooms_json.length > 0 ? config.rooms_json : getDefaultRooms(config.clinic_type);
  const { occupancyLoad, requiredExits, requiredWashrooms, areaM2 } = calculateOccupancy(config.area_sqft, config.clinic_type);
  const provinceCode = getProvinceCode(config.province);
  const group = getClinicGroup(config.clinic_type);

  const summary: ProjectSummary = {
    clinic_type: getClinicLabel(config.clinic_type),
    province: config.province,
    city: config.city,
    total_area_sqft: config.area_sqft,
    occupancy_load: occupancyLoad,
    required_exits: requiredExits,
    required_washrooms: requiredWashrooms,
    building_code: provinceCode,
    occupancy_group: `Group ${group}`,
  };

  const room_program: RoomProgramEntry[] = rooms.map(r => ({
    room_name: r.name,
    quantity: r.quantity,
    area_sqft: r.area_sqft ?? 100,
    total_sqft: (r.area_sqft ?? 100) * r.quantity,
    notes: getRoomNote(r.name, config.clinic_type),
  }));

  const adjacencies = getAdjacencies(config.clinic_type, rooms);
  const compliance_checklist = getComplianceChecklist(config.province, config.clinic_type, occupancyLoad);
  const risks = getRisks(config.clinic_type, config.area_sqft, rooms);
  const next_steps = getNextSteps();

  const code_analysis: CodeAnalysis = {
    occupancy_classification: `Group ${group} — ${group === 'D' ? 'Business & Personal Services' : group === 'E' ? 'Mercantile' : 'Assembly'}`,
    construction_type: config.area_sqft > 5000 ? 'Type III-B (Combustible, sprinklered)' : 'Type V-B (Combustible, unsprinklered permitted)',
    fire_rating: '1-hour fire-rated suite separation',
    sprinkler_required: occupancyLoad > 150 || config.area_sqft > 5000,
    barrier_free_required: true,
  };

  // Only generate new sections for supported clinic types
  const supportedTypes = ['dental', 'optometry', 'veterinary', 'physiotherapy', 'medical_office', 'pharmacy'];
  const isSupported = supportedTypes.includes(config.clinic_type);

  const existingSpace = config.existing_space ?? true;
  const address = config.address ?? '';

  const output: OutputJSON = {
    summary,
    room_program,
    adjacencies,
    compliance_checklist,
    risks,
    next_steps,
    code_analysis,
  };

  if (isSupported) {
    output.room_schedule = generateRoomSchedule(rooms, config.clinic_type);
    output.detailed_code_analysis = generateDetailedCodeAnalysis({
      province: config.province,
      city: config.city,
      clinic_type: config.clinic_type,
      area_sqft: config.area_sqft,
      existing_space: existingSpace,
      address,
      occupancyLoad,
      requiredExits,
      requiredWashrooms,
      areaM2,
    });
    output.equipment_schedule = generateEquipmentSchedule(config.clinic_type);
    output.finish_schedule = generateFinishSchedule(config.clinic_type, rooms);
    output.wall_types = generateWallTypes(config.clinic_type);
    output.door_schedule = generateDoorSchedule(rooms, config.clinic_type);
    output.plumbing_legend = generatePlumbingLegend(config.clinic_type);
    output.scope_of_work = generateScopeOfWork(config.clinic_type, existingSpace);
    output.drawing_list = generateDrawingListOutput(config.clinic_type);
    output.floor_plan = generateFloorPlanLayout(
      output.room_schedule!, adjacencies, output.door_schedule!,
      output.wall_types!, config.area_sqft, config.clinic_type
    );

    // Generate 3D scene from floor plan
    if (output.floor_plan) {
      output.scene_3d = generateScene3D(output.floor_plan);

      // Generate ceiling plan
      output.ceiling_plan = generateCeilingPlan(
        output.room_schedule!,
        output.floor_plan,
        config.ceiling_type ?? 'tbar',
      );

      // Generate MEP plans
      output.electrical_plan = generateElectricalPlan(output.floor_plan, output.equipment_schedule!);
      output.plumbing_plan = generatePlumbingPlan(output.floor_plan, output.equipment_schedule!);
      output.hvac_plan = generateHVACPlan(
        output.floor_plan,
        output.room_schedule!.map(rs => ({ room_name: rs.room_name, area_sqft: rs.area_sqft })),
      );
    }

    // Generate cover sheet
    if (output.drawing_list && output.room_schedule) {
      output.cover_sheet = generateCoverSheet({
        clinic_type: config.clinic_type,
        province: config.province,
        city: config.city,
        area_sqft: config.area_sqft,
        address,
        building_type: config.building_type ?? 'stand_alone',
        rooms: output.room_schedule,
        drawing_list: output.drawing_list,
      });
    }
  }

  return output;
}
