
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/auth";
import { canAccessPond } from "@/lib/pond-access";

export type ActivityFormState = {
  error: string | null;
};

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
  status: z.enum([
    "PENDING",
    "IN_PROGRESS",
    "COMPLETED",
  ]),
  expenseDescription: z.string().trim().max(500),
  expenseAmount: z.string(),
  saveMode: z.enum(["DRAFT", "SUBMITTED"]),
});

function readText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function parseForm(formData: FormData) {
  return schema.safeParse({
    pondId: readText(formData, "pondId"),
    date: readText(formData, "date"),
    time: readText(formData, "time"),
    type: readText(formData, "type"),
    description: readText(formData, "description"),
    instruction: readText(formData, "instruction"),
    assignedToId: readText(formData, "assignedToId"),
    status: readText(formData, "status"),
    expenseDescription: readText(
      formData,
      "expenseDescription"
    ),
    expenseAmount:
      readText(formData, "expenseAmount") || "0",
    saveMode: readText(formData, "saveMode"),
  });
}

async function readReceipt(formData: FormData) {
  const value = formData.get("receipt");

  if (!value || typeof value === "string") {
    return null;
  }

  if (value.size === 0) return null;

  // Lebih kecil dari limit request Server Action.
  if (value.size > 650_000) {
    throw new Error(
      "Lampiran maksimal 650 KB."
    );
  }

  const bytes = new Uint8Array(
    await value.arrayBuffer()
  );

  const isPdf =
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d;

  const isPng =
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => bytes[index] === byte
    );

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

export async function saveActivityAction(
  _previous: ActivityFormState,
  formData: FormData
): Promise<ActivityFormState> {
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
    };
  }

  const parsed = parseForm(formData);

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Data formulir tidak valid.",
    };
  }

  const data = parsed.data;

  const allowed = await canAccessPond(
    user,
    data.pondId
  );

  if (!allowed) {
    return {
      error:
        "Kamu tidak memiliki akses ke kolam tersebut.",
    };
  }

  // Timestamp memakai zona waktu WIB.
  const activityAt = new Date(
    `${data.date}T${data.time}:00+07:00`
  );

  if (Number.isNaN(activityAt.getTime())) {
    return {
      error: "Tanggal atau waktu tidak valid.",
    };
  }

  const amount = Number(data.expenseAmount);

  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > 999_999_999_999.99
  ) {
    return {
      error: "Nominal pengeluaran tidak valid.",
    };
  }

  if (
    data.saveMode === "SUBMITTED" &&
    !data.description &&
    !data.instruction
  ) {
    return {
      error:
        "Isi catatan aktivitas atau arahan tindakan.",
    };
  }

  if (amount > 0 && !data.expenseDescription) {
    return {
      error: "Isi keterangan pengeluaran.",
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
    };
  }

  if (receipt && amount === 0) {
    return {
      error:
        "Isi nominal pengeluaran sebelum melampirkan nota.",
    };
  }

  let assignedToId: string | null = null;

  if (user.role === "MANAGER") {
    assignedToId = data.assignedToId || null;

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
          error:
            "Petugas tidak terdaftar pada kolam tersebut.",
        };
      }
    }
  } else {
    // Petugas tidak bisa menugaskan orang lain.
    assignedToId = user.id;
  }

  try {
    const activity = await prisma.$transaction(
      async (tx) => {
        // Periksa kembali akses saat transaksi.
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

        // Ambil data terakhir dari histori MySQL.
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

        return tx.operationalActivity.create({
          data: {
            pondId: data.pondId,
            type: data.type,
            activityAt,
            description:
              data.description ||
              data.instruction ||
              "Draft aktivitas operasional",
            instruction: data.instruction || null,
            status: data.status,
            recordState: data.saveMode,
            recordedById: user.id,
            assignedToId,

            phSnapshot: readings[0]?.value ?? null,
            temperatureSnapshot:
              readings[1]?.value ?? null,
            tdsSnapshot: readings[2]?.value ?? null,
            telemetryAt: latest?.observedAt ?? null,

            expenses:
              amount > 0
                ? {
                    create: {
                      category:
                        data.expenseDescription.slice(0, 100),
                      description:
                        data.expenseDescription,
                      amount: amount.toFixed(2),
                      occurredAt: activityAt,
                      ...(receipt ?? {}),
                    },
                  }
                : undefined,
          },
        });
      }
    );

    revalidatePath("/operations/history");
    revalidatePath("/expenses");

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
        "Aktivitas gagal disimpan. Periksa penugasan kolam dan coba lagi.",
    };
  }
}
