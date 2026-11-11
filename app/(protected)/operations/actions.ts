
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/auth";
import { canAccessPond } from "@/lib/pond-access";

// =============================================
// FORM STATE
// =============================================

export type ActivityFormState = {
  error: string | null;
  success: string | null;
};

// Alias agar kompatibel dengan komponen form sebelumnya.
export type ActivityActionState = ActivityFormState;

// =============================================
// SCHEMA VALIDATION
// =============================================

const schema = z.object({
  pondId: z.string().min(1, "Pilih kolam"),

  date: z.iso.date(),

  time: z.string().regex(
    /^([01]\d|2[0-3]):[0-5]\d$/,
    "Format waktu tidak valid"
  ),

  type: z.enum([
    "FEEDING",
    "WATER_CHANGE",
    "WATER_ADDITION",
    "AERATOR",
    "CLEANING",
    "FOLLOW_UP",
    "OTHER",
  ]),

  description: z.string().trim().max(10000),

  instruction: z.string().trim().max(10000),

  assignedToId: z.string(),

  status: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.enum([
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
    ]).optional()
  ),

  performedById: z.string(),

  performedDate: z.string(),

  performedTime: z.string(),

  result: z.string().trim().max(10000),

  expenseCategory: z.string().trim().max(100),

  expenseDescription: z.string().trim().max(500),

  expenseAmount: z.string(),

  expenseDate: z.string(),

  expenseTime: z.string(),

  alertId: z.string(),

  saveMode: z.enum(["DRAFT", "SUBMITTED"]),
});

// =============================================
// HELPER
// =============================================

function readText(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

// Mendukung nama field dari form sebelumnya
// maupun struktur form yang sudah digunakan sebelumnya.

function parseForm(formData: FormData) {
  const expenseDescription = readText(
    formData,
    "expenseDescription"
  );

  return schema.safeParse({
    pondId: readText(formData, "pondId"),

    date:
      readText(formData, "activityDate") ||
      readText(formData, "date"),

    time:
      readText(formData, "activityTime") ||
      readText(formData, "time"),

    type: readText(formData, "type"),

    description: readText(formData, "description"),

    instruction: readText(formData, "instruction"),

    assignedToId: readText(formData, "assignedToId"),

    status: readText(formData, "status"),

    performedById: readText(formData, "performedById"),

    performedDate: readText(formData, "performedDate"),

    performedTime: readText(formData, "performedTime"),

    result: readText(formData, "result"),

    expenseCategory:
      readText(formData, "expenseCategory") ||
      expenseDescription,

    expenseDescription,

    expenseAmount:
      readText(formData, "expenseAmount") || "0",

    expenseDate: readText(formData, "expenseDate"),

    expenseTime: readText(formData, "expenseTime"),

    alertId: readText(formData, "alertId"),

    // Mendukung tombol dengan nama recordState
    // maupun saveMode.
    saveMode:
      readText(formData, "recordState") ||
      readText(formData, "saveMode") ||
      "SUBMITTED",
  });
}

// =============================================
// DATETIME WIB
// =============================================

function combineDateTime(
  date: string,
  time: string
): Date | null {
  if (!date || !time) return null;

  const result = new Date(
    `${date}T${time}:00+07:00`
  );

  return Number.isNaN(result.getTime())
    ? null
    : result;
}

// =============================================
// RECEIPT VALIDATION
// =============================================

async function readReceipt(formData: FormData) {
  const value = formData.get("receipt");

  if (!value || typeof value === "string") {
    return null;
  }

  if (value.size === 0) return null;

  // Batas mengikuti kapasitas request Server Action.
  if (value.size > 650_000) {
    throw new Error("Lampiran maksimal 650 KB.");
  }

  const bytes = new Uint8Array(
    await value.arrayBuffer()
  );

  // PDF signature
  const isPdf =
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d;

  // PNG signature
  const isPng =
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => bytes[index] === byte
    );

  // JPEG signature
  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  const mime = isPdf
    ? "application/pdf"
    : isPng
      ? "image/png"
      : isJpeg
        ? "image/jpeg"
        : null;

  if (!mime) {
    throw new Error(
      "Lampiran harus berupa PDF, PNG, atau JPG yang valid."
    );
  }

  return {
    receiptName: value.name
      .replace(/[^\w.-]/g, "_")
      .slice(0, 191),

    receiptMime: mime,

    receiptData: bytes,
  };
}

// =============================================
// SERVER ACTION
// =============================================

export async function saveActivityAction(
  _previous: ActivityFormState,
  formData: FormData
): Promise<ActivityFormState> {

  // -------------------------------------------
  // 1. AUTHENTICATION
  // -------------------------------------------

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (
    user.role !== "MANAGER" &&
    user.role !== "OPERATOR"
  ) {
    return {
      error: "Akun ini tidak diizinkan mencatat aktivitas.",
      success: null,
    };
  }

  // -------------------------------------------
  // 2. FORM VALIDATION
  // -------------------------------------------

  const parsed = parseForm(formData);

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Data formulir tidak valid.",
      success: null,
    };
  }

  const data = parsed.data;

  const isFollowUp = data.type === "FOLLOW_UP";

  const status = isFollowUp
    ? data.status ?? "PENDING"
    : null;

  // -------------------------------------------
  // 3. POND ACCESS VALIDATION
  // -------------------------------------------

  const allowed = await canAccessPond(
    user,
    data.pondId
  );

  if (!allowed) {
    return {
      error: "Kamu tidak memiliki akses ke kolam tersebut.",
      success: null,
    };
  }

  // -------------------------------------------
  // 4. ACTIVITY DATETIME
  // -------------------------------------------

  const activityAt = combineDateTime(
    data.date,
    data.time
  );

  if (!activityAt) {
    return {
      error: "Tanggal atau waktu tidak valid.",
      success: null,
    };
  }

  // -------------------------------------------
  // 5. ACTIVITY DESCRIPTION
  // -------------------------------------------

  if (
    data.saveMode === "SUBMITTED" &&
    !data.description &&
    !data.instruction
  ) {
    return {
      error: "Isi catatan aktivitas atau arahan tindakan.",
      success: null,
    };
  }

  if (
    data.saveMode === "SUBMITTED" &&
    isFollowUp &&
    !data.instruction
  ) {
    return {
      error: "Arahan tindakan wajib diisi.",
      success: null,
    };
  }

  // -------------------------------------------
  // 6. FOLLOW-UP STATUS VALIDATION
  // -------------------------------------------

  if (
    data.saveMode === "SUBMITTED" &&
    isFollowUp &&
    status === "COMPLETED" &&
    !data.result
  ) {
    return {
      error: "Hasil tindakan wajib diisi sebelum status dinyatakan selesai.",
      success: null,
    };
  }

  // -------------------------------------------
  // 7. ASSIGNED STAFF
  // -------------------------------------------

  let assignedToId: string | null = null;

  if (user.role === "MANAGER") {
    assignedToId = isFollowUp
      ? data.assignedToId || null
      : null;

    if (
      data.saveMode === "SUBMITTED" &&
      isFollowUp &&
      !assignedToId
    ) {
      return {
        error: "Pilih petugas yang bertanggung jawab.",
        success: null,
      };
    }

    if (assignedToId) {
      const operator = await prisma.pondMember.findFirst({
        where: {
          pondId: data.pondId,
          userId: assignedToId,
          user: {
            role: "OPERATOR",
            isActive: true,
          },
        },
      });

      if (!operator) {
        return {
          error: "Petugas tidak terdaftar pada kolam tersebut.",
          success: null,
        };
      }
    }
  } else {
    // Operator hanya dapat mencatat aktivitasnya sendiri.
    assignedToId = user.id;
  }

  // -------------------------------------------
  // 8. PERFORMANCE INFORMATION
  // -------------------------------------------

  const needsPerformance =
    !isFollowUp || status !== "PENDING";

  // Operator otomatis tercatat sebagai pelaksana.
  // Manager memilih petugas dari formulir.
  const performedById =
    user.role === "OPERATOR"
      ? user.id
      : data.performedById || null;

  const performedAt =
    needsPerformance
      ? combineDateTime(
          data.performedDate,
          data.performedTime
        )
      : null;

  if (
    data.saveMode === "SUBMITTED" &&
    needsPerformance &&
    (!performedById || !performedAt)
  ) {
    return {
      error: "Petugas dan waktu pelaksanaan wajib dilengkapi.",
      success: null,
    };
  }

  if (performedById) {
    const performer = await prisma.pondMember.findFirst({
      where: {
        pondId: data.pondId,
        userId: performedById,
        user: {
          isActive: true,
          role: {
            in: ["MANAGER", "OPERATOR"],
          },
        },
      },
    });

    if (!performer) {
      return {
        error: "Petugas pelaksana tidak terdaftar pada kolam tersebut.",
        success: null,
      };
    }
  }

  // -------------------------------------------
  // 9. EXPENSE VALIDATION
  // -------------------------------------------

  const amount = Number(data.expenseAmount);

  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > 999_999_999_999.99
  ) {
    return {
      error: "Nominal pengeluaran tidak valid.",
      success: null,
    };
  }

  let receipt: Awaited<
    ReturnType<typeof readReceipt>
  > = null;

  try {
    receipt = await readReceipt(formData);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Lampiran tidak valid.",
      success: null,
    };
  }

  const hasExpenseInput = Boolean(
    data.expenseCategory ||
    data.expenseDescription ||
    data.expenseDate ||
    data.expenseTime ||
    amount > 0 ||
    receipt
  );

  if (hasExpenseInput && amount === 0) {
    return {
      error: "Isi nominal pengeluaran sebelum menyimpan biaya atau nota.",
      success: null,
    };
  }

  if (amount > 0 && !data.expenseCategory) {
    return {
      error: "Kategori pengeluaran wajib diisi.",
      success: null,
    };
  }

  const expenseAt = amount > 0
    ? combineDateTime(
        data.expenseDate || data.date,
        data.expenseTime || data.time
      )
    : null;

  if (amount > 0 && !expenseAt) {
    return {
      error: "Tanggal atau waktu pengeluaran tidak valid.",
      success: null,
    };
  }

  // -------------------------------------------
  // 10. ALERT VALIDATION
  // -------------------------------------------

  if (data.alertId) {
    const alert = await prisma.alert.findFirst({
      where: {
        id: data.alertId,
        pondId: data.pondId,
      },
      select: {
        id: true,
      },
    });

    if (!alert) {
      return {
        error: "Pengingat tidak ditemukan atau tidak sesuai dengan kolam.",
        success: null,
      };
    }
  }

  // -------------------------------------------
  // 11. DATABASE TRANSACTION
  // -------------------------------------------

  try {
    const activity = await prisma.$transaction(
      async (tx) => {

        // Periksa kembali akses kolam.
        const membership = await tx.pondMember.findUnique({
          where: {
            pondId_userId: {
              pondId: data.pondId,
              userId: user.id,
            },
          },
        });

        if (!membership) {
          throw new Error(
            "Penugasan kolam sudah tidak berlaku."
          );
        }

        // Ambil telemetri terakhir dari MySQL.
        const parameters = [
          "PH",
          "TEMPERATURE",
          "TDS",
        ] as const;

        const readings = await Promise.all(
          parameters.map((parameter) =>
            tx.waterReading.findFirst({
              where: {
                pondId: data.pondId,
                parameter,
              },
              orderBy: {
                observedAt: "desc",
              },
              select: {
                value: true,
                observedAt: true,
              },
            })
          )
        );

        const latest = readings
          .filter((item) => item !== null)
          .sort(
            (a, b) =>
              b.observedAt.getTime() -
              a.observedAt.getTime()
          )[0];

        // Simpan aktivitas beserta pengeluaran.
        return tx.operationalActivity.create({
          data: {
            pondId: data.pondId,

            alertId: data.alertId || null,

            type: data.type,

            activityAt,

            description:
              data.description ||
              data.instruction ||
              "Draft aktivitas operasional",

            instruction: data.instruction || null,

            status,

            result: data.result || null,

            recordState: data.saveMode,

            recordedById: user.id,

            assignedToId,

            performedById:
              needsPerformance
                ? performedById
                : null,

            performedAt,

            phSnapshot:
              readings[0]?.value ?? null,

            temperatureSnapshot:
              readings[1]?.value ?? null,

            tdsSnapshot:
              readings[2]?.value ?? null,

            telemetryAt:
              latest?.observedAt ?? null,

            // Expense disimpan bersamaan dengan aktivitas.
            expenses:
              amount > 0
                ? {
                    create: {
                      category:
                        data.expenseCategory,

                      description:
                        data.expenseDescription || null,

                      amount: amount.toFixed(2),

                      occurredAt: expenseAt!,

                      ...(receipt ?? {}),
                    },
                  }
                : undefined,
          },
        });
      }
    );

    // -----------------------------------------
    // 12. REVALIDATE
    // -----------------------------------------

    revalidatePath("/operations");
    revalidatePath("/operations/new");
    revalidatePath("/operations/history");
    revalidatePath("/expenses");
    revalidatePath("/dashboard");

    // -----------------------------------------
    // 13. REDIRECT SUCCESS
    // -----------------------------------------

    redirect(
      `/operations/history?saved=${encodeURIComponent(activity.id)}`
    );

  } catch (error) {

    // Redirect Next.js harus diteruskan.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    console.error("SAVE ACTIVITY:", error);

    return {
      error:
        error instanceof Error &&
        error.message === "Penugasan kolam sudah tidak berlaku."
          ? error.message
          : "Aktivitas gagal disimpan. Periksa penugasan kolam dan coba lagi.",
      success: null,
    };
  }
}
