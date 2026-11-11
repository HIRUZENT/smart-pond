
import { connection } from "next/server";

import { requireUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { ActivityEntryForm } from "@/components/operations/activity-entry-form";

type TelemetryStatus = "ATTENTION" | "NORMAL" | "UNCONFIGURED";

export type TelemetryValue = {
  value: number;
  unit: string;
  observedAt: string;
  status: TelemetryStatus;
};

export type TelemetryByPond = Record<
  string,
  Partial<
    Record<"PH" | "TEMPERATURE" | "TDS", TelemetryValue>
  >
>;

export default async function NewOperationPage({
  searchParams,
}: {
  searchParams: Promise<{ alertId?: string }>;
}) {
  await connection();

  const user = await requireUser();
  const params = await searchParams;

  // Kolam Admin ditampilkan seluruhnya.
  // Manager dan Operator hanya melihat kolam penugasannya.
  const ponds = await prisma.pond.findMany({
    where: {
      isActive: true,
      ...(user.role === "ADMIN"
        ? {}
        : {
            members: {
              some: {
                userId: user.id,
              },
            },
          }),
    },
    select: {
      id: true,
      code: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const pondIds = ponds.map((pond) => pond.id);

  // Mengambil petugas yang ditugaskan pada kolam pengguna.
  const staff = pondIds.length
    ? await prisma.user.findMany({
        where: {
          isActive: true,
          role: {
            in: ["MANAGER", "OPERATOR"],
          },
          pondMemberships: {
            some: {
              pondId: {
                in: pondIds,
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          role: true,
          pondMemberships: {
            where: {
              pondId: {
                in: pondIds,
              },
            },
            select: {
              pondId: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      })
    : [];

  // Mengambil data sensor terbaru.
  const [readings, thresholds] = pondIds.length
    ? await Promise.all([
        prisma.waterReading.findMany({
          where: {
            pondId: {
              in: pondIds,
            },
            parameter: {
              in: ["PH", "TEMPERATURE", "TDS"],
            },
          },
          orderBy: {
            observedAt: "desc",
          },
          select: {
            pondId: true,
            parameter: true,
            value: true,
            unit: true,
            observedAt: true,
          },
        }),

        prisma.waterThreshold.findMany({
          where: {
            pondId: {
              in: pondIds,
            },
            parameter: {
              in: ["PH", "TEMPERATURE", "TDS"],
            },
            isEnabled: true,
          },
          select: {
            pondId: true,
            parameter: true,
            minValue: true,
            maxValue: true,
          },
        }),
      ])
    : [[], []];

  const telemetryByPond: TelemetryByPond = {};

  // Karena data diurutkan terbaru dahulu,
  // pembacaan pertama per parameter adalah pembacaan terakhir.
  for (const reading of readings) {
    if (!telemetryByPond[reading.pondId]) {
      telemetryByPond[reading.pondId] = {};
    }

    const parameter = reading.parameter as
      | "PH"
      | "TEMPERATURE"
      | "TDS";

    if (telemetryByPond[reading.pondId][parameter]) {
      continue;
    }

    const threshold = thresholds.find(
      (item) =>
        item.pondId === reading.pondId &&
        item.parameter === reading.parameter
    );

    const value = Number(reading.value);

    const hasThreshold =
      threshold &&
      (threshold.minValue !== null ||
        threshold.maxValue !== null);

    let status: TelemetryStatus = "UNCONFIGURED";

    if (hasThreshold && threshold) {
      const belowMinimum =
        threshold.minValue !== null &&
        value < Number(threshold.minValue);

      const aboveMaximum =
        threshold.maxValue !== null &&
        value > Number(threshold.maxValue);

      status =
        belowMinimum || aboveMaximum
          ? "ATTENTION"
          : "NORMAL";
    }

    telemetryByPond[reading.pondId][parameter] = {
      value,
      unit: reading.unit,
      observedAt: reading.observedAt.toISOString(),
      status,
    };
  }

  // Jika halaman dibuka dari notifikasi,
  // ambil konteks pengingat yang terkait.
  const alert = params.alertId && pondIds.length
    ? await prisma.alert.findFirst({
        where: {
          id: params.alertId,
          pondId: {
            in: pondIds,
          },
        },
        select: {
          id: true,
          pondId: true,
          message: true,
          occurredAt: true,
        },
      })
    : null;

  const pondOptions = ponds.map((pond) => ({
    id: pond.id,
    code: pond.code,
    name: pond.name,
  }));

  const staffOptions = staff.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    pondIds: member.pondMemberships.map(
      (membership) => membership.pondId
    ),
  }));

  return (
    <ActivityEntryForm
      ponds={pondOptions}
      staff={staffOptions}
      telemetryByPond={telemetryByPond}
      initialPondId={alert?.pondId ?? ponds[0]?.id ?? ""}
      alert={
        alert
          ? {
              id: alert.id,
              message: alert.message,
              occurredAt: alert.occurredAt.toISOString(),
            }
          : null
      }
    />
  );
}
