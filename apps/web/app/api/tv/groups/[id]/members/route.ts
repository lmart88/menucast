import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getAuthenticatedUser } from "@/lib/auth-helper";

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const supabase = getSupabaseAdminClient();
  const userId = await getAuthenticatedUser(req, supabase);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Verify group ownership
  const { data: group, error: groupError } = await supabase
    .from("screen_groups")
    .select("id")
    .eq("id", groupId)
    .eq("user_id", userId)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Screen group not found" }, { status: 404 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { tv_ids } = body || {};

  if (!Array.isArray(tv_ids) || tv_ids.length === 0) {
    return NextResponse.json({ error: "tv_ids array is required and must not be empty" }, { status: 400 });
  }

  // 2. Verify TV ownership
  const { data: userTvs, error: tvsError } = await supabase
    .from("tvs")
    .select("id")
    .in("id", tv_ids)
    .eq("user_id", userId);

  if (tvsError) {
    return NextResponse.json({ error: tvsError.message }, { status: 500 });
  }

  const validTvIds = (userTvs || []).map((t) => t.id);
  if (validTvIds.length === 0) {
    return NextResponse.json({ error: "None of the specified TVs belong to this user" }, { status: 400 });
  }

  // 3. Find existing memberships to avoid duplicates
  const { data: existingMemberships } = await supabase
    .from("tv_group_memberships")
    .select("tv_id")
    .eq("group_id", groupId);

  const existingSet = new Set((existingMemberships || []).map((m) => m.tv_id));
  const newTvIdsToInsert = validTvIds.filter((tvId) => !existingSet.has(tvId));

  if (newTvIdsToInsert.length > 0) {
    const rowsToInsert = newTvIdsToInsert.map((tvId) => ({
      group_id: groupId,
      tv_id: tvId,
    }));

    const { error: insertError } = await supabase
      .from("tv_group_memberships")
      .insert(rowsToInsert);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // 4. Return current complete member list
  const { data: allMemberships } = await supabase
    .from("tv_group_memberships")
    .select("tv_id")
    .eq("group_id", groupId);

  const currentMemberTvIds = (allMemberships || []).map((m) => m.tv_id);

  return NextResponse.json({
    success: true,
    group_id: groupId,
    added_tv_ids: newTvIdsToInsert,
    tv_ids: currentMemberTvIds,
    member_count: currentMemberTvIds.length,
  });
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

  // 1. Verify group ownership
  const { data: group, error: groupError } = await supabase
    .from("screen_groups")
    .select("id")
    .eq("id", groupId)
    .eq("user_id", userId)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Screen group not found" }, { status: 404 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { tv_ids } = body || {};

  if (!Array.isArray(tv_ids) || tv_ids.length === 0) {
    return NextResponse.json({ error: "tv_ids array is required and must not be empty" }, { status: 400 });
  }

  // 2. Remove specified memberships
  const { error: deleteError } = await supabase
    .from("tv_group_memberships")
    .delete()
    .eq("group_id", groupId)
    .in("tv_id", tv_ids);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // 3. Return remaining members
  const { data: remainingMemberships } = await supabase
    .from("tv_group_memberships")
    .select("tv_id")
    .eq("group_id", groupId);

  const remainingTvIds = (remainingMemberships || []).map((m) => m.tv_id);

  return NextResponse.json({
    success: true,
    group_id: groupId,
    removed_tv_ids: tv_ids,
    tv_ids: remainingTvIds,
    member_count: remainingTvIds.length,
  });
}
