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
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
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
  // New optional sections
  room_schedule?: RoomScheduleEntry[];
  detailed_code_analysis?: DetailedCodeAnalysis;
  equipment_schedule?: EquipmentItem[];
  finish_schedule?: FinishScheduleEntry[];
  wall_types?: WallType[];
  door_schedule?: DoorScheduleEntry[];
  plumbing_legend?: PlumbingFixture[];
  scope_of_work?: string[];
  drawing_list?: DrawingListEntry[];
  floor_plan?: FloorPlanGeometry;
  scene_3d?: Scene3DData;
  cover_sheet?: CoverSheet;
  ceiling_plan?: CeilingPlan;
  electrical_plan?: MEPLayout;
  plumbing_plan?: MEPLayout;
  hvac_plan?: MEPLayout;
}

export interface CoverSheet {
  project_name: string;
  address: string;
  building_type: string;
  project_type: string;
  total_area_sqft: number;
  total_area_m2: number;
  room_count: number;
  applicable_codes: string[];
  drawing_index: DrawingListEntry[];
  owner: string;
  architect: string;
  date: string;
}

export interface CeilingPlan {
  ceiling_type: string;
  grid_module: string;
  rooms: CeilingPlanRoom[];
}

export interface CeilingPlanRoom {
  room_number: string;
  room_name: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  ceiling_type: 'tbar' | 'drywall' | 'mixed';
  ceiling_height_ft: number;
  light_fixtures: { x: number; y: number; type: string }[];
  diffusers: { x: number; y: number }[];
  sprinklers: { x: number; y: number }[];
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

export interface RoomScheduleEntry {
  room_number: string;
  room_name: string;
  quantity: number;
  area_sqft: number;
  area_m2: number;
  total_sqft: number;
  total_m2: number;
  finish_code: string;
  equipment_refs: string[];
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

// Detailed Building Code Analysis — matches real BCBC/OBC sheets
export interface DetailedCodeAnalysis {
  project_info: {
    address: string;
    permit_type: string;
    zoning: string;
    applicable_code: string;
    clinic_type: string;
  };
  building_description: {
    gross_area_m2: number;
    gross_area_sqft: number;
    num_storeys: number;
    construction_type: string;
    existing_or_new: string;
  };
  occupancy: {
    classification: string;
    nbc_section: string;
    description: string;
  };
  fire_ratings: {
    floor_assembly: string;
    roof_assembly: string;
    load_bearing: string;
    exit_corridor: string;
    suite_separation: string;
  };
  spatial_separation: {
    north: string;
    south: string;
    east: string;
    west: string;
  };
  occupant_load: {
    area_m2: number;
    factor_m2_per_person: number;
    occupant_count: number;
    male_count: number;
    female_count: number;
  };
  washroom_calc: {
    male_required: number;
    female_required: number;
    accessible_required: number;
    male_provided: number;
    female_provided: number;
    accessible_provided: number;
  };
  exit_requirements: {
    min_exits: number;
    corridor_width_mm: number;
    max_travel_distance_m: number;
    door_min_width_mm: number;
    headroom_mm: number;
  };
  accessibility: {
    barrier_free_entrance: boolean;
    barrier_free_path: boolean;
    power_door_operator: boolean;
    tactile_signage: boolean;
    accessible_washroom: boolean;
  };
  interior_finishes: {
    flame_spread_rating: string;
    smoke_classification: string;
  };
  fire_protection: {
    alarm_type: string;
    sprinklers: string;
    smoke_detectors: string;
    standpipe: string;
  };
}

// Equipment Schedule
export interface EquipmentItem {
  id: string;
  name: string;
  room: string;
  quantity: number;
  hot_water: boolean;
  cold_water: boolean;
  drain: boolean;
  gas: boolean;
  dedicated_circuit: boolean;
  standard_outlet: boolean;
  data: boolean;
  mechanical_vent: boolean;
  notes: string;
}

// Finish Schedule
export interface FinishScheduleEntry {
  room_name: string;
  finish_code: string;
  wall: string;
  floor: string;
  ceiling: string;
  base: string;
  countertop: string;
  cabinet: string;
}

// Wall / Partition Types
export interface WallType {
  type_code: string;
  description: string;
  stud_size: string;
  layers: string;
  insulation: string;
  fire_rating: string;
  stc_rating: number;
  use_locations: string[];
}

// Door Schedule
export interface DoorScheduleEntry {
  mark: string;
  location: string;
  width_mm: number;
  height_mm: number;
  type: string;
  fire_rating: string;
  hardware: string;
  notes: string;
}

// Plumbing Legend
export interface PlumbingFixture {
  mark: string;
  fixture_type: string;
  model_reference: string;
  hot_water: boolean;
  cold_water: boolean;
  drain: boolean;
  gas: boolean;
  notes: string;
}

// Drawing List
export interface DrawingListEntry {
  drawing_number: string;
  title: string;
  discipline: string;
}

// Floor Plan Geometry
export interface FloorPlanGeometry {
  envelope: { width: number; depth: number; total_area: number };
  corridor: { x: number; y: number; width: number; depth: number };
  corridor_segments?: { x: number; y: number; width: number; depth: number }[];
  layout_type?: 'straight' | 'L';
  rooms: FloorPlanRoom[];
  walls: WallSegment[];
  doors: DoorPlacement[];
  dimensions: DimensionAnnotation[];
}

export interface FloorPlanRoom {
  room_number: string;
  room_name: string;
  x: number; y: number; width: number; depth: number;
  area_actual: number;
  area_programmed: number;
  finish_code: string;
  zone: 'public' | 'clinical' | 'support' | 'staff' | 'service';
  side: 'left' | 'right' | 'front' | 'full_width';
}

export interface WallSegment {
  id: string;
  x1: number; y1: number; x2: number; y2: number;
  wall_type: string;
  thickness_inches: number;
}

export interface DoorPlacement {
  mark: string;
  room_name: string;
  x: number; y: number;
  width_ft: number;
  orientation: 'horizontal' | 'vertical';
  swing: 'in' | 'out' | 'sliding';
  swing_direction: 'left' | 'right';
}

export interface DimensionAnnotation {
  label: string;
  x1: number; y1: number; x2: number; y2: number;
  offset: number;
  type: 'overall' | 'room' | 'corridor';
}

// ── 3D Scene Data ─────────────────────────────────────────

export interface Scene3DData {
  walls: Wall3D[];
  floors: Floor3D[];
  doors: Door3D[];
  labels: Room3DLabel[];
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  bounds: {
    width: number; // meters
    depth: number; // meters
  };
}

export interface Wall3D {
  id: string;
  position: [number, number, number]; // center x, y, z
  size: [number, number, number]; // width, height, depth
  color: string;
  wall_type: string;
}

export interface Floor3D {
  room_number: string;
  room_name: string;
  position: [number, number, number];
  size: [number, number]; // width, depth
  color: string;
  finish_code: string;
}

export interface Door3D {
  mark: string;
  position: [number, number, number];
  size: [number, number]; // width, height
  rotation: number; // radians around Y axis
}

export interface Room3DLabel {
  room_number: string;
  room_name: string;
  position: [number, number, number];
}

// ── MEP Layout Types ─────────────────────────────────────

export interface MEPSymbol {
  x: number;
  y: number;
  type: string;
  label?: string;
}

export interface MEPRun {
  points: { x: number; y: number }[];
  type: 'hot' | 'cold' | 'waste' | 'circuit' | 'duct';
}

export interface MEPLayout {
  symbols: MEPSymbol[];
  runs: MEPRun[];
  panel_location?: { x: number; y: number };
  legend: { symbol: string; description: string }[];
}

// ── AI Generation Result ──────────────────────────────────

export interface AIGenerationResult {
  room_program: RoomProgramEntry[];
  adjacencies: Adjacency[];
  compliance_checklist: ComplianceItem[];
  risks: RiskItem[];
  code_analysis: CodeAnalysis;
  layout_hints?: {
    corridor_type: 'single' | 'double' | 'L' | 'loop';
    zone_placement: string;
    flow_notes: string;
  };
}
