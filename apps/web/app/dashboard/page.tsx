import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const maxScreensEnv = process.env.MAX_PAIRED_SCREENS_PER_USER;
  const maxScreens = maxScreensEnv ? parseInt(maxScreensEnv, 10) : 1;

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: tvs } = await supabase
    .from("tvs")
    .select("*, menus(*)")
    .eq("user_id", session.user.id)
    .not("paired_at", "is", null)
    .order("created_at", { ascending: false });

  const { data: tokenData } = await supabase
    .from("api_tokens")
    .select("id, name, created_at, last_used_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <DashboardClient
      initialTvs={tvs ?? []}
      hasToken={!!tokenData}
      userName={session.user.name ?? session.user.email ?? ""}
      maxScreens={maxScreens}
    />
  );
}
