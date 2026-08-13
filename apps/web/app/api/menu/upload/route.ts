import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { tv_id, file_name, content_type } = await req.json();

  // Verify TV belongs to user
  const { data: tv } = await supabase
    .from("tvs")
    .select("id")
    .eq("id", tv_id)
    .eq("user_id", session.user.id)
    .single();

  if (!tv) {
    return NextResponse.json({ error: "TV not found" }, { status: 404 });
  }

  const path = `${session.user.id}/${tv_id}/${Date.now()}-${file_name}`;

  const { data, error } = await supabase.storage
    .from("menus")
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publicUrl = supabase.storage.from("menus").getPublicUrl(path).data.publicUrl;

  return NextResponse.json({
    upload_url: data.signedUrl,
    token: data.token,
    path,
    public_url: publicUrl,
  });
}
