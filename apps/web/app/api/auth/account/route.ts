import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseAdminClient } from "@menucast/supabase";

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { confirmation } = body;

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Confirmation keyword 'DELETE' is required to permanently delete account." },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);

    // 1. Clean up user storage assets in 'menus' bucket under user's prefix
    try {
      const { data: fileList } = await supabase.storage
        .from("menus")
        .list(userId, { limit: 100 });

      if (fileList && fileList.length > 0) {
        const filePaths = fileList.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from("menus").remove(filePaths);
      }
    } catch (storageErr) {
      console.warn("Storage cleanup notice (non-fatal):", storageErr);
    }

    // 2. Delete user from Supabase Auth (cascades to tvs, menus, api_tokens, screen_groups)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Failed to delete user in Supabase auth:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete account." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account and all associated resources have been permanently deleted.",
    });
  } catch (err) {
    console.error("Unexpected error in account deletion:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting account." },
      { status: 500 }
    );
  }
}
