import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseClient } from "@menucast/supabase";

export async function POST(req: NextRequest) {
  try {
    const { password, access_token, refresh_token } = await req.json();

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (access_token) {
      // Initialize client with user's recovery token session
      const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
      
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token || access_token,
      });

      if (sessionError) {
        return NextResponse.json(
          { error: "Your password reset session has expired or is invalid. Please request a new link." },
          { status: 401 }
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message || "Failed to update password. Please try again." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Password has been successfully updated.",
      });
    }

    return NextResponse.json(
      { error: "Missing password reset verification token. Please use the link sent to your email." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Password reset error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting your password." },
      { status: 500 }
    );
  }
}
