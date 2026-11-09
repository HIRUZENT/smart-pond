import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Belum login atau sesi sudah kedaluwarsa." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, user },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
