import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Maximize2, Calendar } from "lucide-react";
import { PROJECT_STATUS_COLORS, getClinicLabel } from "@/lib/constants";
import type { Project } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const typedProjects = (projects ?? []) as Project[];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">
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
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">No projects yet</h3>
            <p className="text-sm text-slate-500 mb-6">
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
          {typedProjects.map((project) => (
            <Link key={project.id} href={`/app/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-slate-600" />
                    </div>
                    <Badge variant="secondary" className={PROJECT_STATUS_COLORS[project.status] ?? ""}>
                      {project.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {getClinicLabel(project.clinic_type)}
                  </h3>
                  <div className="space-y-1 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {project.city ? `${project.city}, ${project.province}` : project.province}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5" />
                      {project.area_sqft.toLocaleString()} SF
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(project.created_at).toLocaleDateString()}
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
