export interface Project {
  id: string;
  user_id: string;
  clinic_type: string;
  province: string;
  city: string;
  area_sqft: number;
  budget_range: string;
  timeline: string;
  rooms_json: RoomConfig[];
  notes: string;
  upload_urls: string[];
  existing_space: boolean;
  address: string;
  status: 'draft' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface RoomConfig {
  name: string;
  quantity: number;
  area_sqft?: number;
}

export interface Generation {
  id: string;
  project_id: string;
  version: number;
  output_json: OutputJSON;
  created_at: string;
}

export interface OutputJSON {
  summary: ProjectSummary;
  room_program: RoomProgramEntry[];
  adjacencies: Adjacency[];
  compliance_checklist: ComplianceItem[];
  risks: RiskItem[];
  next_steps: string[];
  code_analysis: CodeAnalysis;
}

export interface ProjectSummary {
  clinic_type: string;
  province: string;
  city: string;
  total_area_sqft: number;
  occupancy_load: number;
  required_exits: number;
  required_washrooms: number;
  building_code: string;
  occupancy_group: string;
}

export interface RoomProgramEntry {
  room_name: string;
  quantity: number;
  area_sqft: number;
  total_sqft: number;
  notes: string;
}

export interface Adjacency {
  room_a: string;
  room_b: string;
  priority: 'required' | 'preferred' | 'avoid';
  reason: string;
}

export interface ComplianceItem {
  category: string;
  requirement: string;
  code_reference: string;
  status: 'met' | 'review' | 'action_required';
}

export interface RiskItem {
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string;
}

export interface CodeAnalysis {
  occupancy_classification: string;
  construction_type: string;
  fire_rating: string;
  sprinkler_required: boolean;
  barrier_free_required: boolean;
}
