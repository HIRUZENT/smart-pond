
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { PondAdminPanel } from "@/components/ponds/pond-admin-panel";

async function PondAdminContent() {
  await connection();

  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [ponds, users] = await Promise.all([
    prisma.pond.findMany({
      orderBy: { name: "asc" },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    }),

    prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ["MANAGER", "OPERATOR"],
        },
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
    }),
  ]);

  return (
    <PondAdminPanel
      ponds={ponds.map((pond) => ({
        id: pond.id,
        code: pond.code,
        name: pond.name,
        type: pond.type,
        isActive: pond.isActive,
        members: pond.members.map((member) => ({
          id: member.user.id,
          name: member.user.name,
          role: member.user.role,
        })),
      }))}
      users={users}
    />
  );
}

export default function PondAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-slate-500">
          Memuat pengelolaan kolam...
        </div>
      }
    >
      <PondAdminContent />
    </Suspense>
  );
}
