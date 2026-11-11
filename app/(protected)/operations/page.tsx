
import { redirect } from "next/navigation";

import { prisma } from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/auth";

import {
  OperationsOverview,
  type OperationRow,
} from "@/components/operations/operations-overview";

export default async function OperationsPage() {
  // =========================================
  // 1. AUTENTIKASI
  // =========================================

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // =========================================
  // 2. BATASAN AKSES BERDASARKAN ROLE
  // =========================================

  // ADMIN melihat semua kolam.
  // MANAGER dan OPERATOR hanya melihat kolam
  // yang ditugaskan melalui PondMember.

  const pondScope =
    user.role === "ADMIN"
      ? {}
      : {
        members: {
          some: {
            userId: user.id,
          },
        },
      };

  // =========================================
  // 3. AMBIL DAFTAR KOLAM
  // =========================================

  const ponds = await prisma.pond.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      fishSpecies: true,
      isActive: true,
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

  // =========================================
  // 4. AMBIL RIWAYAT AKTIVITAS
  // =========================================

  const activities = await prisma.operationalActivity.findMany({
    where: {
      pond: pondScope,
    },

    include: {
      // Identitas kolam
      pond: {
        select: {
          id: true,
          code: true,
          name: true,
          fishSpecies: true,
        },
      },

      // Konteks pengingat
      alert: {
        select: {
          id: true,
          trigger: true,
          parameter: true,
          measuredValue: true,
          minValueSnapshot: true,
          maxValueSnapshot: true,
          message: true,
          occurredAt: true,

          // Jadwal jika alert berasal dari jadwal.
          schedule: {
            select: {
              title: true,
              nextRunAt: true,
              intervalMinutes: true,
            },
          },

          // Pembacaan sensor jika alert berasal
          // dari kondisi kualitas air.
          reading: {
            select: {
              parameter: true,
              value: true,
              unit: true,
              observedAt: true,
            },
          },
        },
      },

      // Pengguna yang mencatat
      recordedBy: {
        select: {
          id: true,
          name: true,
        },
      },

      // Pengguna yang ditugaskan
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },

      // Pengguna yang melaksanakan
      performedBy: {
        select: {
          id: true,
          name: true,
        },
      },

      // Pengeluaran aktivitas
      expenses: {
        select: {
          id: true,
          category: true,
          amount: true,
          occurredAt: true,
          description: true,
        },

        orderBy: {
          occurredAt: "desc",
        },
      },
    },

    orderBy: [
      {
        activityAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  // =========================================
  // 5. KONVERSI DATA PRISMA
  // =========================================

  // Decimal dan Date perlu dikonversi menjadi
  // tipe sederhana sebelum dikirim ke Client Component.

  const pondOptions = ponds.map((pond) => ({
    id: pond.id,
    code: pond.code,
    name: pond.name,
    isActive: pond.isActive,
  }));

  const operationRows: OperationRow[] = activities.map(
    (activity) => {

      const expenses = activity.expenses.map((expense) => ({
        id: expense.id,
        category: expense.category,
        amount: Number(expense.amount.toString()),
        occurredAt: expense.occurredAt.toISOString(),
        description: expense.description,
      }));

      const expenseTotal = expenses.reduce(
        (total, expense) => total + expense.amount,
        0
      );

      return {
        id: activity.id,

        pond: {
          id: activity.pond.id,
          code: activity.pond.code,
          name: activity.pond.name,
          fishSpecies: activity.pond.fishSpecies,
        },

        type: activity.type,
        activityAt: activity.activityAt.toISOString(),

        description: activity.description,
        instruction: activity.instruction,
        status: activity.status,
        result: activity.result,

        recordState: activity.recordState,

        assignedTo: activity.assignedTo
          ? {
            id: activity.assignedTo.id,
            name: activity.assignedTo.name,
          }
          : null,

        performedBy: activity.performedBy
          ? {
            id: activity.performedBy.id,
            name: activity.performedBy.name,
          }
          : null,

        recordedBy: {
          id: activity.recordedBy.id,
          name: activity.recordedBy.name,
        },

        performedAt:
          activity.performedAt?.toISOString() ?? null,

        alert: activity.alert
          ? {
            id: activity.alert.id,
            trigger: activity.alert.trigger,
            parameter: activity.alert.parameter,
            measuredValue:
              activity.alert.measuredValue !== null
                ? Number(
                  activity.alert.measuredValue.toString()
                )
                : null,

            minValueSnapshot:
              activity.alert.minValueSnapshot !== null
                ? Number(
                  activity.alert.minValueSnapshot.toString()
                )
                : null,

            maxValueSnapshot:
              activity.alert.maxValueSnapshot !== null
                ? Number(
                  activity.alert.maxValueSnapshot.toString()
                )
                : null,

            message: activity.alert.message,
            occurredAt:
              activity.alert.occurredAt.toISOString(),

            reading: activity.alert.reading
              ? {
                parameter: activity.alert.reading.parameter,
                value: Number(
                  activity.alert.reading.value.toString()
                ),
                unit: activity.alert.reading.unit,
                observedAt:
                  activity.alert.reading.observedAt.toISOString(),
              }
              : null,

            schedule: activity.alert.schedule
              ? {
                title: activity.alert.schedule.title,
                nextRunAt:
                  activity.alert.schedule.nextRunAt.toISOString(),
                intervalMinutes:
                  activity.alert.schedule.intervalMinutes,
              }
              : null,
          }
          : null,

        expenses,
        expenseTotal,

        createdAt: activity.createdAt.toISOString(),
        updatedAt: activity.updatedAt.toISOString(),
      };
    }
  );

  // =========================================
  // 6. RENDER
  // =========================================

  return (
    <OperationsOverview
      activities={operationRows}
      ponds={pondOptions}
      canCreateActivity={true}
    />
  );
}
