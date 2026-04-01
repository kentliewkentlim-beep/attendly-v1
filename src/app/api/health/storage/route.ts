import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
    }

    const urlPresent = !!process.env.SUPABASE_URL;
    const keyPresent = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!urlPresent || !keyPresent) {
      return NextResponse.json(
        { ok: false, reason: "env_missing" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseServiceClient();
    const buckets = await supabase.storage.listBuckets();
    const hasAvatars = (buckets.data ?? []).some((b: { name: string }) => b.name === "avatars");

    return NextResponse.json({ ok: true, avatarsBucket: !!hasAvatars });
  } catch {
    return NextResponse.json({ ok: false, reason: "error" }, { status: 500 });
  }
}
