
import "server-only";

import { compare } from "bcryptjs";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "./prisma";

const credentialsSchema = z.object({
  loginId: z.string().trim().min(3).max(191),
  password: z.string().min(1).max(128),
});

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const INVALID_CREDENTIALS =
  "Username/email atau password tidak sesuai, atau akun tidak aktif.";

type LoginResult =
  | {
      ok: true;
      user: {
        id: string;
        name: string;
        role: "ADMIN" | "MANAGER" | "OPERATOR";
      };
    }
  | {
      ok: false;
      status: 400 | 401 | 429;
      error: string;
    };

function throttleKey(loginId: string) {
  return createHash("sha256")
    .update(`login:${loginId}`)
    .digest("hex");
}

async function addFailure(key: string) {
  const now = new Date();

  const existing = await prisma.loginThrottle.findUnique({
    where: { key },
  });

  const insideWindow =
    !!existing &&
    now.getTime() - existing.windowStartedAt.getTime() <
      LOGIN_WINDOW_MS;

  const failedCount = insideWindow
    ? existing.failedCount + 1
    : 1;

  await prisma.loginThrottle.upsert({
    where: { key },
    create: {
      key,
      failedCount,
      windowStartedAt: now,
      lockedUntil:
        failedCount >= MAX_FAILURES
          ? new Date(now.getTime() + LOGIN_WINDOW_MS)
          : null,
    },
    update: {
      failedCount,
      windowStartedAt: insideWindow
        ? existing!.windowStartedAt
        : now,
      lockedUntil:
        failedCount >= MAX_FAILURES
          ? new Date(now.getTime() + LOGIN_WINDOW_MS)
          : null,
    },
  });
}

/**
 * Memvalidasi kredensial pengguna.
 * Pembuatan session dan cookie dilakukan
 * oleh API route atau Server Action.
 */
export async function authenticateCredentials(
  payload: unknown
): Promise<LoginResult> {
  const parsed = credentialsSchema.safeParse(payload);

  if (
    !parsed.success ||
    Buffer.byteLength(parsed.data.password, "utf8") > 72
  ) {
    return {
      ok: false,
      status: 400,
      error: "Isi username/email dan password yang valid.",
    };
  }

  const loginId = parsed.data.loginId.toLowerCase();
  const key = throttleKey(loginId);
  const now = new Date();

  const attempts = await prisma.loginThrottle.findUnique({
    where: { key },
  });

  // if (attempts?.lockedUntil && attempts.lockedUntil > now) {
  //   return {
  //     ok: false,
  //     status: 429,
  //     error:
  //       "Terlalu banyak percobaan. Coba lagi setelah 15 menit.",
  //   };
  // }

  const user = await prisma.user.findUnique({
    where: { loginId },
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  });

  const passwordCorrect = user
    ? await compare(parsed.data.password, user.passwordHash)
    : false;

  if (!user || !passwordCorrect || !user.isActive) {
    await addFailure(key);

    return {
      ok: false,
      status: 401,
      error: INVALID_CREDENTIALS,
    };
  }

  await prisma.loginThrottle.deleteMany({
    where: { key },
  });

  return {
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  };
}
