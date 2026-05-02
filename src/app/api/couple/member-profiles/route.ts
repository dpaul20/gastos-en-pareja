import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const service = await createServiceClient();
  const { data, error } = await service.rpc("get_couple_member_profiles", {
    p_user_id: user.id,
  });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar los perfiles de la pareja" },
      { status: 500 },
    );
  }

  return NextResponse.json(data ?? []);
}
