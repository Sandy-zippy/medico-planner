import type { OutputJSON, RoomProgramEntry, Adjacency, ComplianceItem, RiskItem, CodeAnalysis, ProjectSummary } from '@/types';
import { calculateOccupancy, getProvinceCode, getClinicLabel, getClinicGroup } from './constants';
import { getDefaultRooms } from './room-templates';
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
  // Filter to only adjacencies where both rooms exist
  const filtered = specific.filter(a => roomNames.includes(a.room_a) && roomNames.includes(a.room_b));
  // Add universal adjacencies
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

  // Province-specific items
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

  // Clinic-specific
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

export function generateMockOutput(config: {
  clinic_type: string;
  province: string;
  city: string;
  area_sqft: number;
  rooms_json: RoomConfig[];
}): OutputJSON {
  const rooms = config.rooms_json.length > 0 ? config.rooms_json : getDefaultRooms(config.clinic_type);
  const { occupancyLoad, requiredExits, requiredWashrooms } = calculateOccupancy(config.area_sqft, config.clinic_type);
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

  return {
    summary,
    room_program,
    adjacencies,
    compliance_checklist,
    risks,
    next_steps,
    code_analysis,
  };
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
