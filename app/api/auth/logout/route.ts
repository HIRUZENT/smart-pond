import { NextResponse, type NextRequest } from "next/server";
import { destroySession } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "Origin tidak diizinkan." }, { status: 403 });
  }

  await destroySession();
  return NextResponse.json(
    { ok: true, message: "Berhasil keluar.", redirectTo: "/login" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
