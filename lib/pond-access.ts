
import "server-only";

import { prisma } from "@/src/lib/prisma";

type PondUser = {
  id: string;
  role: "ADMIN" | "MANAGER" | "OPERATOR";
};

export async function getAccessiblePondIds(
  user: PondUser
): Promise<string[]> {
  if (user.role === "ADMIN") {
    const ponds = await prisma.pond.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    return ponds.map((pond) => pond.id);
  }

  const memberships = await prisma.pondMember.findMany({
    where: {
      userId: user.id,
      pond: { isActive: true },
    },
    select: { pondId: true },
  });

  return memberships.map((item) => item.pondId);
}

export async function canAccessPond(
  user: PondUser,
  pondId: string
): Promise<boolean> {
  const pond = await prisma.pond.findUnique({
    where: { id: pondId },
    select: { isActive: true },
  });

  if (!pond?.isActive) return false;

  if (user.role === "ADMIN") return true;

  const membership = await prisma.pondMember.findUnique({
    where: {
      pondId_userId: {
        pondId,
        userId: user.id,
      },
    },
  });

  return Boolean(membership);
}
