import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSupabaseAdminClient } from "@menucast/supabase";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, password } = body;

    if (!name && !password) {
      return NextResponse.json(
        { error: "No update fields provided." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);

    const updateAttributes: {
      password?: string;
      user_metadata?: Record<string, unknown>;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Display name cannot be empty." },
          { status: 400 }
        );
      }
      updateAttributes.user_metadata = {
        name: name.trim(),
      };
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long." },
          { status: 400 }
        );
      }
      updateAttributes.password = password;
    }

    const { data, error } = await supabase.auth.admin.updateUserById(
      session.user.id,
      updateAttributes
    );

    if (error) {
      console.error("Failed to update user profile in Supabase:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update profile." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email,
      },
    });
  } catch (err) {
    console.error("Unexpected profile update error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating profile." },
      { status: 500 }
    );
  }
}
