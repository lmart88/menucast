import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@menucast/supabase";

async function broadcastEvent(
  supabase: ReturnType<typeof createClient<Database>>,
  channelName: string,
  event: string,
  payload: Record<string, unknown>
) {
  return new Promise<void>((resolve) => {
    const channel = supabase.channel(channelName);
    const timeout = setTimeout(() => {
      supabase.removeChannel(channel);
      resolve();
    }, 2000);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel
          .send({
            type: "broadcast",
            event,
            payload,
          })
          .then(() => {
            setTimeout(() => {
              clearTimeout(timeout);
              supabase.removeChannel(channel);
              resolve();
            }, 200);
          })
          .catch(() => {
            clearTimeout(timeout);
            supabase.removeChannel(channel);
            resolve();
          });
      }
    });
  });
}

function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const publicMarker = "/storage/v1/object/public/menus/";
    const publicIdx = url.indexOf(publicMarker);
    if (publicIdx !== -1) {
      return decodeURIComponent(url.substring(publicIdx + publicMarker.length));
    }
    const signMarker = "/storage/v1/object/sign/menus/";
    const signIdx = url.indexOf(signMarker);
    if (signIdx !== -1) {
      const rawPath = url.substring(signIdx + signMarker.length).split("?")[0];
      return decodeURIComponent(rawPath);
    }
    const match = url.match(/\/menus\/(.+)$/);
    if (match && match[1]) {
      return decodeURIComponent(match[1].split("?")[0]);
    }
  } catch {
    // ignore
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tv_id } = await req.json();

  if (!tv_id) {
    return NextResponse.json({ error: "tv_id is required" }, { status: 400 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify ownership and get TV info
  const { data: tv, error: findError } = await supabase
    .from("tvs")
    .select("id, pairing_code, current_menu_url")
    .eq("id", tv_id)
    .eq("user_id", session.user.id)
    .single();

  if (findError || !tv) {
    return NextResponse.json({ error: "TV not found or unauthorized" }, { status: 404 });
  }

  // 1. Gather all associated images to delete from the "menus" storage bucket
  const filesToDelete: string[] = [];
  const folder = `${session.user.id}/${tv_id}`;

  // List all files stored under this user's TV directory in the "menus" bucket
  try {
    const { data: fileList } = await supabase.storage
      .from("menus")
      .list(folder);

    if (fileList && fileList.length > 0) {
      for (const file of fileList) {
        if (file.name) {
          filesToDelete.push(`${folder}/${file.name}`);
        }
      }
    }
  } catch (err) {
    console.error("Error listing files in menus storage:", err);
  }

  // Also query menu records from the database
  try {
    const { data: menuRecords } = await supabase
      .from("menus")
      .select("image_url")
      .eq("tv_id", tv_id);

    if (menuRecords && menuRecords.length > 0) {
      for (const record of menuRecords) {
        const p = extractStoragePath(record.image_url);
        if (p) filesToDelete.push(p);
      }
    }
  } catch (err) {
    console.error("Error querying menu records:", err);
  }

  // Check TV current_menu_url as well
  if (tv.current_menu_url) {
    const currentPath = extractStoragePath(tv.current_menu_url);
    if (currentPath) filesToDelete.push(currentPath);
  }

  // Delete all identified files from the "menus" bucket
  const uniqueFiles = Array.from(new Set(filesToDelete.filter(Boolean)));
  if (uniqueFiles.length > 0) {
    try {
      const { error: removeError } = await supabase.storage
        .from("menus")
        .remove(uniqueFiles);
      if (removeError) {
        console.error("Failed to remove files from storage bucket 'menus':", removeError);
      }
    } catch (storageErr) {
      console.error("Storage delete exception:", storageErr);
    }
  }

  // 2. Delete TV from database (associated menu records cascade automatically)
  const { error: deleteError } = await supabase
    .from("tvs")
    .delete()
    .eq("id", tv_id)
    .eq("user_id", session.user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // 3. Broadcast unpair event so any open TV displays reset to pairing screen
  await broadcastEvent(supabase, `tv:${tv_id}`, "tv:unpaired", { tv_id });

  return NextResponse.json({ success: true, deleted_id: tv_id });
}
