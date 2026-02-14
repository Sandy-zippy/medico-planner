// Room-by-room finish palettes per clinic type
// Paint colors are Sherwin-Williams references, flooring is Tarkett/commercial-grade

import type { FinishScheduleEntry } from '@/types';

interface FinishPalette {
  wall: string;
  floor: string;
  ceiling: string;
  base: string;
  countertop: string;
  cabinet: string;
}

// Finish code mappings (F1-F8)
const FINISH_PALETTES: Record<string, FinishPalette> = {
  F1: {
    wall: 'SW 7015 Repose Gray, eggshell',
    floor: 'Tarkett iD Inspiration 55, LVP "Rustic Oak" — 6" x 48"',
    ceiling: 'ACT 2\'x4\' Armstrong Calla, white',
    base: '4" rubber cove base, dark gray',
    countertop: 'Quartz, Caesarstone "Fresh Concrete" 4001',
    cabinet: 'Thermofoil, matte white',
  },
  F2: {
    wall: 'SW 7029 Agreeable Gray, semi-gloss (wet areas)',
    floor: 'Tarkett Acczent Heterogeneous Sheet, "Blue Gray"',
    ceiling: 'GWB, Level 4, SW 7012 Creamy semi-gloss',
    base: '6" rubber cove base, dark gray',
    countertop: 'Solid surface, Corian "Glacier White"',
    cabinet: 'HPL, Wilsonart "Fashion Gray" D381',
  },
  F3: {
    wall: 'SW 7036 Accessible Beige, eggshell',
    floor: 'Rubber tile, Nora Norament 926 "Arago" gray',
    ceiling: 'ACT 2\'x4\' Armstrong Ultima, white',
    base: '4" rubber cove base, black',
    countertop: 'Stainless steel',
    cabinet: 'Stainless steel (medical grade)',
  },
  F4: {
    wall: 'Ceramic tile to 48" AFF + SW 7015 Repose Gray above',
    floor: 'Ceramic tile, porcelain 12"x24" "Carrara White"',
    ceiling: 'GWB, Level 4, SW 7012 Creamy semi-gloss, moisture resistant',
    base: 'Ceramic tile cove base',
    countertop: 'Quartz, Caesarstone "Pure White" 1141',
    cabinet: 'HPL, moisture resistant, matte white',
  },
  F5: {
    wall: 'SW 7008 Alabaster, flat (accent wall: SW 6244 Naval)',
    floor: 'Tarkett iD Inspiration 55, LVP "Brushed Pine" — 7" x 48"',
    ceiling: 'ACT 2\'x4\' Armstrong Calla, white',
    base: '4" rubber cove base, charcoal',
    countertop: 'Laminate, Wilsonart "White Cypress" 7976K',
    cabinet: 'N/A',
  },
  F6: {
    wall: 'SW 6119 Antique White, eggshell',
    floor: 'Carpet tile, Interface "Open Air 402" gray',
    ceiling: 'ACT 2\'x4\' Armstrong Calla, white',
    base: '4" rubber cove base, charcoal',
    countertop: 'Laminate, Wilsonart "Frosty White" 1573',
    cabinet: 'Thermofoil, warm gray',
  },
  F7: {
    wall: 'FRP panel to 48" AFF + SW 7029 Agreeable Gray',
    floor: 'Sealed concrete, epoxy finish, light gray',
    ceiling: 'Open structure, painted dark gray',
    base: '6" rubber cove base, black',
    countertop: 'Stainless steel',
    cabinet: 'N/A',
  },
  F8: {
    wall: 'SW 7015 Repose Gray, eggshell',
    floor: 'Tarkett iD Inspiration 55, LVP "Rustic Oak"',
    ceiling: 'GWB, Level 4, flat white',
    base: '4" rubber cove base, dark gray',
    countertop: 'Quartz, Caesarstone "Fresh Concrete" 4001',
    cabinet: 'Thermofoil, matte white',
  },
};

// Room-to-finish-code mapping per clinic type
const ROOM_FINISH_MAP: Record<string, Record<string, string>> = {
  dental: {
    'Reception / Waiting': 'F1',
    'Operatory': 'F2',
    'Sterilization': 'F3',
    'X-Ray / Pano Room': 'F2',
    "Doctor's Office": 'F6',
    'Staff Room': 'F5',
    'Accessible Washroom': 'F4',
    'Storage / Mechanical': 'F7',
  },
  optometry: {
    'Reception / Waiting': 'F1',
    'Pre-Test Room': 'F2',
    'Exam Room': 'F2',
    'Optical Dispensary': 'F1',
    'Contact Lens Room': 'F2',
    "Doctor's Office": 'F6',
    'Staff Room': 'F5',
    'Accessible Washroom': 'F4',
    'Storage': 'F7',
  },
  veterinary: {
    'Reception / Waiting': 'F1',
    'Exam Room': 'F3',
    'Surgery Suite': 'F3',
    'Treatment Area': 'F3',
    'Kennel / Recovery': 'F7',
    'Lab / Pharmacy': 'F2',
    'X-Ray Room': 'F2',
    "Doctor's Office": 'F6',
    'Staff Room': 'F5',
    'Accessible Washroom': 'F4',
    'Storage / Mechanical': 'F7',
  },
  physiotherapy: {
    'Reception / Waiting': 'F1',
    'Treatment Bay': 'F2',
    'Open Gym / Exercise Area': 'F5',
    'Private Treatment Room': 'F2',
    'Hydrotherapy Room': 'F4',
    'Staff Office': 'F6',
    'Accessible Washroom': 'F4',
    'Storage': 'F7',
  },
  medical_office: {
    'Reception / Waiting': 'F1',
    'Exam Room': 'F2',
    'Nurse Station': 'F2',
    "Doctor's Office": 'F6',
    'Lab / Blood Draw': 'F3',
    'Staff Room': 'F5',
    'Accessible Washroom': 'F4',
    'Medical Records / Storage': 'F7',
  },
  pharmacy: {
    'Retail / Dispensary Floor': 'F1',
    'Prescription Counter': 'F2',
    'Compounding Room': 'F3',
    'Consultation Room': 'F8',
    'Cold Storage': 'F7',
    'Office': 'F6',
    'Staff Area': 'F5',
    'Accessible Washroom': 'F4',
    'Storage / Receiving': 'F7',
  },
};

export function getFinishSchedule(clinicType: string, rooms: { name: string }[]): FinishScheduleEntry[] {
  const map = ROOM_FINISH_MAP[clinicType] ?? {};

  return rooms.map(room => {
    const code = map[room.name] ?? 'F1';
    const palette = FINISH_PALETTES[code] ?? FINISH_PALETTES.F1;
    return {
      room_name: room.name,
      finish_code: code,
      wall: palette.wall,
      floor: palette.floor,
      ceiling: palette.ceiling,
      base: palette.base,
      countertop: palette.countertop,
      cabinet: palette.cabinet,
    };
  });
}

export function getFinishPalette(code: string): FinishPalette | undefined {
  return FINISH_PALETTES[code];
}
