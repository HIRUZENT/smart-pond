
import { NextRequest } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/auth";
import { canAccessPond } from "@/lib/pond-access";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: Context
) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      { error: "Belum login." },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  const expense = await prisma.expense.findUnique({
    where: { id },
    select: {
      receiptName: true,
      receiptMime: true,
      receiptData: true,
      activity: {
        select: {
          pondId: true,
        },
      },
    },
  });

  if (!expense?.receiptData) {
    return Response.json(
      { error: "Lampiran tidak ditemukan." },
      { status: 404 }
    );
  }

  const allowed = await canAccessPond(
    user,
    expense.activity.pondId
  );

  if (!allowed) {
    return Response.json(
      { error: "Akses ditolak." },
      { status: 403 }
    );
  }

  const filename = (
    expense.receiptName ?? "nota"
  )
    .replace(/[^\w.-]/g, "_")
    .slice(0, 191);

  // Salin ke typed array dengan ArrayBuffer
  // tersendiri agar kompatibel dengan Blob.
  const bytes = Uint8Array.from(
    expense.receiptData
  );

  const blob = new Blob([bytes], {
    type:
      expense.receiptMime ??
      "application/octet-stream",
  });

  return new Response(blob, {
    headers: {
      "Content-Type":
        expense.receiptMime ??
        "application/octet-stream",
      "Content-Disposition":
        `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
