import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseClient } from "@menucast/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, redirect_to } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || serviceKey;

    const adminClient = createSupabaseAdminClient(supabaseUrl, serviceKey);
    const anonClient = createSupabaseClient(supabaseUrl, anonKey);

    // Determine target redirect origin
    const originHeader = req.headers.get("origin");
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");

    let targetOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://minikast.com";

    if (redirect_to && typeof redirect_to === "string" && redirect_to.startsWith("http")) {
      targetOrigin = redirect_to.replace(/\/reset-password\/?$/, "");
    } else if (originHeader && originHeader.startsWith("http")) {
      targetOrigin = originHeader.replace(/\/reset-password\/?$/, "");
    } else if (host) {
      targetOrigin = `${proto}://${host}`;
    }

    const finalRedirectUrl = `${targetOrigin}/reset-password`;

    const isDevResetEnabled =
      process.env.DEV_PASSWORD_RESET?.toLowerCase() !== "false" &&
      process.env.NEXT_PUBLIC_DEV_PASSWORD_RESET?.toLowerCase() !== "false";

    let directAppUrl = "";

    // 1. Generate direct recovery link & token via admin client if dev reset mode is enabled
    if (isDevResetEnabled) {
      try {
        const { data: linkData } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email: cleanEmail,
          options: {
            redirectTo: finalRedirectUrl,
          },
        });

        if (linkData?.properties?.hashed_token) {
          directAppUrl = `${finalRedirectUrl}?token_hash=${linkData.properties.hashed_token}&email=${encodeURIComponent(cleanEmail)}`;
          console.log("\n=======================================================");
          console.log("🔗 DIRECT PASSWORD RESET LINK (Bypasses localhost):");
          console.log(`📧 User: ${cleanEmail}`);
          console.log(`👉 Link: ${directAppUrl}`);
          console.log("=======================================================\n");
        }
      } catch (err) {
        console.warn("Could not generate direct recovery link:", err);
      }
    }

    // 2. Dispatch email through Supabase Auth mailer
    const { error: emailError } = await anonClient.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: finalRedirectUrl,
    });

    if (emailError) {
      console.error("❌ Supabase resetPasswordForEmail failed:", {
        message: emailError.message,
        status: emailError.status,
        email: cleanEmail,
        redirectTo: finalRedirectUrl,
      });
    } else {
      console.log(`✅ Supabase resetPasswordForEmail successfully dispatched for: ${cleanEmail}`);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, a password reset link has been dispatched.",
      direct_link: isDevResetEnabled ? directAppUrl || undefined : undefined,
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
