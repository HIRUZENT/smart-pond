
"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export type AccountFormState = {
  error: string | null;
};

const common = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(120, "Nama maksimal 120 karakter"),

  email: z
    .email("Alamat email tidak valid")
    .trim()
    .toLowerCase()
    .max(191, "Email terlalu panjang"),

  phone: z
    .string()
    .trim()
    .min(9, "Nomor telepon terlalu pendek")
    .max(25, "Nomor telepon terlalu panjang")
    .regex(
      /^[+0-9 ()-]+$/,
      "Format telepon tidak valid"
    ),

  role: z.enum(["MANAGER", "OPERATOR"]),

  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
});

const passwordSchema = z
  .string()
  .min(12, "Kata sandi minimal 12 karakter")
  .refine(
    (value) =>
      Buffer.byteLength(value, "utf8") <= 72,
    "Kata sandi maksimal 72 byte"
  );

const createSchema = common
  .extend({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(
    (data) =>
      data.password === data.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Konfirmasi kata sandi tidak sama",
    }
  );

const editSchema = common
  .extend({
    password: z.union([
      z.literal(""),
      passwordSchema,
    ]),
    confirmPassword: z.string(),
  })
  .refine(
    (data) =>
      data.password === data.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Konfirmasi kata sandi tidak sama",
    }
  );

function getPayload(formData: FormData) {
  const fields = [
    "name",
    "email",
    "phone",
    "role",
    "isActive",
    "password",
    "confirmPassword",
  ];

  return Object.fromEntries(
    fields.map((key) => [
      key,
      formData.get(key),
    ])
  );
}

function errorText(error: z.ZodError): string {
  return (
    error.issues[0]?.message ??
    "Data formulir tidak valid."
  );
}

function databaseError(
  error: unknown
): string | null {
  const code = (
    error as { code?: string } | null
  )?.code;

  if (code === "P2002") {
    return "Email sudah digunakan oleh akun lain.";
  }

  if (code === "P2003") {
    return "Relasi data pengguna tidak valid.";
  }

  return null;
}

// ============================================
// CREATE USER
// ============================================

export async function createUserAction(
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  // Hanya Admin/Owner yang boleh membuat akun
  const admin = await requireRole("ADMIN");

  const parsed = createSchema.safeParse(
    getPayload(formData)
  );

  if (!parsed.success) {
    return {
      error: errorText(parsed.error),
    };
  }

  const {
    name,
    email,
    phone,
    role,
    isActive,
    password,
  } = parsed.data;

  // Periksa email pada kedua field,
  // termasuk kemungkinan akun lama yang
  // menggunakan username sebagai loginId.
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { loginId: email },
      ],
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return {
      error: "Email sudah terdaftar. Gunakan email lain.",
    };
  }

  try {
    const passwordHash = await hash(password, 12);

    await prisma.user.create({
      data: {
        name,

        // Email menjadi identitas login utama.
        // Field loginId tetap dipertahankan
        // agar login service lama kompatibel.
        loginId: email,
        email,

        phone,
        role,
        isActive,
        passwordHash,

        createdBy: {
          connect: {
            id: admin.id,
          },
        },
      },
    });
  } catch (error) {
    const message = databaseError(error);

    if (message) {
      return {
        error: message,
      };
    }

    console.error(
      "CREATE USER ERROR:",
      error
    );

    return {
      error:
        "Gagal mendaftarkan pengguna. Silakan coba lagi.",
    };
  }

  revalidatePath("/users");

  // Alert sukses ditampilkan setelah redirect.
  redirect("/users?created=1");
}

// ============================================
// UPDATE USER
// ============================================

export async function updateUserAction(
  id: string,
  _prev: AccountFormState,
  formData: FormData
): Promise<AccountFormState> {
  await requireRole("ADMIN");

  const parsed = editSchema.safeParse(
    getPayload(formData)
  );

  if (!parsed.success) {
    return {
      error: errorText(parsed.error),
    };
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      isActive: true,
      loginId: true,
      email: true,
    },
  });

  if (!target || target.role === "ADMIN") {
    return {
      error:
        "Akun tidak ditemukan atau tidak dapat diubah.",
    };
  }

  const {
    name,
    email,
    phone,
    role,
    isActive,
    password,
  } = parsed.data;

  // Periksa email milik pengguna lain.
  const duplicate = await prisma.user.findFirst({
    where: {
      id: {
        not: id,
      },
      OR: [
        { email },
        { loginId: email },
      ],
    },
    select: {
      id: true,
    },
  });

  if (duplicate) {
    return {
      error:
        "Email sudah digunakan oleh akun lain.",
    };
  }

  const passwordHash = password
    ? await hash(password, 12)
    : undefined;

  const loginChanged = target.loginId !== email;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          name,

          // Sinkronkan identitas login
          // dengan email terbaru.
          loginId: email,
          email,

          phone,
          role,
          isActive,

          ...(passwordHash !== undefined
            ? { passwordHash }
            : {}),
        },
      });

      // Cabut session saat identitas login,
      // role, password, atau status berubah.
      if (
        loginChanged ||
        target.role !== role ||
        !isActive ||
        passwordHash !== undefined
      ) {
        await tx.session.deleteMany({
          where: {
            userId: id,
          },
        });
      }
    });
  } catch (error) {
    const message = databaseError(error);

    if (message) {
      return {
        error: message,
      };
    }

    console.error(
      "UPDATE USER ERROR:",
      error
    );

    return {
      error:
        "Gagal memperbarui akun pengguna. Silakan coba lagi.",
    };
  }

  revalidatePath("/users");

  redirect("/users?updated=1");
}
