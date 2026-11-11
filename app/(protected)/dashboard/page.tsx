
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/auth";

import {
  WaterQualityOverview,
  type PondCardData,
  type PondSummaryStatus,
  type TelemetryStatus,
} from "@/components/dashboard/water-quality-overview";

// =============================================
// KONFIGURASI PARAMETER KUALITAS AIR
// =============================================

const parameterSpecs = [
  {
    parameter: "PH",
    label: "pH Air",
    fallbackUnit: "",
  },
  {
    parameter: "TEMPERATURE",
    label: "Suhu",
    fallbackUnit: "°C",
  },
  {
    parameter: "TDS",
    label: "TDS Air",
    fallbackUnit: "mg/L",
  },
] as const;

// =============================================
// LOADING STATE
// =============================================

function DashboardLoading() {
  return (
    <div className="w-full animate-pulse space-y-6 bg-white">

      {/* Header */}
      <div className="flex justify-between gap-4">
        <div className="h-10 w-2/3 rounded bg-slate-100" />
        <div className="h-9 w-32 rounded bg-slate-100" />
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-[147px] rounded-xl border bg-white p-5"
          >
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="mt-4 h-8 w-20 rounded bg-slate-200" />
            <div className="mt-2 h-6 w-24 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="h-14 rounded-xl bg-slate-100" />

      {/* Kartu kolam */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="h-44 rounded-xl border bg-white p-5"
          >
            <div className="h-5 w-32 rounded bg-slate-200" />
            <div className="mt-5 h-20 rounded-lg bg-slate-100" />
          </div>
        ))}
      </div>

    </div>
  );
}

// =============================================
// DASHBOARD PAGE
// =============================================

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

// =============================================
// DASHBOARD CONTENT
// =============================================

async function DashboardContent() {
  await connection();

  // -------------------------------------------
  // 1. AUTENTIKASI PENGGUNA
  // -------------------------------------------

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // OPERATOR tidak memiliki akses dashboard monitoring.
  if (user.role === "OPERATOR") {
    redirect("/operations");
  }

  // -------------------------------------------
  // 2. PEMBATASAN AKSES KOLAM
  // -------------------------------------------

  // ADMIN:
  // Melihat seluruh kolam aktif.
  //
  // MANAGER:
  // Hanya melihat kolam yang ditugaskan kepadanya.

  const pondWhere =
    user.role === "ADMIN"
      ? {
          isActive: true,
        }
      : {
          isActive: true,
          members: {
            some: {
              userId: user.id,
            },
          },
        };

  // -------------------------------------------
  // 3. AMBIL DATA KOLAM DARI DATABASE
  // -------------------------------------------

  const pondRecords = await prisma.pond.findMany({
    where: pondWhere,

    select: {
      id: true,
      code: true,
      name: true,
      fishSpecies: true,
    },

    orderBy: [
      {
        createdAt: "asc",
      },
      {
        code: "asc",
      },
    ],
  });

  const pondIds = pondRecords.map((pond) => pond.id);

  // Data kartu kolam.
  let pondData: PondCardData[] = [];

  // -------------------------------------------
  // 4. AMBIL DATA TELEMETRI DAN THRESHOLD
  // -------------------------------------------

  if (pondIds.length > 0) {

    const [readings, thresholds] = await Promise.all([

      // Pembacaan sensor terakhir setiap kolam.
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

        distinct: ["pondId", "parameter"],

        select: {
          pondId: true,
          parameter: true,
          value: true,
          unit: true,
          observedAt: true,
        },
      }),

      // Ambang batas kualitas air.
      prisma.waterThreshold.findMany({
        where: {
          pondId: {
            in: pondIds,
          },

          isEnabled: true,

          parameter: {
            in: ["PH", "TEMPERATURE", "TDS"],
          },
        },

        select: {
          pondId: true,
          parameter: true,
          minValue: true,
          maxValue: true,
        },
      }),

    ]);

    // -----------------------------------------
    // 5. PEMETAAN DATA SENSOR
    // -----------------------------------------

    const readingMap = new Map<
      string,
      (typeof readings)[number]
    >();

    for (const reading of readings) {
      readingMap.set(
        `${reading.pondId}:${reading.parameter}`,
        reading
      );
    }

    // -----------------------------------------
    // 6. PEMETAAN THRESHOLD
    // -----------------------------------------

    const thresholdMap = new Map<
      string,
      (typeof thresholds)[number]
    >();

    for (const threshold of thresholds) {
      thresholdMap.set(
        `${threshold.pondId}:${threshold.parameter}`,
        threshold
      );
    }

    // -----------------------------------------
    // 7. BENTUK DATA KARTU SETIAP KOLAM
    // -----------------------------------------

    pondData = pondRecords.map((pond) => {

      const telemetry = parameterSpecs.map((spec) => {

        const key = `${pond.id}:${spec.parameter}`;

        const reading = readingMap.get(key);
        const threshold = thresholdMap.get(key);

        const value = reading
          ? Number(reading.value.toString())
          : null;

        // Status awal jika belum terdapat pembacaan.
        let status: TelemetryStatus = "NO_DATA";

        if (reading) {

          const minValue = threshold?.minValue != null
            ? Number(threshold.minValue.toString())
            : null;

          const maxValue = threshold?.maxValue != null
            ? Number(threshold.maxValue.toString())
            : null;

          const hasBoundary =
            minValue !== null || maxValue !== null;

          // Belum ada konfigurasi ambang batas.
          if (!threshold || !hasBoundary) {

            status = "NO_THRESHOLD";

          } else {

            // Periksa nilai minimum.
            const belowMinimum =
              minValue !== null &&
              value !== null &&
              value < minValue;

            // Periksa nilai maksimum.
            const aboveMaximum =
              maxValue !== null &&
              value !== null &&
              value > maxValue;

            // Tentukan kondisi parameter.
            status =
              belowMinimum || aboveMaximum
                ? "WARNING"
                : "NORMAL";
          }
        }

        return {
          parameter: spec.parameter,
          label: spec.label,
          value,
          unit: reading?.unit ?? spec.fallbackUnit,
          observedAt:
            reading?.observedAt.toISOString() ?? null,
          status,
        };
      });

      // ---------------------------------------
      // 8. STATUS KESELURUHAN KOLAM
      // ---------------------------------------

      const hasWarning = telemetry.some(
        (item) => item.status === "WARNING"
      );

      const allNormal = telemetry.every(
        (item) => item.status === "NORMAL"
      );

      const summaryStatus: PondSummaryStatus = hasWarning
        ? "WARNING"
        : allNormal
          ? "NORMAL"
          : "INCOMPLETE";

      // ---------------------------------------
      // 9. HASIL DATA KARTU KOLAM
      // ---------------------------------------

      return {
        id: pond.id,
        code: pond.code,
        name: pond.name,
        fishSpecies: pond.fishSpecies,
        telemetry,
        summaryStatus,
      };
    });
  }

  // -------------------------------------------
  // 10. TAMPILKAN DASHBOARD
  // -------------------------------------------

  return (
    <WaterQualityOverview
      ponds={pondData}
      canCreatePond={user.role === "ADMIN"}
    />
  );
}
