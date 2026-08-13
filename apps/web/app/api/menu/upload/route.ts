import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

async function getUserFromToken(token: string, supabase: ReturnType<typeof createClient<Database>>) {
  const { data } = await supabase
    .from("api_tokens")
    .select("user_id")
    .eq("token", token)
    .single();

  if (data) {
    await supabase
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("token", token);
  }

  return data?.user_id ?? null;
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    userId = await getUserFromToken(authHeader.slice(7), supabase);
  } else {
    const session = await auth();
    userId = session?.user?.id ?? null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tv_id, file_name } = await req.json();

  // Verify TV belongs to user
  const { data: tv } = await supabase
    .from("tvs")
    .select("id")
    .eq("id", tv_id)
    .eq("user_id", userId)
    .single();

  if (!tv) {
    return NextResponse.json({ error: "TV not found" }, { status: 404 });
  }

  const path = `${userId}/${tv_id}/${Date.now()}-${file_name}`;

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
