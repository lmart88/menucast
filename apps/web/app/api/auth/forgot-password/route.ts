import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@menucast/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "https://localhost:3000";

    // Request password reset email from Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      console.warn("Password reset error from Supabase:", error.message);
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been dispatched.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
