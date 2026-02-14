export const CLINIC_TYPES = [
  { value: 'dental', label: 'Dental Clinic', group: 'D' },
  { value: 'optometry', label: 'Optometry Clinic', group: 'D' },
  { value: 'veterinary', label: 'Veterinary Clinic', group: 'D' },
  { value: 'physiotherapy', label: 'Physiotherapy Clinic', group: 'D' },
  { value: 'medical_office', label: 'Medical Office', group: 'D' },
  { value: 'pharmacy', label: 'Pharmacy', group: 'E' },
  { value: 'daycare', label: 'Daycare Center', group: 'A2' },
  { value: 'yoga_studio', label: 'Yoga / Pilates Studio', group: 'A2' },
  { value: 'restaurant', label: 'Restaurant / Café', group: 'A2' },
  { value: 'retail', label: 'Retail Store', group: 'E' },
  { value: 'law_office', label: 'Law Firm / Accounting Office', group: 'D' },
  { value: 'tech_office', label: 'Tech Startup Office', group: 'D' },
] as const;

export const PROVINCES = [
  { value: 'ON', label: 'Ontario', code: 'OBC 2012 / NBC 2020' },
  { value: 'BC', label: 'British Columbia', code: 'BCBC 2024' },
  { value: 'AB', label: 'Alberta', code: 'ABC 2019' },
  { value: 'QC', label: 'Quebec', code: 'NBC 2015 Amended' },
  { value: 'MB', label: 'Manitoba', code: 'NBC 2020' },
  { value: 'SK', label: 'Saskatchewan', code: 'NBC 2020' },
  { value: 'NS', label: 'Nova Scotia', code: 'NBC 2020' },
  { value: 'NB', label: 'New Brunswick', code: 'NBC 2020' },
  { value: 'PE', label: 'Prince Edward Island', code: 'NBC 2020' },
  { value: 'NL', label: 'Newfoundland and Labrador', code: 'NBC 2020' },
] as const;

export const BUDGET_RANGES = [
  { value: 'under_100k', label: 'Under $100K' },
  { value: '100k_250k', label: '$100K – $250K' },
  { value: '250k_500k', label: '$250K – $500K' },
  { value: '500k_1m', label: '$500K – $1M' },
  { value: 'over_1m', label: 'Over $1M' },
] as const;

export const TIMELINES = [
  { value: 'asap', label: 'ASAP (1–3 months)' },
  { value: 'standard', label: 'Standard (3–6 months)' },
  { value: 'flexible', label: 'Flexible (6–12 months)' },
  { value: 'planning', label: 'Planning Phase Only' },
] as const;

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

export function getOccupancyFactor(clinicType: string): number {
  const retailTypes = ['pharmacy', 'retail', 'restaurant'];
  const assemblyTypes = ['daycare', 'yoga_studio'];
  if (retailTypes.includes(clinicType)) return 3.7;
  if (assemblyTypes.includes(clinicType)) return 2.8;
  return 9.3; // Group D default
}

export function calculateOccupancy(areaSqft: number, clinicType: string) {
  const areaM2 = areaSqft * 0.092903;
  const factor = getOccupancyFactor(clinicType);
  const occupancyLoad = Math.ceil(areaM2 / factor);
  const requiredExits = occupancyLoad > 60 ? 2 : 1;
  const requiredWashrooms = occupancyLoad > 10 ? Math.ceil(occupancyLoad / 50) : 1;
  return { occupancyLoad, requiredExits, requiredWashrooms, areaM2 };
}

export function getProvinceCode(province: string): string {
  return PROVINCES.find(p => p.value === province)?.code ?? 'NBC 2020';
}

export function getClinicLabel(clinicType: string): string {
  return CLINIC_TYPES.find(c => c.value === clinicType)?.label ?? clinicType;
}

export function getClinicGroup(clinicType: string): string {
  return CLINIC_TYPES.find(c => c.value === clinicType)?.group ?? 'D';
}

// Fire code constants per province
export const FIRE_CODE_REQUIREMENTS: Record<string, {
  exit_corridor_rating: string;
  suite_separation_rating: string;
  floor_assembly_rating: string;
  roof_assembly_rating: string;
  max_travel_distance_m: number;
  corridor_min_width_mm: number;
  door_min_width_mm: number;
  headroom_mm: number;
}> = {
  BC: {
    exit_corridor_rating: '1 hr (BCBC 3.2.7)',
    suite_separation_rating: '1 hr (BCBC 3.3.4)',
    floor_assembly_rating: '1 hr (BCBC 3.2.2)',
    roof_assembly_rating: '1 hr or non-combustible (BCBC 3.2.2)',
    max_travel_distance_m: 25,
    corridor_min_width_mm: 1100,
    door_min_width_mm: 860,
    headroom_mm: 2100,
  },
  ON: {
    exit_corridor_rating: '1 hr (OBC 3.2.7)',
    suite_separation_rating: '1 hr (OBC 3.3.4)',
    floor_assembly_rating: '1 hr (OBC 3.2.2)',
    roof_assembly_rating: '1 hr (OBC 3.2.2)',
    max_travel_distance_m: 30,
    corridor_min_width_mm: 1100,
    door_min_width_mm: 860,
    headroom_mm: 2100,
  },
  AB: {
    exit_corridor_rating: '1 hr (ABC 3.2.7)',
    suite_separation_rating: '1 hr (ABC 3.3.4)',
    floor_assembly_rating: '1 hr (ABC 3.2.2)',
    roof_assembly_rating: '1 hr (ABC 3.2.2)',
    max_travel_distance_m: 25,
    corridor_min_width_mm: 1100,
    door_min_width_mm: 860,
    headroom_mm: 2100,
  },
};

// Default fire code requirements for provinces without specific overrides
export const DEFAULT_FIRE_CODE = {
  exit_corridor_rating: '1 hr (NBC 3.2.7)',
  suite_separation_rating: '1 hr (NBC 3.3.4)',
  floor_assembly_rating: '1 hr (NBC 3.2.2)',
  roof_assembly_rating: '1 hr (NBC 3.2.2)',
  max_travel_distance_m: 25,
  corridor_min_width_mm: 1100,
  door_min_width_mm: 860,
  headroom_mm: 2100,
};

export function getFireCodeRequirements(province: string) {
  return FIRE_CODE_REQUIREMENTS[province] ?? DEFAULT_FIRE_CODE;
}

// Occupancy group descriptions
export const OCCUPANCY_DESCRIPTIONS: Record<string, string> = {
  D: 'Business and Personal Services — includes medical, dental, professional offices',
  E: 'Mercantile — includes retail, pharmacy',
  A2: 'Assembly — includes daycare, fitness, restaurants',
};

// Construction types based on area
export function getConstructionType(areaSqft: number, sprinklered: boolean): string {
  if (areaSqft > 10000) return 'Type III-B (Non-combustible / Combustible, sprinklered)';
  if (areaSqft > 5000 || sprinklered) return 'Type III-B (Combustible, sprinklered)';
  return 'Type V-B (Combustible, unsprinklered permitted)';
}
