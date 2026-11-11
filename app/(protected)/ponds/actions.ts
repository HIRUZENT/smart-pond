
"use server";

import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

// =============================================
// ACTION STATE
// =============================================

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

// =============================================
// FORM DATA HELPER
// =============================================

function textValue(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

// =============================================
// POND VALIDATION
// Kode kolam tidak lagi diinput manual.
// =============================================

const createPondSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama kolam minimal 2 karakter.")
    .max(120, "Nama kolam maksimal 120 karakter."),

  type: z.enum(["PARIT_SEKAT", "TABUNG"], {
    error: "Jenis kolam tidak valid.",
  }),

  fishSpecies: z
    .string()
    .trim()
    .max(100, "Nama komoditas maksimal 100 karakter.")
    .transform((value) => value || null),
});

// =============================================
// CREATE POND
// Pendaftaran kolam baru oleh ADMIN
// Kode dibuat otomatis berdasarkan Primary Key.
// =============================================

export async function createPondAction(
  _previous: PondAdminState,
  formData: FormData
): Promise<PondAdminState> {

  // Pastikan hanya ADMIN yang dapat mendaftarkan kolam.
  await requireRole("ADMIN");

  // Validasi input tanpa kode kolam.
  const parsed = createPondSchema.safeParse({
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
    // Buat kolam dan kode otomatis dalam satu transaksi.
    const createdPond = await prisma.$transaction(
      async (tx) => {

        // 1. Buat kolam terlebih dahulu.
        // Kode sementara digunakan untuk memenuhi
        // kolom code yang wajib dan bersifat unique.

        const pond = await tx.pond.create({
          data: {
            code: `TEMP-${randomUUID()}`,
            name: data.name,
            type: data.type,
            fishSpecies: data.fishSpecies,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        // 2. Bentuk kode berdasarkan Primary Key Prisma.

        const generatedCode =
          `KLM-${String(pond.id).toUpperCase()}`;

        // 3. Ganti kode sementara dengan kode otomatis.

        await tx.pond.update({
          where: {
            id: pond.id,
          },
          data: {
            code: generatedCode,
          },
        });

        return {
          id: pond.id,
          code: generatedCode,
        };
      }
    );

    // Perbarui cache halaman terkait.
    revalidatePath("/ponds");
    revalidatePath("/dashboard");
    revalidatePath("/operations");

    return initialSuccess(
      `Kolam berhasil didaftarkan.`
    );

  } catch (error) {

    // Tangani kemungkinan kode duplikat.
    if (
      (error as { code?: string }).code === "P2002"
    ) {
      return initialError(
        "Terjadi duplikasi kode kolam. Silakan coba kembali."
      );
    }

    console.error("CREATE POND:", error);

    return initialError(
      "Gagal menambahkan kolam. Silakan coba kembali."
    );
  }
}

// =============================================
// POND ASSIGNMENT VALIDATION
// =============================================

const assignmentSchema = z.object({
  pondId: z.string().min(1),
  userId: z.string().min(1),
});

// =============================================
// ASSIGN POND
// Menugaskan MANAGER / OPERATOR ke kolam
// =============================================

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

  // Periksa keberadaan kolam dan pengguna.
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
    // Gunakan upsert agar penugasan tidak duplikat.
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

  // Perbarui halaman terkait.
  revalidatePath("/ponds");
  revalidatePath("/dashboard");
  revalidatePath("/operations");

  return initialSuccess(
    "Pengguna berhasil ditugaskan ke kolam."
  );
}

// =============================================
// REMOVE POND ASSIGNMENT
// Menghapus penugasan pengguna dari kolam
// =============================================

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
  revalidatePath("/dashboard");
  revalidatePath("/operations");

  redirect("/ponds");
}

// =============================================
// CREATE ADMIN VALIDATION
// Pendaftaran Admin baru.
// Endpoint ini tidak tersedia untuk publik.
// =============================================

const createAdminSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(120),

  email: z
    .email()
    .trim()
    .toLowerCase()
    .max(191),

  password: z
    .string()
    .min(12, "Password minimal 12 karakter.")
    .refine(
      (value) =>
        Buffer.byteLength(value, "utf8") <= 72,
      "Password terlalu panjang."
    ),
});

// =============================================
// CREATE ADMIN ACCOUNT
// =============================================

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
