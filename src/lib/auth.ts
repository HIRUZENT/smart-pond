import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "../generated/prisma/client";

const SESSION_COOKIE = "smartpond_session";
const SESSION_AGE_SECONDS = 7 * 24 * 60 * 60;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_AGE_SECONDS * 1000);
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_AGE_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("smartpond_session")?.value;

  if (!token) {
    return null;
  }
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      user: { select: { id: true, name: true, loginId: true, role: true, isActive: true } },
    },
  });

  if (!session || session.expiresAt <= new Date() || !session.user.isActive) {
    return null;
  }
  return {
    id: session.user.id,
    name: session.user.name,
    loginId: session.user.loginId,
    role: session.user.role,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export function landingPageForRole(role: UserRole) {
  return role === "ADMIN" ? "/users" : "/dashboard";
}
