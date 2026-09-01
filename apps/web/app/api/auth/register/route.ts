import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@menucast/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, bypassKey } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check registration kill-switch and access control
    const registrationEnabled =
      process.env.REGISTRATION_ENABLED !== "false" &&
      process.env.REGISTRATION_ENABLED !== "0";

    const configuredBypassKey = process.env.REGISTRATION_BYPASS_KEY?.trim();
    const requestBypassKey = (
      bypassKey ||
      req.headers.get("x-registration-key") ||
      req.nextUrl.searchParams.get("key")
    )
      ?.toString()
      .trim();

    const hasValidBypassKey = Boolean(
      configuredBypassKey &&
        requestBypassKey &&
        configuredBypassKey === requestBypassKey
    );

    const allowedEmails = (process.env.ALLOWED_REGISTRATION_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isEmailWhitelisted =
      allowedEmails.length > 0 && allowedEmails.includes(normalizedEmail);

    if (!registrationEnabled && !hasValidBypassKey && !isEmailWhitelisted) {
      return NextResponse.json(
        {
          error:
            "Account registration is temporarily closed for maintenance. Please check back soon.",
        },
        { status: 403 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );


    // Create user via Supabase Auth Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (error) {
      // Check for existing user or duplicate email
      if (
        error.message?.toLowerCase().includes("already registered") ||
        error.message?.toLowerCase().includes("already exists") ||
        error.status === 422
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Failed to create account. Please try again." },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
