
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckSquare,
  Droplets,
  Plus,
  Search,
  Waves,
} from "lucide-react";

export type TelemetryStatus =
  | "NORMAL"
  | "WARNING"
  | "NO_DATA"
  | "NO_THRESHOLD";

export type PondSummaryStatus =
  | "NORMAL"
  | "WARNING"
  | "INCOMPLETE";

type TelemetryData = {
  parameter: "PH" | "TEMPERATURE" | "TDS" | "DO";
  label: "pH Air" | "Suhu" | "TDS Air" | "DO";
  value: number | null;
  unit: string;
  observedAt: string | null;
  status: TelemetryStatus;
};

export type PondCardData = {
  id: string;
  code: string;
  name: string;
  fishSpecies: string | null;
  telemetry: TelemetryData[];
  summaryStatus: PondSummaryStatus;
};

type Props = {
  ponds: PondCardData[];
  canCreatePond: boolean;
};

type FilterType = "ALL" | "NORMAL" | "WARNING";

const statusConfig: Record<
  TelemetryStatus,
  { label: string; className: string }
> = {
  NORMAL: {
    label: "Normal",
    className: "text-green-700",
  },
  WARNING: {
    label: "Perlu Tindak Lanjut",
    className: "text-red-600",
  },
  NO_DATA: {
    label: "Belum Ada Data",
    className: "text-slate-500",
  },
  NO_THRESHOLD: {
    label: "Batas Belum Diatur",
    className: "text-amber-700",
  },
};

function formatDate(value: string | null) {
  if (!value) return "Belum tersedia";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatValue(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

function MetricItem({ metric }: { metric: TelemetryData }) {
  const warning = metric.status === "WARNING";
  const config = statusConfig[metric.status];

  const valueText =
    metric.value === null
      ? "—"
      : metric.parameter === "PH"
        ? formatValue(metric.value)
        : `${formatValue(metric.value)}${metric.unit ? ` ${metric.unit}` : ""}`;

  return (
    <div className="min-w-0 flex-1 px-2 text-center">
      <p className="truncate text-[11px] font-medium text-slate-600">
        {metric.label}
      </p>

      <p
        className={`mt-1 whitespace-nowrap text-[15px] font-bold ${
          warning ? "text-red-600" : "text-slate-800"
        }`}
      >
        {valueText}
      </p>

      <p
        className={`mt-0.5 min-h-[16px] text-[10px] font-medium leading-4 ${
          config.className
        }`}
      >
        {config.label}
      </p>

      <p
        className="mt-1 truncate text-[9px] text-slate-500"
        title={formatDate(metric.observedAt)}
      >
        {formatDate(metric.observedAt)}
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  type,
}: {
  title: string;
  value: number;
  description: string;
  type: "total" | "normal" | "warning";
}) {
  const config = {
    total: {
      icon: Droplets,
      iconClass: "bg-blue-100 text-blue-600",
      valueClass: "text-slate-900",
    },
    normal: {
      icon: CheckSquare,
      iconClass: "bg-green-100 text-green-800",
      valueClass: "text-slate-900",
    },
    warning: {
      icon: AlertTriangle,
      iconClass: "bg-red-100 text-red-600",
      valueClass: "text-red-600",
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className="flex min-h-[147px] items-center justify-between rounded-xl border border-[#d6d6d6] bg-white px-4 py-5 shadow-sm sm:px-5">
      <div className="min-w-0">
        <p className="text-[12px] text-slate-600">{title}</p>

        <p className={`mt-1 text-[29px] font-bold leading-8 ${config.valueClass}`}>
          {value}
        </p>

        <p className={`text-[26px] font-bold leading-8 ${config.valueClass}`}>
          Kolam
        </p>

        <p className="mt-1 text-[11px] text-slate-600">
          {description}
        </p>
      </div>

      <div
        className={`ml-3 flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
      >
        <Icon size={25} strokeWidth={2} />
      </div>
    </div>
  );
}

export function WaterQualityOverview({
  ponds,
  canCreatePond,
}: Props) {
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [selectedPond, setSelectedPond] = useState<string | null>(
    ponds[0]?.id ?? null
  );

  const statistics = useMemo(() => {
    return {
      total: ponds.length,
      normal: ponds.filter(
        (pond) => pond.summaryStatus === "NORMAL"
      ).length,
      warning: ponds.filter(
        (pond) => pond.summaryStatus === "WARNING"
      ).length,
      incomplete: ponds.filter(
        (pond) => pond.summaryStatus === "INCOMPLETE"
      ).length,
    };
  }, [ponds]);

  const filteredPonds = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return ponds.filter((pond) => {
      const matchesSearch =
        !keyword ||
        pond.name.toLowerCase().includes(keyword) ||
        pond.code.toLowerCase().includes(keyword) ||
        (pond.fishSpecies ?? "").toLowerCase().includes(keyword);

      const matchesFilter =
        filter === "ALL" ||
        (filter === "NORMAL" && pond.summaryStatus === "NORMAL") ||
        (filter === "WARNING" && pond.summaryStatus === "WARNING");

      return matchesSearch && matchesFilter;
    });
  }, [ponds, search, filter]);

  return (
    <div className="w-full space-y-6 bg-white">

      {/* DESKRIPSI DAN TOMBOL TAMBAH KOLAM */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="max-w-[650px]">
          <p className="text-[14px] leading-6 text-[#555555]">
            Pemantauan terpusat kondisi pH, suhu, dan dissolved oxygen
            (DO) kolam budidaya Pokdakan Pondok Lestari.
          </p>

          {statistics.incomplete > 0 && (
            <p className="mt-1 text-xs text-amber-700">
              {statistics.incomplete} kolam memiliki data atau konfigurasi
              ambang batas yang belum lengkap.
            </p>
          )}
        </div>

        {canCreatePond && (
          <Link
            href="/ponds/new"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0862F7] px-4 text-[13px] font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={17} />
            Tambah Kolam
          </Link>
        )}
      </section>

      {/* STATISTIK */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Total Kolam Aktif"
          value={statistics.total}
          description="Seluruh kolam budidaya"
          type="total"
        />

        <StatCard
          title="Kondisi Aman / Normal"
          value={statistics.normal}
          description="Seluruh parameter terpantau normal"
          type="normal"
        />

        <StatCard
          title="Kritis / Perlu Tindak Lanjut"
          value={statistics.warning}
          description="Parameter air di luar batas"
          type="warning"
        />
      </section>

      {/* FILTER DAN PENCARIAN */}
      <section className="flex flex-col gap-3 rounded-xl border border-[#d6d6d6] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            aria-pressed={filter === "ALL"}
            className={`rounded-lg px-5 py-2 text-[12px] font-medium transition ${
              filter === "ALL"
                ? "bg-[#0862F7] text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Semua
          </button>

          <button
            type="button"
            onClick={() => setFilter("NORMAL")}
            aria-pressed={filter === "NORMAL"}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-[12px] font-medium transition ${
              filter === "NORMAL"
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-green-100 bg-white text-green-700 hover:bg-green-50"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
            Normal
          </button>

          <button
            type="button"
            onClick={() => setFilter("WARNING")}
            aria-pressed={filter === "WARNING"}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-[12px] font-medium transition ${
              filter === "WARNING"
                ? "border-red-300 bg-red-50 text-red-600"
                : "border-red-100 bg-white text-red-600 hover:bg-red-50"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
            Perlu Tindak Lanjut
          </button>
        </div>

        <div className="relative w-full sm:max-w-[320px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama kolam atau komoditas..."
            aria-label="Cari nama kolam atau komoditas"
            className="h-9 w-full rounded-lg border border-[#d6d6d6] bg-[#fffafa] pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      {/* DAFTAR KOLAM */}
      {filteredPonds.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPonds.map((pond) => {
            const isSelected = selectedPond === pond.id;
            const isWarning = pond.summaryStatus === "WARNING";

            return (
              <button
                key={pond.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedPond(pond.id)}
                className={`min-w-0 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected
                    ? "border-blue-300 ring-1 ring-blue-200"
                    : isWarning
                      ? "border-red-200"
                      : "border-[#e0e0e0]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3
                    className={`truncate text-[15px] font-semibold ${
                      isWarning ? "text-red-600" : "text-[#252525]"
                    }`}
                  >
                    {pond.code} &quot;{pond.name}&quot;
                  </h3>

                  <span className="sr-only">
                    {pond.summaryStatus}
                  </span>
                </div>

                <div
                  className={`grid grid-cols-3 divide-x rounded-lg border py-2 ${
                    isWarning
                      ? "border-red-200 bg-red-50/30"
                      : "border-[#eeeeee] bg-[#fcfafa]"
                  }`}
                >
                  {pond.telemetry.map((metric) => (
                    <MetricItem
                      key={metric.parameter}
                      metric={metric}
                    />
                  ))}
                </div>

                {pond.fishSpecies && (
                  <p className="mt-2 truncate text-[10px] text-slate-500">
                    Komoditas: {pond.fishSpecies}
                  </p>
                )}
              </button>
            );
          })}
        </section>
      ) : (
        <section className="flex min-h-[230px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-5 text-center">
          <Waves size={35} className="mb-3 text-slate-400" />

          <h3 className="text-sm font-semibold text-slate-800">
            {ponds.length === 0
              ? "Belum Ada Kolam"
              : "Kolam Tidak Ditemukan"}
          </h3>

          <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
            {ponds.length === 0
              ? canCreatePond
                ? "Silakan daftarkan kolam terlebih dahulu untuk mulai melakukan monitoring kualitas air."
                : "Belum ada kolam yang ditugaskan kepada akun kamu. Hubungi Admin untuk mendapatkan penugasan."
              : "Coba gunakan kata kunci lain atau ubah filter pencarian."}
          </p>

          {canCreatePond && ponds.length === 0 && (
            <Link
              href="/ponds/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={15} />
              Daftarkan Kolam
            </Link>
          )}
        </section>
      )}

      {/* INFORMASI JUMLAH */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <p>
          Menampilkan{" "}
          <strong className="text-slate-700">
            {filteredPonds.length}
          </strong>{" "}
          dari{" "}
          <strong className="text-slate-700">
            {ponds.length}
          </strong>{" "}
          kolam yang dapat diakses.
        </p>

        <p>
          Data berdasarkan pembacaan sensor terakhir yang tersimpan.
        </p>
      </div>
    </div>
  );
}
