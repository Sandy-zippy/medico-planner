import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const body = await request.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // DEV MODE: use service client when no authenticated user
  const db = user ? supabase : createServiceClient();
  const userId = user?.id ?? "00000000-0000-0000-0000-000000000000";

  const { data, error } = await db
    .from("projects")
    .insert({ ...body, user_id: userId })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
