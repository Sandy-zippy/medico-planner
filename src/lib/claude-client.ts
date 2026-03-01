import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { AIGenerationResult, RoomConfig } from '@/types';
import { getClinicLabel, getProvinceCode, getClinicGroup } from './constants';
import { ROOM_TEMPLATES } from './room-templates';

// ── Zod schemas for response validation ───────────────────

const RoomProgramSchema = z.object({
  room_name: z.string(),
  quantity: z.number(),
  area_sqft: z.number(),
  total_sqft: z.number(),
  notes: z.string(),
});

const AdjacencySchema = z.object({
  room_a: z.string(),
  room_b: z.string(),
  priority: z.enum(['required', 'preferred', 'avoid']),
  reason: z.string(),
});

const ComplianceSchema = z.object({
  category: z.string(),
  requirement: z.string(),
  code_reference: z.string(),
  status: z.enum(['met', 'review', 'action_required']),
});

const RiskSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string(),
  mitigation: z.string(),
});

const CodeAnalysisSchema = z.object({
  occupancy_classification: z.string(),
  construction_type: z.string(),
  fire_rating: z.string(),
  sprinkler_required: z.boolean(),
  barrier_free_required: z.boolean(),
});

const LayoutHintsSchema = z.object({
  corridor_type: z.enum(['single', 'double', 'L', 'loop']),
  zone_placement: z.string(),
  flow_notes: z.string(),
}).optional();

const AIResponseSchema = z.object({
  room_program: z.array(RoomProgramSchema),
  adjacencies: z.array(AdjacencySchema),
  compliance_checklist: z.array(ComplianceSchema),
  risks: z.array(RiskSchema),
  code_analysis: CodeAnalysisSchema,
  layout_hints: LayoutHintsSchema,
});

// ── Prompt construction ───────────────────────────────────

function buildSystemPrompt(): string {
  return `You are an expert Canadian healthcare architectural planner. You generate space programming documents for clinics, medical offices, and healthcare facilities across Canada.

Your expertise covers:
- National Building Code of Canada (NBC 2020) and provincial variants (OBC, BCBC, ABC)
- Healthcare facility design standards (CSA Z8000, ASHRAE 170)
- Room programming and space optimization for medical facilities
- Building code compliance (fire ratings, egress, barrier-free, ventilation)
- Spatial adjacency workflows for clinical environments

You produce structured JSON output only. No markdown, no commentary.`;
}

function buildUserPrompt(config: {
  clinic_type: string;
  province: string;
  city: string;
  area_sqft: number;
  rooms_json: RoomConfig[];
  existing_space: boolean;
  address: string;
}): string {
  const clinicLabel = getClinicLabel(config.clinic_type);
  const provinceCode = getProvinceCode(config.province);
  const group = getClinicGroup(config.clinic_type);
  const defaultRooms = ROOM_TEMPLATES[config.clinic_type] ?? [];

  const userRooms = config.rooms_json.length > 0 ? config.rooms_json : defaultRooms;
  const totalProgrammed = userRooms.reduce((s, r) => s + (r.area_sqft ?? 100) * r.quantity, 0);

  return `Generate a complete architectural space program for this project:

PROJECT:
- Type: ${clinicLabel} (${config.clinic_type})
- Location: ${config.city ? config.city + ', ' : ''}${config.province}
- Building Code: ${provinceCode}
- Occupancy Group: ${group}
- Total Area: ${config.area_sqft} SF (${Math.round(config.area_sqft * 0.092903)} m²)
- Space: ${config.existing_space ? 'Existing tenant improvement' : 'New construction'}
${config.address ? `- Address: ${config.address}` : ''}

USER-PROVIDED ROOMS (${totalProgrammed} SF programmed of ${config.area_sqft} SF available):
${userRooms.map(r => `- ${r.name}: ${r.quantity}x @ ${r.area_sqft ?? 100} SF each`).join('\n')}

DEFAULT ROOM TEMPLATE (for reference):
${defaultRooms.map(r => `- ${r.name}: ${r.quantity}x @ ${r.area_sqft} SF`).join('\n')}

RESPOND WITH EXACTLY THIS JSON STRUCTURE:
{
  "room_program": [
    {
      "room_name": "string (use user's room names, optimize sizes if needed)",
      "quantity": number,
      "area_sqft": number (per unit, optimized for the total area),
      "total_sqft": number (area_sqft * quantity),
      "notes": "string (practical architectural notes for this room type)"
    }
  ],
  "adjacencies": [
    {
      "room_a": "string (exact room name from room_program)",
      "room_b": "string (exact room name from room_program)",
      "priority": "required" | "preferred" | "avoid",
      "reason": "string (workflow-based justification)"
    }
  ],
  "compliance_checklist": [
    {
      "category": "string",
      "requirement": "string (specific to this project)",
      "code_reference": "string (actual code section)",
      "status": "met" | "review" | "action_required"
    }
  ],
  "risks": [
    {
      "severity": "low" | "medium" | "high",
      "description": "string (specific to this project's constraints)",
      "mitigation": "string (actionable recommendation)"
    }
  ],
  "code_analysis": {
    "occupancy_classification": "string (Group + description)",
    "construction_type": "string",
    "fire_rating": "string",
    "sprinkler_required": boolean,
    "barrier_free_required": boolean
  },
  "layout_hints": {
    "corridor_type": "single" | "double" (single if <1500 SF, double otherwise),
    "zone_placement": "string (describe ideal zone layout)",
    "flow_notes": "string (patient/staff workflow description)"
  }
}

RULES:
- Total room_program areas must not exceed ${config.area_sqft} SF (leave 20-30% for circulation)
- Use the user's room names exactly when possible
- Adjacencies must reference exact room_name values from room_program
- Compliance items must cite actual ${provinceCode} code sections
- Include at least 6-8 compliance items covering: occupancy, exits, barrier-free, fire, washrooms, ventilation
- Include at least 3-5 risks specific to this project
- Return ONLY valid JSON, no other text`;
}

// ── Main AI call ──────────────────────────────────────────

export async function generateWithAI(config: {
  clinic_type: string;
  province: string;
  city: string;
  area_sqft: number;
  rooms_json: RoomConfig[];
  existing_space: boolean;
  address: string;
}): Promise<AIGenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: buildSystemPrompt(),
    messages: [
      { role: 'user', content: buildUserPrompt(config) },
    ],
  });

  // Extract text content
  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse JSON — handle potential markdown code blocks
  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Failed to parse AI response as JSON: ${(e as Error).message}`);
  }

  // Validate with Zod
  const result = AIResponseSchema.parse(parsed);
  return result as AIGenerationResult;
}

export function isAIEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
