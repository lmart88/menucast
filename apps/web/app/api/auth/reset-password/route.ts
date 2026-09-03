import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseClient } from "@menucast/supabase";

export async function POST(req: NextRequest) {
  try {
    const { password, access_token, token_hash } = await req.json();

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || serviceRoleKey;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server authentication service is currently unconfigured." },
        { status: 500 }
      );
    }

    const adminClient = createSupabaseAdminClient(supabaseUrl, serviceRoleKey);
    const anonClient = createSupabaseClient(supabaseUrl, anonKey);

    let targetUserId: string | null = null;

    // 1. If access_token is present, verify token and resolve user ID
    if (access_token && typeof access_token === "string") {
      const { data: userData, error: userError } = await anonClient.auth.getUser(access_token);
      if (!userError && userData?.user?.id) {
        targetUserId = userData.user.id;
      }
    }

    // 2. If token_hash is present and user not yet resolved, verify OTP on server
    if (!targetUserId && token_hash && typeof token_hash === "string") {
      const { data: otpData, error: otpError } = await anonClient.auth.verifyOtp({
        token_hash,
        type: "recovery",
      });

      if (!otpError && otpData?.user?.id) {
        targetUserId = otpData.user.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Your password reset session has expired or is invalid. Please request a new link." },
        { status: 401 }
      );
    }

    // 3. Update the user password securely via admin client
    const { error: updateError } = await adminClient.auth.admin.updateUserById(targetUserId, {
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
  } catch (err) {
    console.error("Password reset error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while resetting your password." },
      { status: 500 }
    );
  }
}

