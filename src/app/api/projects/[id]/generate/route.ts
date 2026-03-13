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
      building_type: project.building_type ?? 'stand_alone',
      ceiling_type: project.ceiling_type ?? 'tbar',
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
  // DEV MODE: use service client when no authenticated user
  const db = user ? supabase : createServiceClient();

  // Always scope by user_id when authenticated
  const query = db.from('projects').select('*').eq('id', id);
  if (user) query.eq('user_id', user.id);
  const { data: project } = await query.single();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const typedProject = project as Project;

  // Rate limit: block if there's already a pending/processing generation
  const { data: activeGen } = await db
    .from('generations')
    .select('id')
    .eq('project_id', id)
    .in('status', ['pending', 'processing'])
    .limit(1)
    .maybeSingle();

  if (activeGen) {
    return NextResponse.json({ error: 'Generation already in progress' }, { status: 429 });
  }

  // Get current max version
  const { data: latestGen } = await db
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
    const { data: generation, error } = await db
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
      console.error('Generation insert failed:', error.message);
      return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 });
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
      building_type: typedProject.building_type ?? 'stand_alone',
      ceiling_type: typedProject.ceiling_type ?? 'tbar',
    });

    const { data: generation, error } = await db
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
      console.error('Generation insert failed:', error.message);
      return NextResponse.json({ error: 'Failed to save generation' }, { status: 500 });
    }

    // Update project status
    await db
      .from('projects')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json(generation);
  }
}
