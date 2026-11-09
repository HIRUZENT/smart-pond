
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Plus,
  X,
} from "lucide-react";

import { prisma } from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/auth";
import { getAccessiblePondIds } from "@/lib/pond-access";

type Props = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

const statusLabels = {
  PENDING: "Belum Ditangani",
  IN_PROGRESS: "Sedang Ditangani",
  COMPLETED: "Selesai",
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

async function HistoryContent({
  searchParams,
}: Props) {
  await connection();

  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const pondIds = await getAccessiblePondIds(user);

  const activities =
    await prisma.operationalActivity.findMany({
      where: {
        pondId: { in: pondIds },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      include: {
        pond: {
          select: {
            name: true,
          },
        },
        recordedBy: {
          select: {
            name: true,
          },
        },
        expenses: {
          select: {
            id: true,
            amount: true,
            category: true,
            receiptName: true,
          },
        },
      },
    });

  const query = await searchParams;

  const saved = activities.find(
    (item) => item.id === query.saved
  );

  const expenseTotal = (
    activity: (typeof activities)[number]
  ) =>
    activity.expenses.reduce(
      (sum, item) => sum + Number(item.amount),
      0
    );

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      {saved && (
        <div
          role="status"
          className="relative rounded-xl border border-green-200 bg-white p-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={26}
              className="shrink-0 text-green-600"
            />

            <div className="min-w-0 flex-1">
              <h2 className="text-[14px] font-bold text-green-700">
                Data Aktivitas Berhasil Disimpan!
              </h2>

              <p className="mt-1 text-[12px] text-slate-600">
                {saved.pond.name} tercatat:{" "}
                <span className="font-semibold text-amber-700">
                  {saved.recordState === "DRAFT"
                    ? "Draft"
                    : statusLabels[
                        saved.status ?? "PENDING"
                      ]}
                </span>
                . Beban operasional{" "}
                {rupiah.format(expenseTotal(saved))}
                {" "}tercatat.
              </p>

              <a
                href={`#activity-${saved.id}`}
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-blue-600"
              >
                Lihat
                <ExternalLink size={13} />
              </a>
            </div>

            <Link
              href="/operations/history"
              aria-label="Tutup notifikasi"
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={17} />
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Riwayat Aktivitas Operasional
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Aktivitas dari kolam yang dapat kamu akses.
          </p>
        </div>

        {user.role !== "ADMIN" && (
          <Link
            href="/operations"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0754CC] px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Catat Aktivitas
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <article
            key={activity.id}
            id={`activity-${activity.id}`}
            className="scroll-mt-24 rounded-xl border border-[#C8D0E5] bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold text-slate-900">
                  {activity.pond.name}
                </p>
                <p className="mt-1 text-[12px] text-slate-500">
                  {activity.activityAt.toLocaleString(
                    "id-ID",
                    {
                      timeZone: "Asia/Jakarta",
                      dateStyle: "medium",
                      timeStyle: "short",
                    }
                  )}{" "}
                  WIB · {activity.recordedBy.name}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  activity.recordState === "DRAFT"
                    ? "bg-slate-100 text-slate-600"
                    : activity.status === "COMPLETED"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-800"
                }`}
              >
                {activity.recordState === "DRAFT"
                  ? "Draft"
                  : statusLabels[
                      activity.status ?? "PENDING"
                    ]}
              </span>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">
              {activity.description}
            </p>

            {activity.instruction && (
              <div className="mt-3 rounded-lg bg-blue-50 p-3 text-[12px] text-slate-700">
                <span className="font-semibold">
                  Arahan:
                </span>{" "}
                {activity.instruction}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-[13px] text-slate-600">
                Pengeluaran:{" "}
                <strong className="text-slate-900">
                  {rupiah.format(
                    expenseTotal(activity)
                  )}
                </strong>
              </span>

              <div className="flex flex-wrap gap-3">
                {activity.expenses
                  .filter((expense) => expense.receiptName)
                  .map((expense) => (
                    <a
                      key={expense.id}
                      href={`/api/expenses/${expense.id}/receipt`}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:underline"
                    >
                      <FileText size={15} />
                      Unduh Nota
                    </a>
                  ))}
              </div>
            </div>
          </article>
        ))}

        {activities.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Belum ada aktivitas yang tercatat.
          </div>
        )}
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-[12px] text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={15} />
        Kembali
      </Link>
    </div>
  );
}

export default function OperationsHistoryPage(
  props: Props
) {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-slate-500">
          Memuat riwayat aktivitas...
        </div>
      }
    >
      <HistoryContent {...props} />
    </Suspense>
  );
}
