import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getAuthenticatedUser } from "@/lib/auth-helper";
import type { Database } from "@menucast/supabase";

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const supabase = getSupabaseAdminClient();
  const userId = await getAuthenticatedUser(req, supabase);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch group
  const { data: group, error: groupError } = await supabase
    .from("screen_groups")
    .select("*")
    .eq("id", groupId)
    .eq("user_id", userId)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Screen group not found" }, { status: 404 });
  }

  // 2. Fetch memberships
  const { data: memberships } = await supabase
    .from("tv_group_memberships")
    .select("tv_id")
    .eq("group_id", groupId);

  const tvIds = memberships?.map((m) => m.tv_id) || [];
  let members: Array<{
    id: string;
    name: string;
    screen_width: number | null;
    screen_height: number | null;
    aspect_ratio: string | null;
    orientation: string | null;
    current_menu_url: string | null;
    paired_at: string | null;
  }> = [];

  if (tvIds.length > 0) {
    const { data: tvs } = await supabase
      .from("tvs")
      .select("id, name, screen_width, screen_height, aspect_ratio, orientation, current_menu_url, paired_at")
      .in("id", tvIds)
      .eq("user_id", userId);

    if (tvs) {
      members = tvs.map((tv) => ({
        id: tv.id,
        name: tv.name,
        screen_width: tv.screen_width ?? null,
        screen_height: tv.screen_height ?? null,
        aspect_ratio: tv.aspect_ratio ?? null,
        orientation: tv.orientation ?? null,
        current_menu_url: tv.current_menu_url ?? null,
        paired_at: tv.paired_at ?? null,
      }));
    }
  }

  return NextResponse.json({
    group: {
      ...group,
      members,
      member_count: members.length,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const supabase = getSupabaseAdminClient();
  const userId = await getAuthenticatedUser(req, supabase);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check group ownership
  const { data: existingGroup, error: findError } = await supabase
    .from("screen_groups")
    .select("id")
    .eq("id", groupId)
    .eq("user_id", userId)
    .single();

  if (findError || !existingGroup) {
    return NextResponse.json({ error: "Screen group not found" }, { status: 404 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { name, description, color } = body || {};

  type ScreenGroupUpdate = Database["public"]["Tables"]["screen_groups"]["Update"];
  const updates: ScreenGroupUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Group name cannot be empty" }, { status: 400 });
    }
    updates.name = name.trim();
  }

  if (description !== undefined) {
    updates.description = typeof description === "string" ? description.trim() : null;
  }

  if (color !== undefined) {
    updates.color = typeof color === "string" && color.trim() ? color.trim() : null;
  }

  const { data: updatedGroup, error: updateError } = await supabase
    .from("screen_groups")
    .update(updates)
    .eq("id", groupId)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError || !updatedGroup) {
    return NextResponse.json({ error: updateError?.message || "Failed to update group" }, { status: 500 });
  }

  return NextResponse.json({ group: updatedGroup });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const supabase = getSupabaseAdminClient();
  const userId = await getAuthenticatedUser(req, supabase);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify group belongs to user
  const { data: existingGroup, error: findError } = await supabase
    .from("screen_groups")
    .select("id")
    .eq("id", groupId)
    .eq("user_id", userId)
    .single();

  if (findError || !existingGroup) {
    return NextResponse.json({ error: "Screen group not found" }, { status: 404 });
  }

  // Delete memberships first (if not cascading on foreign key in all DB environments)
  await supabase
    .from("tv_group_memberships")
    .delete()
    .eq("group_id", groupId);

  // Delete screen group
  const { error: deleteError } = await supabase
    .from("screen_groups")
    .delete()
    .eq("id", groupId)
    .eq("user_id", userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted_id: groupId });
}
