// Standard drawing list per clinic type
// Matches real Medico Construction document sets (D000-A601)

import type { DrawingListEntry } from '@/types';

const BASE_DRAWINGS: DrawingListEntry[] = [
  { drawing_number: 'D000', title: 'Cover Sheet & Drawing Index', discipline: 'General' },
  { drawing_number: 'D001', title: 'Code Analysis & Building Data', discipline: 'General' },
  { drawing_number: 'D002', title: 'Room Schedule & Finish Legend', discipline: 'General' },
  { drawing_number: 'D003', title: 'Equipment Schedule & Utility Matrix', discipline: 'General' },
  { drawing_number: 'A100', title: 'Existing Conditions Plan', discipline: 'Architectural' },
  { drawing_number: 'A101', title: 'Demolition Plan', discipline: 'Architectural' },
  { drawing_number: 'A102', title: 'Construction Plan — Partitions & Doors', discipline: 'Architectural' },
  { drawing_number: 'A103', title: 'Reflected Ceiling Plan', discipline: 'Architectural' },
  { drawing_number: 'A104', title: 'Finish Plan', discipline: 'Architectural' },
  { drawing_number: 'A105', title: 'Furniture & Equipment Layout', discipline: 'Architectural' },
  { drawing_number: 'A200', title: 'Interior Elevations — Reception & Waiting', discipline: 'Architectural' },
  { drawing_number: 'A201', title: 'Interior Elevations — Treatment Rooms', discipline: 'Architectural' },
  { drawing_number: 'A300', title: 'Wall Types & Partition Details', discipline: 'Architectural' },
  { drawing_number: 'A301', title: 'Door & Frame Details', discipline: 'Architectural' },
  { drawing_number: 'A302', title: 'Millwork Details', discipline: 'Architectural' },
  { drawing_number: 'A400', title: 'Washroom Details & Accessibility', discipline: 'Architectural' },
  { drawing_number: 'A601', title: 'Signage & Wayfinding Plan', discipline: 'Architectural' },
  { drawing_number: 'M100', title: 'Mechanical Plan — HVAC Layout', discipline: 'Mechanical' },
  { drawing_number: 'M200', title: 'Mechanical Schedules & Details', discipline: 'Mechanical' },
  { drawing_number: 'P100', title: 'Plumbing Plan — Fixture Layout', discipline: 'Plumbing' },
  { drawing_number: 'P200', title: 'Plumbing Schedules & Riser Diagram', discipline: 'Plumbing' },
  { drawing_number: 'E100', title: 'Electrical Plan — Power & Lighting', discipline: 'Electrical' },
  { drawing_number: 'E200', title: 'Electrical Panel Schedule & Details', discipline: 'Electrical' },
  { drawing_number: 'E300', title: 'Fire Alarm Plan', discipline: 'Electrical' },
  { drawing_number: 'E400', title: 'Data / Telecom Plan', discipline: 'Electrical' },
];

// Additional drawings for specific clinic types
const SPECIALTY_DRAWINGS: Record<string, DrawingListEntry[]> = {
  dental: [
    { drawing_number: 'A106', title: 'Operatory Enlarged Plans', discipline: 'Architectural' },
    { drawing_number: 'A202', title: 'Interior Elevations — Sterilization', discipline: 'Architectural' },
    { drawing_number: 'A303', title: 'Dental Cabinetry Details', discipline: 'Architectural' },
    { drawing_number: 'P101', title: 'Dental Services Layout (Compressed Air, Vacuum, N2O)', discipline: 'Plumbing' },
    { drawing_number: 'E101', title: 'Dedicated Circuit Plan — Dental Equipment', discipline: 'Electrical' },
  ],
  optometry: [
    { drawing_number: 'A106', title: 'Exam Lane Enlarged Plans (20\' lane layout)', discipline: 'Architectural' },
    { drawing_number: 'A202', title: 'Interior Elevations — Optical Dispensary', discipline: 'Architectural' },
    { drawing_number: 'A303', title: 'Display Case & Millwork Details', discipline: 'Architectural' },
  ],
  veterinary: [
    { drawing_number: 'A106', title: 'Surgery Suite Enlarged Plan', discipline: 'Architectural' },
    { drawing_number: 'A107', title: 'Kennel Area Layout', discipline: 'Architectural' },
    { drawing_number: 'A202', title: 'Interior Elevations — Treatment Area', discipline: 'Architectural' },
    { drawing_number: 'P101', title: 'Veterinary Gas & Drainage Layout', discipline: 'Plumbing' },
    { drawing_number: 'E101', title: 'Dedicated Circuit Plan — Vet Equipment', discipline: 'Electrical' },
    { drawing_number: 'M101', title: 'Enhanced Ventilation Plan — Kennel & Surgery', discipline: 'Mechanical' },
  ],
  physiotherapy: [
    { drawing_number: 'A106', title: 'Open Gym Equipment Layout', discipline: 'Architectural' },
    { drawing_number: 'A202', title: 'Interior Elevations — Hydrotherapy', discipline: 'Architectural' },
    { drawing_number: 'P101', title: 'Hydrotherapy Plumbing Layout', discipline: 'Plumbing' },
  ],
  medical_office: [
    { drawing_number: 'A106', title: 'Exam Room Enlarged Plans', discipline: 'Architectural' },
    { drawing_number: 'A202', title: 'Interior Elevations — Nurse Station', discipline: 'Architectural' },
  ],
  pharmacy: [
    { drawing_number: 'A106', title: 'Compounding Room Enlarged Plan', discipline: 'Architectural' },
    { drawing_number: 'A202', title: 'Interior Elevations — Dispensary Counter', discipline: 'Architectural' },
    { drawing_number: 'A303', title: 'Shelving & Display Details', discipline: 'Architectural' },
    { drawing_number: 'M101', title: 'Compounding Room HVAC — Clean Air Requirements', discipline: 'Mechanical' },
  ],
};

export function getDrawingList(clinicType: string): DrawingListEntry[] {
  const specialty = SPECIALTY_DRAWINGS[clinicType] ?? [];
  const combined = [...BASE_DRAWINGS, ...specialty];
  // Sort by drawing number
  return combined.sort((a, b) => a.drawing_number.localeCompare(b.drawing_number));
}
