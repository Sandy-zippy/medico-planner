import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'svg', 'dwg']);
const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf'];
const ALLOWED_CATEGORIES = new Set(['floorplan', 'logo', 'inspiration']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const category = formData.get("category") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  // Validate file extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  // Validate MIME type
  if (!ALLOWED_MIME_PREFIXES.some(p => file.type.startsWith(p))) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // Sanitize category
  const prefix = ALLOWED_CATEGORIES.has(category ?? '') ? category : 'upload';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = user ? supabase : createServiceClient();
  const userId = user?.id ?? "00000000-0000-0000-0000-000000000000";

  const path = `${userId}/${prefix}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await db.storage
    .from("project-uploads")
    .upload(path, buffer, { contentType: file.type });

  if (error) {
    console.error("Upload failed:", error.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const { data } = db.storage.from("project-uploads").getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl, category: prefix });
}
