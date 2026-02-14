"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, CheckCircle2, XCircle } from "lucide-react";
import type { OutputJSON } from "@/types";

function Row({ label, value }: { label: string; value: string | number | boolean }) {
  const display = typeof value === 'boolean'
    ? (value ? <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /> : <XCircle className="w-4 h-4 text-stone-300 inline" />)
    : String(value);

  return (
    <div className="flex justify-between py-1.5 border-b border-stone-50 last:border-0">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{display}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">{title}</h4>
      <div>{children}</div>
    </div>
  );
}

export function CodeAnalysisTab({ output }: { output: OutputJSON }) {
  const dca = output.detailed_code_analysis;

  // Fallback to basic code_analysis if no detailed version
  if (!dca) {
    const ca = output.code_analysis;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" /> Code Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Classification" value={ca.occupancy_classification} />
          <Row label="Construction Type" value={ca.construction_type} />
          <Row label="Fire Rating" value={ca.fire_rating} />
          <Row label="Sprinkler Required" value={ca.sprinkler_required ? "Yes" : "No"} />
          <Row label="Barrier-Free" value={ca.barrier_free_required ? "Required" : "Not Required"} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" /> Building Code Analysis
          </CardTitle>
          <p className="text-xs text-stone-400">Per {dca.project_info.applicable_code}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Section title="Project Information">
            <Row label="Address" value={dca.project_info.address} />
            <Row label="Permit Type" value={dca.project_info.permit_type} />
            <Row label="Zoning" value={dca.project_info.zoning} />
            <Row label="Applicable Code" value={dca.project_info.applicable_code} />
            <Row label="Clinic Type" value={dca.project_info.clinic_type} />
          </Section>

          <Separator />

          <Section title="Building Description">
            <Row label="Gross Area" value={`${dca.building_description.gross_area_sqft.toLocaleString()} SF (${dca.building_description.gross_area_m2} m²)`} />
            <Row label="Storeys" value={dca.building_description.num_storeys} />
            <Row label="Construction Type" value={dca.building_description.construction_type} />
            <Row label="Existing / New" value={dca.building_description.existing_or_new} />
          </Section>

          <Separator />

          <Section title="Occupancy Classification">
            <Row label="Classification" value={dca.occupancy.classification} />
            <Row label="Code Section" value={dca.occupancy.nbc_section} />
            <Row label="Description" value={dca.occupancy.description} />
          </Section>

          <Separator />

          <Section title="Fire Ratings">
            <Row label="Floor Assembly" value={dca.fire_ratings.floor_assembly} />
            <Row label="Roof Assembly" value={dca.fire_ratings.roof_assembly} />
            <Row label="Load-Bearing" value={dca.fire_ratings.load_bearing} />
            <Row label="Exit Corridor" value={dca.fire_ratings.exit_corridor} />
            <Row label="Suite Separation" value={dca.fire_ratings.suite_separation} />
          </Section>

          <Separator />

          <Section title="Spatial Separation">
            <Row label="North" value={dca.spatial_separation.north} />
            <Row label="South" value={dca.spatial_separation.south} />
            <Row label="East" value={dca.spatial_separation.east} />
            <Row label="West" value={dca.spatial_separation.west} />
          </Section>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="Occupant Load Calculation">
              <Row label="Area" value={`${dca.occupant_load.area_m2} m²`} />
              <Row label="Factor" value={`${dca.occupant_load.factor_m2_per_person} m²/person`} />
              <Row label="Occupant Count" value={dca.occupant_load.occupant_count} />
              <Row label="Male" value={dca.occupant_load.male_count} />
              <Row label="Female" value={dca.occupant_load.female_count} />
            </Section>

            <Section title="Washroom Calculation">
              <Row label="Male Required" value={dca.washroom_calc.male_required} />
              <Row label="Female Required" value={dca.washroom_calc.female_required} />
              <Row label="Accessible Required" value={dca.washroom_calc.accessible_required} />
              <Row label="Male Provided" value={dca.washroom_calc.male_provided} />
              <Row label="Female Provided" value={dca.washroom_calc.female_provided} />
              <Row label="Accessible Provided" value={dca.washroom_calc.accessible_provided} />
            </Section>
          </div>

          <Separator />

          <Section title="Exit Requirements">
            <Row label="Minimum Exits" value={dca.exit_requirements.min_exits} />
            <Row label="Corridor Width" value={`${dca.exit_requirements.corridor_width_mm} mm`} />
            <Row label="Max Travel Distance" value={`${dca.exit_requirements.max_travel_distance_m} m`} />
            <Row label="Door Min Width" value={`${dca.exit_requirements.door_min_width_mm} mm`} />
            <Row label="Headroom" value={`${dca.exit_requirements.headroom_mm} mm`} />
          </Section>

          <Separator />

          <Section title="Accessibility">
            <Row label="Barrier-Free Entrance" value={dca.accessibility.barrier_free_entrance} />
            <Row label="Barrier-Free Path" value={dca.accessibility.barrier_free_path} />
            <Row label="Power Door Operator" value={dca.accessibility.power_door_operator} />
            <Row label="Tactile Signage" value={dca.accessibility.tactile_signage} />
            <Row label="Accessible Washroom" value={dca.accessibility.accessible_washroom} />
          </Section>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="Interior Finishes">
              <Row label="Flame Spread" value={dca.interior_finishes.flame_spread_rating} />
              <Row label="Smoke Dev." value={dca.interior_finishes.smoke_classification} />
            </Section>

            <Section title="Fire Protection">
              <Row label="Alarm Type" value={dca.fire_protection.alarm_type} />
              <Row label="Sprinklers" value={dca.fire_protection.sprinklers} />
              <Row label="Smoke Detectors" value={dca.fire_protection.smoke_detectors} />
              <Row label="Standpipe" value={dca.fire_protection.standpipe} />
            </Section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
