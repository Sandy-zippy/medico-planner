import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; genId: string }> }
) {
  const { id, genId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Fetch generation
  const { data: generation, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', genId)
    .eq('project_id', id)
    .single();

  if (error || !generation) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
  }

  return NextResponse.json(generation);
}
