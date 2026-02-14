// Standard partition types matching real construction documents
// P1-P6 interior partitions, W1-W2 existing/demising walls

import type { WallType } from '@/types';

export const WALL_TYPES: WallType[] = [
  {
    type_code: 'P1',
    description: 'Standard Interior Partition',
    stud_size: '3-5/8" (92mm) steel stud @ 16" o.c.',
    layers: '1x 5/8" Type X GWB each side',
    insulation: 'None',
    fire_rating: '0 hr (non-rated)',
    stc_rating: 38,
    use_locations: ['Office to office', 'Storage rooms', 'Staff areas'],
  },
  {
    type_code: 'P2',
    description: '1-Hour Fire-Rated Partition',
    stud_size: '3-5/8" (92mm) steel stud @ 16" o.c.',
    layers: '2x 5/8" Type X GWB each side',
    insulation: 'R-12 mineral wool batt',
    fire_rating: '1 hr',
    stc_rating: 52,
    use_locations: ['Suite separation to corridor', 'Exit corridor walls', 'Demising to adjacent tenant'],
  },
  {
    type_code: 'P3',
    description: 'Acoustic Partition',
    stud_size: '3-5/8" (92mm) steel stud @ 16" o.c.',
    layers: '1x 5/8" Type X GWB each side',
    insulation: 'R-12 mineral wool batt, full cavity',
    fire_rating: '0 hr (non-rated)',
    stc_rating: 52,
    use_locations: ['Exam rooms', 'Consultation rooms', 'Treatment rooms', 'Offices'],
  },
  {
    type_code: 'P4',
    description: 'Wet Wall — Moisture Resistant',
    stud_size: '3-5/8" (92mm) steel stud @ 16" o.c.',
    layers: '1x 5/8" moisture-resistant GWB + cement board at wet areas',
    insulation: 'R-12 mineral wool batt',
    fire_rating: '0 hr (non-rated)',
    stc_rating: 45,
    use_locations: ['Washrooms', 'Sterilization', 'Hydrotherapy', 'Compounding rooms'],
  },
  {
    type_code: 'P5',
    description: 'X-Ray Shielding Partition',
    stud_size: '3-5/8" (92mm) steel stud @ 16" o.c.',
    layers: '1x 5/8" Type X GWB + 1/16" lead sheet each side',
    insulation: 'R-12 mineral wool batt',
    fire_rating: '1 hr',
    stc_rating: 55,
    use_locations: ['X-ray rooms', 'Pano rooms', 'CBCT rooms'],
  },
  {
    type_code: 'P6',
    description: 'Chase Wall — Services',
    stud_size: '6" (152mm) steel stud @ 16" o.c.',
    layers: '1x 5/8" Type X GWB each side',
    insulation: 'As required for acoustics',
    fire_rating: '0 hr (non-rated)',
    stc_rating: 42,
    use_locations: ['Plumbing chases', 'Dental service walls', 'Mechanical chases'],
  },
  {
    type_code: 'W1',
    description: 'Existing Exterior Wall',
    stud_size: 'As existing',
    layers: 'As existing — verify in field',
    insulation: 'As existing — verify thermal performance',
    fire_rating: 'As existing — verify',
    stc_rating: 0,
    use_locations: ['Exterior envelope', 'Perimeter walls'],
  },
  {
    type_code: 'W2',
    description: 'Existing Demising Wall',
    stud_size: 'As existing',
    layers: 'As existing — verify in field',
    insulation: 'As existing — verify',
    fire_rating: 'As existing — min 1 hr expected',
    stc_rating: 0,
    use_locations: ['Party walls to adjacent tenants', 'Common area walls'],
  },
];

// Clinic-type specific wall type assignments
const CLINIC_WALL_NEEDS: Record<string, string[]> = {
  dental: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'W1', 'W2'],
  optometry: ['P1', 'P2', 'P3', 'P4', 'W1', 'W2'],
  veterinary: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'W1', 'W2'],
  physiotherapy: ['P1', 'P2', 'P3', 'P4', 'W1', 'W2'],
  medical_office: ['P1', 'P2', 'P3', 'P4', 'W1', 'W2'],
  pharmacy: ['P1', 'P2', 'P3', 'P4', 'W1', 'W2'],
};

export function getWallTypesForClinic(clinicType: string): WallType[] {
  const needed = CLINIC_WALL_NEEDS[clinicType] ?? ['P1', 'P2', 'P3', 'W1', 'W2'];
  return WALL_TYPES.filter(w => needed.includes(w.type_code));
}
