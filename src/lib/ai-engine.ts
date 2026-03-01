/**
 * AI-Powered Hybrid Generation Pipeline
 *
 * Phase 1: AI (Claude) — room program, adjacencies, compliance, risks, layout hints
 * Phase 2: Deterministic — equipment, finishes, walls, doors, plumbing, drawings
 * Phase 3: Layout — floor plan geometry from AI-optimized rooms
 * Phase 4: 3D — scene from floor plan geometry
 */

import type { OutputJSON, RoomConfig, ProjectSummary, RoomProgramEntry } from '@/types';
import { generateWithAI, isAIEnabled } from './claude-client';
import { generateMockOutput } from './mock-engine';
import {
  generateRoomSchedule,
  generateDetailedCodeAnalysis,
  generateEquipmentSchedule,
  generateFinishSchedule,
  generateWallTypes,
  generateDoorSchedule,
  generatePlumbingLegend,
  generateScopeOfWork,
  generateDrawingListOutput,
} from './mock-engine';
import { generateFloorPlanLayout } from './floor-plan-engine';
import { generateScene3D } from './scene-3d-engine';
import { calculateOccupancy, getProvinceCode, getClinicLabel, getClinicGroup } from './constants';
import { getDefaultRooms } from './room-templates';

export interface GenerationConfig {
  clinic_type: string;
  province: string;
  city: string;
  area_sqft: number;
  rooms_json: RoomConfig[];
  existing_space?: boolean;
  address?: string;
}

/**
 * Main generation entry point.
 * Uses AI when ANTHROPIC_API_KEY is available, falls back to mock engine.
 */
export async function generateOutput(config: GenerationConfig): Promise<OutputJSON> {
  if (!isAIEnabled()) {
    // Fallback: synchronous mock generation (existing behavior)
    return generateMockOutput({
      clinic_type: config.clinic_type,
      province: config.province,
      city: config.city,
      area_sqft: config.area_sqft,
      rooms_json: config.rooms_json,
      existing_space: config.existing_space ?? true,
      address: config.address ?? '',
    });
  }

  return generateWithAIPipeline(config);
}

async function generateWithAIPipeline(config: GenerationConfig): Promise<OutputJSON> {
  const rooms = config.rooms_json.length > 0 ? config.rooms_json : getDefaultRooms(config.clinic_type);
  const existingSpace = config.existing_space ?? true;
  const address = config.address ?? '';

  // ── Phase 1: AI Generation ──
  const aiResult = await generateWithAI({
    clinic_type: config.clinic_type,
    province: config.province,
    city: config.city,
    area_sqft: config.area_sqft,
    rooms_json: rooms,
    existing_space: existingSpace,
    address,
  });

  // ── Build summary from AI code_analysis ──
  const { occupancyLoad, requiredExits, requiredWashrooms, areaM2 } =
    calculateOccupancy(config.area_sqft, config.clinic_type);

  const summary: ProjectSummary = {
    clinic_type: getClinicLabel(config.clinic_type),
    province: config.province,
    city: config.city,
    total_area_sqft: config.area_sqft,
    occupancy_load: occupancyLoad,
    required_exits: requiredExits,
    required_washrooms: requiredWashrooms,
    building_code: getProvinceCode(config.province),
    occupancy_group: `Group ${getClinicGroup(config.clinic_type)}`,
  };

  // Convert AI room_program to RoomConfig for deterministic generators
  const aiRooms: RoomConfig[] = aiResult.room_program.map(rp => ({
    name: rp.room_name,
    quantity: rp.quantity,
    area_sqft: rp.area_sqft,
  }));

  // ── Phase 2: Deterministic Generators ──
  const supportedTypes = ['dental', 'optometry', 'veterinary', 'physiotherapy', 'medical_office', 'pharmacy'];
  const isSupported = supportedTypes.includes(config.clinic_type);

  const output: OutputJSON = {
    summary,
    room_program: aiResult.room_program,
    adjacencies: aiResult.adjacencies,
    compliance_checklist: aiResult.compliance_checklist,
    risks: aiResult.risks,
    next_steps: [
      'Review AI-generated room program and provide feedback on space priorities',
      'Schedule site survey to verify existing conditions',
      'Confirm mechanical/electrical capacity with base building landlord',
      'Review compliance items flagged for action or review',
      'Approve concept package to advance to Schematic Design phase',
      'Discuss phasing strategy if program exceeds available area',
    ],
    code_analysis: aiResult.code_analysis,
  };

  if (isSupported) {
    output.room_schedule = generateRoomSchedule(aiRooms, config.clinic_type);
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
    output.finish_schedule = generateFinishSchedule(config.clinic_type, aiRooms);
    output.wall_types = generateWallTypes(config.clinic_type);
    output.door_schedule = generateDoorSchedule(aiRooms, config.clinic_type);
    output.plumbing_legend = generatePlumbingLegend(config.clinic_type);
    output.scope_of_work = generateScopeOfWork(config.clinic_type, existingSpace);
    output.drawing_list = generateDrawingListOutput(config.clinic_type);

    // ── Phase 3: Floor Plan Layout ──
    output.floor_plan = generateFloorPlanLayout(
      output.room_schedule!,
      aiResult.adjacencies,
      output.door_schedule!,
      output.wall_types!,
      config.area_sqft,
      config.clinic_type,
    );

    // ── Phase 4: 3D Scene ──
    if (output.floor_plan) {
      output.scene_3d = generateScene3D(output.floor_plan);
    }
  }

  return output;
}
