import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const body = await request.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // DEV MODE: use service client when no authenticated user
  const db = user ? supabase : createServiceClient();
  const userId = user?.id ?? "87130783-394d-4a14-8a67-aee70c1e3393";

  // Whitelist allowed fields — prevent mass assignment
  const { data, error } = await db
    .from("projects")
    .insert({
      user_id: userId,
      clinic_type: body.clinic_type,
      province: body.province,
      city: body.city ?? '',
      area_sqft: typeof body.area_sqft === 'number' ? body.area_sqft : parseInt(body.area_sqft) || 0,
      budget_range: body.budget_range,
      timeline: body.timeline,
      rooms_json: Array.isArray(body.rooms_json) ? body.rooms_json : [],
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 5000) : '',
      existing_space: !!body.existing_space,
      address: typeof body.address === 'string' ? body.address.slice(0, 500) : '',
      building_type: body.building_type ?? null,
      ceiling_type: body.ceiling_type ?? 'tbar',
      soundproof: !!body.soundproof,
      plumbing_fixtures: body.plumbing_fixtures ?? {},
      equipment_notes: typeof body.equipment_notes === 'string' ? body.equipment_notes.slice(0, 2000) : '',
      upload_urls: Array.isArray(body.upload_urls) ? body.upload_urls : [],
      logo_url: typeof body.logo_url === 'string' ? body.logo_url : null,
      inspiration_urls: Array.isArray(body.inspiration_urls) ? body.inspiration_urls : [],
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    console.error("Project creation failed:", error.message);
    return NextResponse.json({ error: "Failed to create project" }, { status: 400 });
  }

  return NextResponse.json(data);
}
