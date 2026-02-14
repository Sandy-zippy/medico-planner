import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateMockOutput } from '@/lib/mock-engine';
import type { Project } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const typedProject = project as Project;

  // Get current max version
  const { data: latestGen } = await supabase
    .from('generations')
    .select('version')
    .eq('project_id', id)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latestGen?.version ?? 0) + 1;

  // Generate mock output
  const output_json = generateMockOutput({
    clinic_type: typedProject.clinic_type,
    province: typedProject.province,
    city: typedProject.city,
    area_sqft: typedProject.area_sqft,
    rooms_json: typedProject.rooms_json ?? [],
  });

  // Insert generation
  const { data: generation, error } = await supabase
    .from('generations')
    .insert({
      project_id: id,
      version: nextVersion,
      output_json,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update project status
  await supabase
    .from('projects')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', id);

  return NextResponse.json(generation);
}
