
"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export type PondAdminState = {
  error: string | null;
  success: string | null;
};

const initialError = (message: string): PondAdminState => ({
  error: message,
  success: null,
});

const initialSuccess = (message: string): PondAdminState => ({
  error: null,
  success: message,
});

function textValue(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

const createPondSchema = z.object({
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(120),
  type: z.enum(["PARIT_SEKAT", "TABUNG"]),
  fishSpecies: z.string().trim().max(100),
});

export async function createPondAction(
  _previous: PondAdminState,
  formData: FormData
): Promise<PondAdminState> {
  await requireRole("ADMIN");

  const parsed = createPondSchema.safeParse({
    code: textValue(formData, "code"),
    name: textValue(formData, "name"),
    type: textValue(formData, "type"),
    fishSpecies: textValue(formData, "fishSpecies"),
  });

  if (!parsed.success) {
    return initialError(
      parsed.error.issues[0]?.message ??
      "Data kolam tidak valid."
    );
  }

  const data = parsed.data;

  try {
    await prisma.pond.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        fishSpecies: data.fishSpecies || null,
        isActive: true,
      },
    });
  } catch (error) {
    if (
      (error as { code?: string }).code === "P2002"
    ) {
      return initialError(
        "Kode kolam sudah digunakan."
      );
    }

    console.error("CREATE POND:", error);
    return initialError(
      "Gagal menambahkan kolam."
    );
  }

  revalidatePath("/ponds");

  return initialSuccess(
    "Kolam baru berhasil didaftarkan."
  );
}

const assignmentSchema = z.object({
  pondId: z.string().min(1),
  userId: z.string().min(1),
});

export async function assignPondAction(
  _previous: PondAdminState,
  formData: FormData
): Promise<PondAdminState> {
  const admin = await requireRole("ADMIN");

  const parsed = assignmentSchema.safeParse({
    pondId: textValue(formData, "pondId"),
    userId: textValue(formData, "userId"),
  });

  if (!parsed.success) {
    return initialError(
      "Pilih kolam dan pengguna."
    );
  }

  const { pondId, userId } = parsed.data;

  const [pond, user] = await Promise.all([
    prisma.pond.findUnique({
      where: { id: pondId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
    }),
  ]);

  if (!pond?.isActive) {
    return initialError(
      "Kolam tidak ditemukan atau nonaktif."
    );
  }

  if (
    !user?.isActive ||
    !["MANAGER", "OPERATOR"].includes(user.role)
  ) {
    return initialError(
      "Pengguna harus Pengelola atau Petugas aktif."
    );
  }

  try {
    await prisma.pondMember.upsert({
      where: {
        pondId_userId: {
          pondId,
          userId,
        },
      },
      update: {
        assignedById: admin.id,
      },
      create: {
        pondId,
        userId,
        assignedById: admin.id,
      },
    });
  } catch (error) {
    console.error("ASSIGN POND:", error);
    return initialError(
      "Gagal menetapkan pengguna ke kolam."
    );
  }

  revalidatePath("/ponds");
  revalidatePath("/operations");

  return initialSuccess(
    "Pengguna berhasil ditugaskan ke kolam."
  );
}

export async function removePondAssignmentAction(
  formData: FormData
) {
  await requireRole("ADMIN");

  const parsed = assignmentSchema.safeParse({
    pondId: textValue(formData, "pondId"),
    userId: textValue(formData, "userId"),
  });

  if (!parsed.success) return;

  await prisma.pondMember.deleteMany({
    where: {
      pondId: parsed.data.pondId,
      userId: parsed.data.userId,
    },
  });

  revalidatePath("/ponds");
  revalidatePath("/operations");
  redirect("/ponds");
}

// Pendaftaran Admin baru.
// Endpoint ini tidak tersedia untuk publik.
const createAdminSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase().max(191),
  password: z.string().min(12).refine(
    (value) =>
      Buffer.byteLength(value, "utf8") <= 72,
    "Password terlalu panjang."
  ),
});

export async function createAdminAccountAction(
  _previous: PondAdminState,
  formData: FormData
): Promise<PondAdminState> {
  const admin = await requireRole("ADMIN");

  const parsed = createAdminSchema.safeParse({
    name: textValue(formData, "adminName"),
    email: textValue(formData, "adminEmail"),
    password: textValue(formData, "adminPassword"),
  });

  if (!parsed.success) {
    return initialError(
      parsed.error.issues[0]?.message ??
      "Data admin tidak valid."
    );
  }

  const { name, email, password } = parsed.data;

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        loginId: email,
        passwordHash: await hash(password, 12),
        role: "ADMIN",
        isActive: true,
        createdById: admin.id,
      },
    });
  } catch (error) {
    if (
      (error as { code?: string }).code === "P2002"
    ) {
      return initialError(
        "Email admin sudah terdaftar."
      );
    }

    console.error("CREATE ADMIN:", error);

    return initialError(
      "Gagal mendaftarkan Admin baru."
    );
  }

  revalidatePath("/users");

  return initialSuccess(
    "Akun Admin baru berhasil didaftarkan."
  );
}
