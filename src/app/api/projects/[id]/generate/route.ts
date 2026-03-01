import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAIEnabled } from '@/lib/claude-client';
import { generateOutput } from '@/lib/ai-engine';
import { generateMockOutput } from '@/lib/mock-engine';
import { createServiceClient } from '@/lib/supabase/service';
import type { Project } from '@/types';

/**
 * Background generation function.
 * Runs after HTTP response is sent. Uses service-role client
 * because the cookie-based client is no longer valid.
 */
async function generateAndStore(
  generationId: string,
  project: Project,
) {
  let serviceClient: ReturnType<typeof createServiceClient>;
  try {
    serviceClient = createServiceClient();
  } catch {
    // If service client isn't configured, generation stays pending
    // (will be caught by client polling as stale)
    console.error('Service client not configured for background generation');
    return;
  }

  try {
    // Update status to processing
    await serviceClient
      .from('generations')
      .update({ status: 'processing' })
      .eq('id', generationId);

    // Run the generation pipeline
    const output_json = await generateOutput({
      clinic_type: project.clinic_type,
      province: project.province,
      city: project.city,
      area_sqft: project.area_sqft,
      rooms_json: project.rooms_json ?? [],
      existing_space: project.existing_space ?? true,
      address: project.address ?? '',
    });

    // Store completed result
    await serviceClient
      .from('generations')
      .update({
        output_json,
        status: 'completed',
      })
      .eq('id', generationId);

    // Update project status
    await serviceClient
      .from('projects')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', project.id);

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Generation failed:', message);

    try {
      await serviceClient
        .from('generations')
        .update({ status: 'failed', error_message: message })
        .eq('id', generationId);
    } catch {
      console.error('Failed to update generation status to failed');
    }
  }
}

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

  const useAI = isAIEnabled();

  if (useAI) {
    // ── Async AI pipeline ──
    // Insert generation as pending, return immediately, process in background
    const { data: generation, error } = await supabase
      .from('generations')
      .insert({
        project_id: id,
        version: nextVersion,
        output_json: {},
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fire background generation (not awaited)
    generateAndStore(generation.id, typedProject).catch(console.error);

    return NextResponse.json({
      id: generation.id,
      version: generation.version,
      status: 'pending',
    });
  } else {
    // ── Synchronous mock pipeline (existing behavior) ──
    const output_json = generateMockOutput({
      clinic_type: typedProject.clinic_type,
      province: typedProject.province,
      city: typedProject.city,
      area_sqft: typedProject.area_sqft,
      rooms_json: typedProject.rooms_json ?? [],
      existing_space: typedProject.existing_space ?? true,
      address: typedProject.address ?? '',
    });

    const { data: generation, error } = await supabase
      .from('generations')
      .insert({
        project_id: id,
        version: nextVersion,
        output_json,
        status: 'completed',
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
}
