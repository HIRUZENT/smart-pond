import { NextResponse, type NextRequest } from "next/server";
import { createSession, landingPageForRole } from "@/src/lib/auth";
import { authenticateCredentials } from "@/src/lib/login-service";


export async function POST(request: NextRequest) {
  // Hanya request dari origin aplikasi; mencegah request lintas origin langsung.
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false, error: "Origin tidak diizinkan." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const result = await authenticateCredentials(body);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  await createSession(result.user.id);
  return NextResponse.json(
    {
      ok: true,
      message: "Login berhasil.",
      redirectTo: landingPageForRole(result.user.role),
      user: result.user,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
