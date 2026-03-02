import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch generation + verify ownership via project
  const { data: generation } = await supabase
    .from('generations')
    .select('id, project_id, output_json')
    .eq('id', id)
    .single();

  if (!generation) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', generation.project_id)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();
  const { output_json } = body;

  if (!output_json) {
    return NextResponse.json({ error: 'output_json required' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('generations')
    .update({ output_json })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
