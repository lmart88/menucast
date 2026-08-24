import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getAuthenticatedUser } from "@/lib/auth-helper";

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const userId = await getAuthenticatedUser(req, supabase);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all groups owned by the user
  const { data: groups, error: groupsError } = await supabase
    .from("screen_groups")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (groupsError) {
    return NextResponse.json({ error: groupsError.message }, { status: 500 });
  }

  if (!groups || groups.length === 0) {
    return NextResponse.json({ groups: [] });
  }

  const groupIds = groups.map((g) => g.id);

  // Fetch all memberships for these groups
  const { data: memberships, error: memberError } = await supabase
    .from("tv_group_memberships")
    .select("group_id, tv_id")
    .in("group_id", groupIds);

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Fetch TV details for these memberships
  const tvIds = Array.from(new Set(memberships?.map((m) => m.tv_id) || []));
  let tvMap: Record<string, { id: string; name: string; screen_width: number | null; screen_height: number | null; aspect_ratio: string | null; orientation: string | null; current_menu_url: string | null; paired_at: string | null }> = {};

  if (tvIds.length > 0) {
    const { data: tvs } = await supabase
      .from("tvs")
      .select("id, name, screen_width, screen_height, aspect_ratio, orientation, current_menu_url, paired_at")
      .in("id", tvIds)
      .eq("user_id", userId);

    if (tvs) {
      for (const tv of tvs) {
        tvMap[tv.id] = {
          id: tv.id,
          name: tv.name,
          screen_width: tv.screen_width ?? null,
          screen_height: tv.screen_height ?? null,
          aspect_ratio: tv.aspect_ratio ?? null,
          orientation: tv.orientation ?? null,
          current_menu_url: tv.current_menu_url ?? null,
          paired_at: tv.paired_at ?? null,
        };
      }
    }
  }

  // Group TVs under their respective screen groups
  const groupsWithMembers = groups.map((group) => {
    const memberTvIds = (memberships || [])
      .filter((m) => m.group_id === group.id)
      .map((m) => m.tv_id);

    const members = memberTvIds
      .map((id) => tvMap[id])
      .filter(Boolean);

    return {
      ...group,
      members,
      member_count: members.length,
    };
  });

  return NextResponse.json({ groups: groupsWithMembers });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminClient();
  const userId = await getAuthenticatedUser(req, supabase);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { name, description, color, tv_ids } = body || {};

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Group name is required" }, { status: 400 });
  }

  // 1. Create group
  const { data: newGroup, error: createError } = await supabase
    .from("screen_groups")
    .insert({
      user_id: userId,
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : null,
      color: typeof color === "string" && color.trim() ? color.trim() : "#3b82f6",
    })
    .select()
    .single();

  if (createError || !newGroup) {
    return NextResponse.json({ error: createError?.message || "Failed to create group" }, { status: 500 });
  }

  // 2. Optionally assign TV members if provided
  let addedMembers: string[] = [];
  if (Array.isArray(tv_ids) && tv_ids.length > 0) {
    // Verify that these TVs belong to the user
    const { data: userTvs } = await supabase
      .from("tvs")
      .select("id")
      .in("id", tv_ids)
      .eq("user_id", userId);

    const validTvIds = (userTvs || []).map((t) => t.id);
    if (validTvIds.length > 0) {
      const membershipRows = validTvIds.map((tvId) => ({
        group_id: newGroup.id,
        tv_id: tvId,
      }));

      await supabase.from("tv_group_memberships").insert(membershipRows);
      addedMembers = validTvIds;
    }
  }

  return NextResponse.json(
    {
      group: {
        ...newGroup,
        tv_ids: addedMembers,
        member_count: addedMembers.length,
      },
    },
    { status: 201 }
  );
}
