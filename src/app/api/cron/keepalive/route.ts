import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

// Supabase free-tier projects pause after a period without database activity,
// which removes their DNS record and takes the whole app down. A Vercel cron
// (see vercel.json) hits this route daily so the project never goes idle.
// It only runs the same read the anon key already allows publicly.
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase
    .from("expense_categories")
    .select("id")
    .is("couple_id", null)
    .limit(1);

  if (error) {
    console.error("Supabase keepalive failed", error.message);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
