import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Maximize2 } from "lucide-react";
import { PROJECT_STATUS_COLORS, getClinicLabel } from "@/lib/constants";
import { FloorPlanThumbnail } from "@/components/project/floor-plan-thumbnail";
import type { Project, Generation, FloorPlanGeometry } from "@/types";

export default async function DashboardPage() {
  // Use service client to bypass RLS (no auth required)
  const db = createServiceClient();

  // Fetch projects with their latest completed generation
  const { data: projects } = await db
    .from("projects")
    .select("*, generations(id, version, output_json, status)")
    .order("created_at", { ascending: false });

  const typedProjects = (projects ?? []) as (Project & {
    generations: Pick<Generation, "id" | "version" | "output_json" | "status">[];
  })[];

  // Extract latest completed generation's floor plan per project
  const projectsWithThumbnails = typedProjects.map(p => {
    const completedGens = (p.generations ?? [])
      .filter(g => g.status === "completed" || !g.status)
      .sort((a, b) => b.version - a.version);
    const latestGen = completedGens[0];
    const floorPlan: FloorPlanGeometry | undefined = latestGen?.output_json?.floor_plan;
    return { ...p, floorPlan, latestVersion: latestGen?.version };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Projects</h1>
          <p className="text-sm text-stone-500 mt-1">
            {typedProjects.length === 0
              ? "Create your first project to get started"
              : `${typedProjects.length} project${typedProjects.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/app/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </Link>
      </div>

      {typedProjects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="font-semibold text-stone-900 mb-1">No projects yet</h3>
            <p className="text-sm text-stone-500 mb-6">
              Create a new project to start planning your clinic space.
            </p>
            <Link href="/app/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Create Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsWithThumbnails.map((project) => (
            <Link key={project.id} href={`/app/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full overflow-hidden">
                {/* Thumbnail */}
                <div className="aspect-[16/10] bg-stone-50 border-b border-stone-100 overflow-hidden">
                  {project.floorPlan ? (
                    <FloorPlanThumbnail floorPlan={project.floorPlan} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Building2 className="w-8 h-8 text-stone-200" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-stone-900 text-sm">
                      {getClinicLabel(project.clinic_type)}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {project.latestVersion && (
                        <Badge variant="secondary" className="text-[10px] bg-stone-100 text-stone-500">
                          v{project.latestVersion}
                        </Badge>
                      )}
                      <Badge variant="secondary" className={`text-[10px] ${PROJECT_STATUS_COLORS[project.status] ?? ""}`}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-xs text-stone-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {project.city ? `${project.city}, ${project.province}` : project.province}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-3 h-3" />
                      {project.area_sqft.toLocaleString()} SF
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
