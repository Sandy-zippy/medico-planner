import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Project, Generation } from "@/types";
import { ProjectDetail } from "@/components/project/project-detail";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = user ? supabase : createServiceClient();

  const { data: project } = await db
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const { data: generations } = await db
    .from("generations")
    .select("*")
    .eq("project_id", id)
    .order("version", { ascending: false });

  return (
    <ProjectDetail
      project={project as Project}
      generations={(generations ?? []) as Generation[]}
    />
  );
}
