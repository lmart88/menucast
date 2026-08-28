import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@menucast/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, redirect_to } = await req.json();

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

    // Determine the best origin for the password reset redirect
    // Prioritize explicit client redirect URL, then request headers, then configured APP URL
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    
    let targetOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://192.168.4.117:3000";

    if (redirect_to && typeof redirect_to === "string" && redirect_to.startsWith("http")) {
      targetOrigin = redirect_to.replace(/\/reset-password\/?$/, "");
    } else if (host) {
      targetOrigin = `${proto}://${host}`;
    } else if (req.headers.get("origin")) {
      targetOrigin = req.headers.get("origin")!;
    }

    const finalRedirectUrl = `${targetOrigin}/reset-password`;

    // Request password reset email from Supabase Auth with explicit redirectTo target
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: finalRedirectUrl,
    });

    if (error) {
      console.warn("Password reset error from Supabase:", error.message);
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been dispatched.",
      redirect_url: finalRedirectUrl,
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
