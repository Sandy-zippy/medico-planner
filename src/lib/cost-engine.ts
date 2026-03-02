import type { CostEstimate, CostLineItem, RoomScheduleEntry } from '@/types';

// CAD per SF — healthcare tenant improvement, 2024-2025 rates
const ROOM_COST_RATES: Record<string, number> = {
  'Reception / Waiting': 85,
  'Operatory': 165,
  'Sterilization': 180,
  'X-Ray / Pano Room': 220,
  'X-Ray Room': 220,
  'Surgery Suite': 250,
  'Exam Room': 130,
  'Treatment Bay': 140,
  'Treatment Area': 140,
  'Private Treatment Room': 140,
  'Open Gym / Exercise Area': 75,
  'Compounding Room': 210,
  'Kennel / Recovery': 110,
  'Lab / Pharmacy': 150,
  'Lab / Blood Draw': 150,
  'Optical Dispensary': 95,
  'Pre-Test Room': 130,
  'Contact Lens Room': 130,
  'Nurse Station': 120,
  'Hydrotherapy Room': 180,
  'Retail / Dispensary Floor': 90,
  'Prescription Counter': 120,
  'Consultation Room': 110,
  'Cold Storage': 130,
  "Doctor's Office": 95,
  'Staff Office': 95,
  'Office': 95,
  'Staff Room': 80,
  'Staff Area': 80,
  'Accessible Washroom': 140,
  'Storage / Mechanical': 70,
  'Storage': 70,
  'Storage / Receiving': 70,
  'Medical Records / Storage': 70,
};

const DEFAULT_COST_PER_SF = 110;

const PROVINCE_MULTIPLIERS: Record<string, number> = {
  ON: 1.0,
  BC: 1.12,
  AB: 1.05,
  QC: 0.95,
  SK: 0.92,
  MB: 0.93,
  NB: 0.90,
  NS: 0.91,
  PE: 0.89,
  NL: 0.94,
};

function getRoomCostRate(roomName: string): number {
  // Exact match first
  if (ROOM_COST_RATES[roomName] !== undefined) return ROOM_COST_RATES[roomName];
  // Fuzzy match — strip trailing numbers (e.g. "Operatory 1" → "Operatory")
  const baseName = roomName.replace(/\s+\d+$/, '');
  if (ROOM_COST_RATES[baseName] !== undefined) return ROOM_COST_RATES[baseName];
  return DEFAULT_COST_PER_SF;
}

export function generateCostEstimate(
  roomSchedule: RoomScheduleEntry[],
  province: string,
): CostEstimate {
  const multiplier = PROVINCE_MULTIPLIERS[province] ?? 1.0;
  const lineItems: CostLineItem[] = [];

  // Room construction costs
  let roomSubtotal = 0;
  for (const room of roomSchedule) {
    const rate = getRoomCostRate(room.room_name) * multiplier;
    const total = Math.round(rate * room.area_sqft);
    roomSubtotal += total;
    lineItems.push({
      category: 'Room Construction',
      description: room.room_name,
      quantity: room.area_sqft,
      unit: 'SF',
      unit_cost: Math.round(rate),
      total,
    });
  }

  // General conditions (12%)
  const generalConditions = Math.round(roomSubtotal * 0.12);
  lineItems.push({
    category: 'General Conditions',
    description: 'General conditions, insurance, and site management',
    quantity: 1,
    unit: 'LS',
    unit_cost: generalConditions,
    total: generalConditions,
  });

  // Design & permits (8%)
  const designPermits = Math.round(roomSubtotal * 0.08);
  lineItems.push({
    category: 'Design & Permits',
    description: 'Architectural/engineering fees and permit costs',
    quantity: 1,
    unit: 'LS',
    unit_cost: designPermits,
    total: designPermits,
  });

  // Equipment allowance (15% of clinical rooms only)
  const clinicalKeywords = ['operatory', 'sterilization', 'x-ray', 'surgery', 'exam', 'treatment', 'lab', 'compounding', 'hydrotherapy', 'kennel', 'pre-test', 'nurse'];
  const clinicalTotal = roomSchedule
    .filter(r => clinicalKeywords.some(k => r.room_name.toLowerCase().includes(k)))
    .reduce((sum, r) => sum + getRoomCostRate(r.room_name) * multiplier * r.area_sqft, 0);
  const equipmentAllowance = Math.round(clinicalTotal * 0.15);
  lineItems.push({
    category: 'Equipment Allowance',
    description: 'Clinical equipment and specialty fixtures',
    quantity: 1,
    unit: 'LS',
    unit_cost: equipmentAllowance,
    total: equipmentAllowance,
  });

  const subtotal = roomSubtotal + generalConditions + designPermits + equipmentAllowance;
  const contingencyPercent = 15;
  const contingencyAmount = Math.round(subtotal * contingencyPercent / 100);
  const total = subtotal + contingencyAmount;
  const totalArea = roomSchedule.reduce((sum, r) => sum + r.area_sqft, 0);
  const costPerSqft = totalArea > 0 ? Math.round(total / totalArea) : 0;

  return {
    line_items: lineItems,
    subtotal,
    contingency_percent: contingencyPercent,
    contingency_amount: contingencyAmount,
    total,
    cost_per_sqft: costPerSqft,
    currency: 'CAD',
    disclaimer: `Preliminary budget estimate only — not a construction quote. Based on 2024-2025 Canadian healthcare tenant improvement rates for ${province}. Actual costs vary by site conditions, contractor availability, and specification refinements. Generated ${new Date().toISOString().split('T')[0]}.`,
  };
}
