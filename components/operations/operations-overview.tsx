
"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ClipboardList,
    Download,
    Plus,
    Droplet,
    Search,
    ListFilter,
    ArrowUpDown,
    Eye,
    Pencil,
    Check,
    ChevronLeft,
    ChevronRight,
    X,
    CalendarDays,
    Wallet,
    UserRound,
    Clock,
    FileText,
    Bell,
} from "lucide-react";
import { FilterSelect } from "../ui/filter-select";

// =============================================
// TYPES
// =============================================

export type ActivityType =
    | "FEEDING"
    | "WATER_CHANGE"
    | "WATER_ADDITION"
    | "AERATOR"
    | "CLEANING"
    | "FOLLOW_UP"
    | "OTHER";

export type FollowUpStatus =
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED";

export type OperationRow = {
    id: string;

    pond: {
        id: string;
        code: string;
        name: string;
        fishSpecies: string | null;
    };

    type: ActivityType;
    activityAt: string;

    description: string;
    instruction: string | null;
    status: FollowUpStatus | null;
    result: string | null;

    recordState: "DRAFT" | "SUBMITTED";

    assignedTo: {
        id: string;
        name: string;
    } | null;

    performedBy: {
        id: string;
        name: string;
    } | null;

    recordedBy: {
        id: string;
        name: string;
    };

    performedAt: string | null;

    alert: {
        id: string;
        trigger: "WATER_QUALITY" | "SCHEDULE";

        parameter:
        | "PH"
        | "TEMPERATURE"
        | "TDS"
        | "DO"
        | null;

        measuredValue: number | null;
        minValueSnapshot: number | null;
        maxValueSnapshot: number | null;

        message: string;
        occurredAt: string;

        reading: {
            parameter: string;
            value: number;
            unit: string;
            observedAt: string;
        } | null;

        schedule: {
            title: string;
            nextRunAt: string;
            intervalMinutes: number | null;
        } | null;
    } | null;

    expenses: {
        id: string;
        category: string;
        amount: number;
        occurredAt: string;
        description: string | null;
    }[];

    expenseTotal: number;

    createdAt: string;
    updatedAt: string;
};

type PondOption = {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
};

type OperationsOverviewProps = {
    activities: OperationRow[];
    ponds: PondOption[];
    canCreateActivity: boolean;
};

// =============================================
// CONSTANTS
// =============================================

const activityLabels: Record<ActivityType, string> = {
    FEEDING: "Pemberian Pakan",
    WATER_CHANGE: "Ganti Air",
    WATER_ADDITION: "Penambahan Air",
    AERATOR: "Penggunaan Aerator",
    CLEANING: "Pembersihan Kolam",
    FOLLOW_UP: "Tindak Lanjut",
    OTHER: "Aktivitas Lainnya",
};

const statusLabels: Record<FollowUpStatus, string> = {
    PENDING: "ToDo",
    IN_PROGRESS: "Sedang Ditangani",
    COMPLETED: "Selesai",
};

const parameterLabels: Record<string, string> = {
    PH: "pH",
    TEMPERATURE: "Suhu",
    TDS: "TDS",
    DO: "DO",
};

// =============================================
// FORMAT HELPERS
// =============================================

function formatDateTime(value: string | null) {
    if (!value) return "-";

    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    }).format(new Date(value));
}

function formatTime(value: string | null) {
    if (!value) return "-";

    return (
        new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta",
        }).format(new Date(value)) + " WIB"
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 3,
    }).format(value);
}

// =============================================
// STATUS BADGE
// =============================================

function StatusBadge({
    status,
    recordState,
}: {
    status: FollowUpStatus | null;
    recordState: "DRAFT" | "SUBMITTED";
}) {
    if (recordState === "DRAFT") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Draf
            </span>
        );
    }

    if (!status) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Aktivitas Rutin
            </span>
        );
    }

    const styles: Record<FollowUpStatus, string> = {
        PENDING:
            "border-slate-300 bg-slate-100 text-slate-600",

        IN_PROGRESS:
            "border-amber-200 bg-amber-50 text-amber-700",

        COMPLETED:
            "border-green-200 bg-green-50 text-green-700",
    };

    const dotStyles: Record<FollowUpStatus, string> = {
        PENDING: "bg-slate-500",
        IN_PROGRESS: "bg-amber-500",
        COMPLETED: "bg-green-600",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles[status]}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`}
            />
            {statusLabels[status]}
        </span>
    );
}

// =============================================
// REMINDER INFORMATION
// =============================================

function ReminderInfo({
    alert,
}: {
    alert: OperationRow["alert"];
}) {
    if (!alert) {
        return (
            <span className="text-xs text-slate-400">
                Tidak terkait pengingat
            </span>
        );
    }

    if (alert.trigger === "SCHEDULE") {
        const interval = alert.schedule?.intervalMinutes;

        let intervalText = "";

        if (interval && interval >= 1440) {
            intervalText = `Setiap ${interval / 1440} hari`;
        } else if (interval) {
            intervalText = `Setiap ${interval} menit`;
        }

        return (
            <div className="min-w-[180px] space-y-2">
                <p className="text-[13px] font-medium text-slate-800">
                    {alert.schedule?.title ?? alert.message}
                </p>

                {intervalText && (
                    <p className="text-[11px] text-slate-500">
                        Interval berkala:{" "}
                        <strong className="text-slate-700">
                            {intervalText}
                        </strong>
                    </p>
                )}

                <span className="inline-flex rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
                    Jadwal Pemeliharaan
                </span>
            </div>
        );
    }

    const parameter = alert.parameter
        ? parameterLabels[alert.parameter] ?? alert.parameter
        : "Kualitas Air";

    const measuredValue =
        alert.measuredValue ?? alert.reading?.value;

    const unit = alert.reading?.unit ?? "";

    return (
        <div className="min-w-[180px] space-y-2">
            <p className="text-[13px] font-medium text-slate-800">
                {alert.message}
            </p>

            {measuredValue !== null && measuredValue !== undefined && (
                <p className="text-[11px] text-slate-500">
                    {parameter}:{" "}
                    <strong className="text-slate-700">
                        {formatNumber(measuredValue)} {unit}
                    </strong>
                </p>
            )}

            <div className="flex flex-wrap gap-1">
                {alert.minValueSnapshot !== null && (
                    <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700">
                        Min: {formatNumber(alert.minValueSnapshot)}
                    </span>
                )}

                {alert.maxValueSnapshot !== null && (
                    <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] text-red-700">
                        Maks: {formatNumber(alert.maxValueSnapshot)}
                    </span>
                )}
            </div>
        </div>
    );
}

// =============================================
// DETAIL EXPANSION
// =============================================

function ActivityDetail({
    activity,
}: {
    activity: OperationRow;
}) {
    return (
        <div className="grid grid-cols-1 gap-5 rounded-lg bg-slate-50 p-5 md:grid-cols-2">

            <div className="space-y-3">
                <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">
                        Keterangan Aktivitas
                    </p>

                    <p className="text-sm leading-6 text-slate-800">
                        {activity.description}
                    </p>
                </div>

                {activity.instruction && (
                    <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">
                            Arahan Tindakan
                        </p>

                        <p className="text-sm leading-6 text-slate-800">
                            {activity.instruction}
                        </p>
                    </div>
                )}

                {activity.result && (
                    <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">
                            Hasil Tindakan
                        </p>

                        <p className="text-sm leading-6 text-slate-800">
                            {activity.result}
                        </p>
                    </div>
                )}
            </div>

            <div className="space-y-3">

                <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">
                        Informasi Pelaksana
                    </p>

                    <div className="space-y-2 text-xs text-slate-700">
                        <p>
                            Dicatat oleh:{" "}
                            <strong>{activity.recordedBy.name}</strong>
                        </p>

                        <p>
                            Ditugaskan kepada:{" "}
                            <strong>
                                {activity.assignedTo?.name ?? "-"}
                            </strong>
                        </p>

                        <p>
                            Dilaksanakan oleh:{" "}
                            <strong>
                                {activity.performedBy?.name ?? "-"}
                            </strong>
                        </p>

                        <p>
                            Waktu pelaksanaan:{" "}
                            <strong>
                                {formatDateTime(activity.performedAt)}
                            </strong>
                        </p>
                    </div>
                </div>

                <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">
                        Pengeluaran Operasional
                    </p>

                    {activity.expenses.length === 0 ? (
                        <p className="text-xs text-slate-400">
                            Tidak ada pengeluaran tercatat.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {activity.expenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="flex justify-between gap-3 rounded-md border border-slate-200 bg-white p-2.5"
                                >
                                    <div>
                                        <p className="text-xs font-medium text-slate-800">
                                            {expense.category}
                                        </p>

                                        {expense.description && (
                                            <p className="mt-1 text-[10px] text-slate-500">
                                                {expense.description}
                                            </p>
                                        )}
                                    </div>

                                    <p className="whitespace-nowrap text-xs font-semibold text-slate-800">
                                        {formatCurrency(expense.amount)}
                                    </p>
                                </div>
                            ))}

                            <div className="flex justify-between border-t border-slate-200 pt-2 text-xs font-semibold">
                                <span>Total Pengeluaran</span>
                                <span className="text-blue-700">
                                    {formatCurrency(activity.expenseTotal)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

// =============================================
// MAIN COMPONENT
// =============================================

export function OperationsOverview({
    activities,
    ponds,
    canCreateActivity,
}: OperationsOverviewProps) {

    // -------------------------------------------
    // STATE
    // -------------------------------------------

    const [search, setSearch] = useState("");
    const [pondFilter, setPondFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [triggerFilter, setTriggerFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [periodFilter, setPeriodFilter] = useState("ALL");

    const [sortNewest, setSortNewest] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const pageSize = 6;

    // -------------------------------------------
    // FILTER DATA
    // -------------------------------------------

    const filteredActivities = useMemo(() => {

        let result = [...activities];

        // Pencarian
        if (search.trim()) {
            const query = search.toLowerCase();

            result = result.filter((activity) => {

                const operator =
                    activity.performedBy?.name ??
                    activity.assignedTo?.name ??
                    activity.recordedBy.name;

                const reminder =
                    activity.alert?.message ??
                    activity.alert?.schedule?.title ??
                    "";

                return [
                    activity.pond.name,
                    activity.pond.code,
                    activity.pond.fishSpecies ?? "",
                    activity.description,
                    activityLabels[activity.type],
                    operator,
                    reminder,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(query);
            });
        }

        // Filter kolam
        if (pondFilter !== "ALL") {
            result = result.filter(
                (item) => item.pond.id === pondFilter
            );
        }

        // Filter jenis aktivitas
        if (typeFilter !== "ALL") {
            result = result.filter(
                (item) => item.type === typeFilter
            );
        }

        // Filter trigger pengingat
        if (triggerFilter !== "ALL") {
            result = result.filter((item) => {
                if (triggerFilter === "NONE") {
                    return item.alert === null;
                }

                return item.alert?.trigger === triggerFilter;
            });
        }

        // Filter status tindak lanjut
        if (statusFilter !== "ALL") {
            result = result.filter((item) => {
                if (statusFilter === "NONE") {
                    return item.status === null;
                }

                return item.status === statusFilter;
            });
        }

        // Filter periode
        if (periodFilter !== "ALL") {
            const days = Number(periodFilter);

            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            result = result.filter(
                (item) => new Date(item.activityAt) >= cutoff
            );
        }

        // Pengurutan
        result.sort((a, b) => {
            const difference =
                new Date(a.activityAt).getTime() -
                new Date(b.activityAt).getTime();

            return sortNewest ? -difference : difference;
        });

        return result;

    }, [
        activities,
        search,
        pondFilter,
        typeFilter,
        triggerFilter,
        statusFilter,
        periodFilter,
        sortNewest,
    ]);

    // -------------------------------------------
    // RINGKASAN DATA
    // -------------------------------------------

    const summary = useMemo(() => {

        return {
            total: filteredActivities.length,

            pending: filteredActivities.filter(
                (item) => item.status === "PENDING"
            ).length,

            inProgress: filteredActivities.filter(
                (item) => item.status === "IN_PROGRESS"
            ).length,

            completed: filteredActivities.filter(
                (item) => item.status === "COMPLETED"
            ).length,

            expenses: filteredActivities.reduce(
                (total, item) => total + item.expenseTotal,
                0
            ),
        };

    }, [filteredActivities]);

    // -------------------------------------------
    // PAGINATION
    // -------------------------------------------

    const totalPages = Math.max(
        1,
        Math.ceil(filteredActivities.length / pageSize)
    );

    const safePage = Math.min(currentPage, totalPages);

    const startIndex = (safePage - 1) * pageSize;

    const pageActivities = filteredActivities.slice(
        startIndex,
        startIndex + pageSize
    );

    const firstItem =
        filteredActivities.length === 0
            ? 0
            : startIndex + 1;

    const lastItem = Math.min(
        startIndex + pageSize,
        filteredActivities.length
    );

    // -------------------------------------------
    // EXPORT CSV
    // -------------------------------------------

    function exportLog() {

        const headers = [
            "Kolam",
            "Kode Kolam",
            "Jenis Aktivitas",
            "Keterangan",
            "Tanggal Aktivitas",
            "Petugas",
            "Status",
            "Pengingat",
            "Total Pengeluaran",
        ];

        const rows = filteredActivities.map((item) => {

            const operator =
                item.performedBy?.name ??
                item.assignedTo?.name ??
                item.recordedBy.name;

            const reminder =
                item.alert?.schedule?.title ??
                item.alert?.message ??
                "-";

            const status = item.status
                ? statusLabels[item.status]
                : "Aktivitas Rutin";

            return [
                item.pond.name,
                item.pond.code,
                activityLabels[item.type],
                item.description,
                formatDateTime(item.activityAt),
                operator,
                status,
                reminder,
                item.expenseTotal,
            ];
        });

        const escapeCSV = (value: unknown) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
        };

        const csv = [
            headers,
            ...rows,
        ]
            .map((row) => row.map(escapeCSV).join(","))
            .join("\r\n");

        const blob = new Blob(
            ["\uFEFF" + csv],
            {
                type: "text/csv;charset=utf-8;",
            }
        );

        const url = URL.createObjectURL(blob);

        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = `SMART-POND-Log-Operasional-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        URL.revokeObjectURL(url);
    }

    // ===========================================
    // RENDER
    // ===========================================

    return (
        <div className="min-h-full w-full space-y-3 bg-white">

            {/* =================================== */}
            {/* HEADER */}
            {/* =================================== */}

            <section className="flex flex-col justify-between gap-4 rounded-xl border border-[#dce5f3] bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center">

                <div className="flex min-w-0 items-start gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf2ff]">
                        <ClipboardList
                            size={21}
                            className="text-blue-600"
                        />
                    </div>

                    <div className="min-w-0">

                        <h2 className="text-xl font-bold text-slate-900">
                            Pencatatan Operasional Kolam
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Menampilkan {activities.length} aktivitas operasional
                            dari database SMART-POND.
                        </p>

                        <p className="mt-2 text-[11px] leading-5 text-slate-500">
                            {summary.total} aktivitas
                            {" · "}
                            Belum ditangani: {summary.pending}
                            {" · "}
                            Sedang ditangani: {summary.inProgress}
                            {" · "}
                            Selesai: {summary.completed}
                            {" · "}
                            Total pengeluaran:{" "}
                            <strong className="text-slate-700">
                                {formatCurrency(summary.expenses)}
                            </strong>
                        </p>

                    </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3">

                    <button
                        type="button"
                        onClick={exportLog}
                        disabled={filteredActivities.length === 0}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#cbd5e1] bg-white px-4 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Download size={15} />
                        Ekspor Log
                    </button>

                    {canCreateActivity && (
                        <Link
                            href="/operations/new"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0860ed] px-5 text-[13px] font-semibold text-white transition hover:bg-blue-700"
                        >
                            <Plus size={17} />
                            Buat Aktivitas
                        </Link>
                    )}

                </div>
            </section>

            {/* =================================== */}
            {/* FILTER */}
            {/* =================================== */}


            <section className="rounded-xl border border-[#cbd3e7] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                    <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-[#1e293b]">
                        <Droplet size={17} className="text-blue-600" />
                        Pilih Kolam:
                    </div>

                    {/* SEARCH */}
                    <div className="relative min-w-0 flex-1 xl:max-w-[190px]">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"
                        />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Cari aktivitas..."
                            className="h-11 w-full rounded-xl border border-[#cbd3e7] bg-white pl-10 pr-3 text-sm font-medium text-[#334155] placeholder:text-[#64748b] placeholder:opacity-100 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    {/* POND FILTER */}
                    <div className="xl:flex-1">
                        <FilterSelect
                            value={pondFilter}
                            onChange={(value) => {
                                setPondFilter(value);
                                setCurrentPage(1);
                            }}
                            placeholder="Semua Kolam"
                            options={[
                                { value: "ALL", label: "Semua Kolam" },
                                ...ponds.map((pond) => ({
                                    value: pond.id,
                                    label: `${pond.name} (${pond.code})${!pond.isActive ? " - Nonaktif" : ""}`,
                                })),
                            ]}
                        />
                    </div>

                    {/* ACTIVITY FILTER */}
                    <div className="xl:flex-1">
                        <FilterSelect
                            value={typeFilter}
                            onChange={(value) => {
                                setTypeFilter(value);
                                setCurrentPage(1);
                            }}
                            placeholder="Semua Aktivitas"
                            options={[
                                { value: "ALL", label: "Semua Aktivitas" },
                                ...Object.entries(activityLabels).map(([value, label]) => ({
                                    value,
                                    label,
                                })),
                            ]}
                        />
                    </div>

                    {/* TRIGGER FILTER */}
                    <div className="xl:flex-1">
                        <FilterSelect
                            value={triggerFilter}
                            onChange={(value) => {
                                setTriggerFilter(value);
                                setCurrentPage(1);
                            }}
                            placeholder="Semua Trigger"
                            options={[
                                { value: "ALL", label: "Semua Trigger" },
                                { value: "WATER_QUALITY", label: "Kualitas Air" },
                                { value: "SCHEDULE", label: "Jadwal" },
                                { value: "NONE", label: "Tanpa Pengingat" },
                            ]}
                        />
                    </div>

                    {/* STATUS FILTER */}
                    <div className="xl:flex-1">
                        <FilterSelect
                            value={statusFilter}
                            onChange={(value) => {
                                setStatusFilter(value);
                                setCurrentPage(1);
                            }}
                            placeholder="Semua Status"
                            options={[
                                { value: "ALL", label: "Semua Status" },
                                { value: "PENDING", label: "ToDo" },
                                { value: "IN_PROGRESS", label: "Sedang Ditangani" },
                                { value: "COMPLETED", label: "Selesai" },
                                { value: "NONE", label: "Tanpa Tindak Lanjut" },
                            ]}
                        />
                    </div>

                    {/* PERIOD FILTER */}
                    <div className="xl:flex-1">
                        <FilterSelect
                            value={periodFilter}
                            onChange={(value) => {
                                setPeriodFilter(value);
                                setCurrentPage(1);
                            }}
                            placeholder="Semua Periode"
                            options={[
                                { value: "ALL", label: "Semua Periode" },
                                { value: "7", label: "7 Hari Terakhir" },
                                { value: "30", label: "30 Hari Terakhir" },
                                { value: "90", label: "90 Hari Terakhir" },
                            ]}
                        />
                    </div>

                    {/* SORT */}
                    <button
                        type="button"
                        onClick={() => setSortNewest((value) => !value)}
                        title={sortNewest ? "Urutkan terlama" : "Urutkan terbaru"}
                        className="flex h-11 w-12 shrink-0 items-center justify-center rounded-xl border border-[#cbd3e7] bg-white text-blue-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                    >
                        <ArrowUpDown size={18} />
                    </button>
                </div>

                {(search ||
                    pondFilter !== "ALL" ||
                    typeFilter !== "ALL" ||
                    triggerFilter !== "ALL" ||
                    statusFilter !== "ALL" ||
                    periodFilter !== "ALL") && (
                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setPondFilter("ALL");
                                    setTypeFilter("ALL");
                                    setTriggerFilter("ALL");
                                    setStatusFilter("ALL");
                                    setPeriodFilter("ALL");
                                    setCurrentPage(1);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-800"
                            >
                                <X size={13} />
                                Reset Filter
                            </button>
                        </div>
                    )}
            </section>


            {/* =================================== */}
            {/* TABLE */}
            {/* =================================== */}

            <section className="overflow-hidden rounded-xl border border-[#dce8fa] bg-white shadow-sm">

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1100px] border-collapse text-left">

                        <thead>
                            <tr className="bg-[#edf4ff] text-[11px] font-semibold uppercase tracking-wide text-slate-600">

                                <th className="border-r border-slate-200 px-4 py-5">
                                    Kolam
                                </th>

                                <th className="border-r border-slate-200 px-4 py-5">
                                    Aktivitas
                                </th>

                                <th className="border-r border-slate-200 px-4 py-5 text-center">
                                    Waktu
                                </th>

                                <th className="border-r border-slate-200 px-4 py-5">
                                    Pengingat
                                </th>

                                <th className="border-r border-slate-200 px-4 py-5">
                                    Petugas
                                </th>

                                <th className="border-r border-slate-200 px-4 py-5 text-center">
                                    Status
                                </th>

                                <th className="px-4 py-5 text-center">
                                    Aksi
                                </th>

                            </tr>
                        </thead>

                        <tbody>

                            {pageActivities.length === 0 ? (

                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-16 text-center"
                                    >

                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                            <ClipboardList
                                                size={23}
                                                className="text-slate-400"
                                            />
                                        </div>

                                        <p className="mt-3 text-sm font-semibold text-slate-700">
                                            Tidak ada aktivitas ditemukan
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Belum ada catatan pada cakupan filter yang dipilih.
                                        </p>

                                    </td>
                                </tr>

                            ) : (

                                pageActivities.map((activity) => {

                                    const operator =
                                        activity.performedBy?.name ??
                                        activity.assignedTo?.name ??
                                        activity.recordedBy.name;

                                    const isExpanded =
                                        expandedId === activity.id;

                                    return (
                                        <Fragment key={activity.id}>

                                            <tr
                                                key={activity.id}
                                                className="border-b border-[#e2eaf7] transition hover:bg-[#fafcff]"
                                            >

                                                {/* KOLAM */}
                                                <td className="border-r border-slate-200 px-5 py-5 align-middle">

                                                    <p className="text-[13px] font-semibold text-slate-800">
                                                        {activity.pond.name}
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {activity.pond.fishSpecies ?? activity.pond.code}
                                                    </p>

                                                </td>

                                                {/* AKTIVITAS */}
                                                <td className="border-r border-slate-200 px-4 py-5 align-middle">

                                                    <p className="text-[13px] font-medium leading-5 text-slate-800">
                                                        {activity.description}
                                                    </p>

                                                    <span className="mt-1 inline-block text-[10px] text-slate-500">
                                                        {activityLabels[activity.type]}
                                                    </span>

                                                    {activity.expenseTotal > 0 && (
                                                        <p className="mt-2 text-[11px] font-medium text-blue-700">
                                                            {formatCurrency(activity.expenseTotal)}
                                                        </p>
                                                    )}

                                                </td>

                                                {/* WAKTU */}
                                                <td className="border-r border-slate-200 px-4 py-5 text-center align-middle">

                                                    <p className="text-[12px] font-medium text-slate-800">
                                                        {formatTime(activity.activityAt)}
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-slate-500">
                                                        {formatDateTime(activity.activityAt).split(",")[0]}
                                                    </p>

                                                </td>

                                                {/* PENGINGAT */}
                                                <td className="border-r border-slate-200 px-3 py-4 align-middle">
                                                    <ReminderInfo alert={activity.alert} />
                                                </td>

                                                {/* PETUGAS */}
                                                <td className="border-r border-slate-200 px-4 py-5 align-middle">

                                                    <div className="flex items-center gap-2">

                                                        <UserRound
                                                            size={14}
                                                            className="shrink-0 text-slate-400"
                                                        />

                                                        <span className="text-[12px] text-slate-800">
                                                            {operator}
                                                        </span>

                                                    </div>

                                                </td>

                                                {/* STATUS */}
                                                <td className="border-r border-slate-200 px-3 py-5 text-center align-middle">

                                                    <StatusBadge
                                                        status={activity.status}
                                                        recordState={activity.recordState}
                                                    />

                                                </td>

                                                {/* AKSI */}
                                                <td className="px-3 py-5 align-middle">

                                                    <div className="flex items-center justify-center gap-2">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setExpandedId(
                                                                    isExpanded ? null : activity.id
                                                                )
                                                            }
                                                            title="Lihat detail aktivitas"
                                                            aria-label="Lihat detail aktivitas"
                                                            className="rounded p-1 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            {isExpanded ? (
                                                                <X size={17} />
                                                            ) : (
                                                                <Eye size={17} />
                                                            )}
                                                        </button>

                                                        {activity.status === "COMPLETED" ? (

                                                            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#36bd54] px-2.5 py-1 text-[10px] font-medium text-white">
                                                                Complete
                                                                <Check size={12} />
                                                            </span>

                                                        ) : activity.status === "PENDING" ? (

                                                            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-400 px-2.5 py-1 text-[10px] font-medium text-white">
                                                                Uncomplete
                                                            </span>

                                                        ) : activity.status === "IN_PROGRESS" ? (

                                                            <span className="inline-flex whitespace-nowrap rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-medium text-white">
                                                                Proses
                                                            </span>

                                                        ) : null}

                                                        <Link
                                                            href={`/operations/new?edit=${encodeURIComponent(activity.id)}`}
                                                            title="Edit aktivitas"
                                                            aria-label="Edit aktivitas"
                                                            className="rounded p-1 text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            <Pencil size={16} />
                                                        </Link>

                                                    </div>

                                                </td>

                                            </tr>

                                            {/* DETAIL AKTIVITAS */}
                                            {isExpanded && (
                                                <tr
                                                    key={`${activity.id}-detail`}
                                                    className="border-b border-slate-200"
                                                >
                                                    <td colSpan={7} className="p-4">
                                                        <ActivityDetail activity={activity} />
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })

                            )}

                        </tbody>

                    </table>

                </div>

                {/* ================================= */}
                {/* PAGINATION */}
                {/* ================================= */}

                <div className="flex flex-col justify-between gap-3 border-t border-[#e2eaf7] px-5 py-4 sm:flex-row sm:items-center">

                    <p className="text-[11px] text-slate-500">
                        Menampilkan{" "}
                        <strong className="text-slate-800">
                            {firstItem}
                        </strong>
                        {" "}sampai{" "}
                        <strong className="text-slate-800">
                            {lastItem}
                        </strong>
                        {" "}dari{" "}
                        <strong className="text-slate-800">
                            {filteredActivities.length}
                        </strong>
                        {" "}aktivitas operasional
                    </p>

                    <div className="flex items-center justify-end gap-1.5">

                        <button
                            type="button"
                            disabled={safePage <= 1}
                            onClick={() => setCurrentPage(safePage - 1)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-[11px] text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={13} />
                            Sebelumnya
                        </button>

                        {Array.from(
                            { length: totalPages },
                            (_, index) => index + 1
                        ).map((page) => (

                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`h-8 min-w-8 rounded-lg border px-2 text-xs transition ${safePage === page
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                {page}
                            </button>

                        ))}

                        <button
                            type="button"
                            disabled={safePage >= totalPages}
                            onClick={() => setCurrentPage(safePage + 1)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-[11px] text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Selanjutnya
                            <ChevronRight size={13} />
                        </button>

                    </div>

                </div>

            </section>

        </div>
    );
}
