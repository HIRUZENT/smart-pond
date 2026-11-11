
"use client";

import {
    useActionState,
    useEffect,
    useRef,
    useState,
} from "react";

import { useFormStatus } from "react-dom";
import Link from "next/link";

import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    Waves,
    Droplets,
    Thermometer,
    Activity,
    ClipboardList,
    Wallet,
    Upload,
    CheckCircle2,
    AlertCircle,
    FileCheck,
    Save,
    Loader2,
} from "lucide-react";

import {
    saveActivityAction,
    type ActivityFormState,
} from "@/app/(protected)/operations/actions";

import type {
    TelemetryByPond,
} from "@/app/(protected)/operations/new/page";

// =============================================
// TYPES
// =============================================

type PondOption = {
    id: string;
    code: string;
    name: string;
};

type StaffOption = {
    id: string;
    name: string;
    role: string;
    pondIds: string[];
};

type AlertContext = {
    id: string;
    message: string;
    occurredAt: string;
} | null;

type Props = {
    ponds: PondOption[];
    staff: StaffOption[];
    telemetryByPond: TelemetryByPond;
    initialPondId: string;
    alert: AlertContext;
};

type ActivityType =
    | "FEEDING"
    | "WATER_CHANGE"
    | "WATER_ADDITION"
    | "AERATOR"
    | "CLEANING"
    | "FOLLOW_UP"
    | "OTHER";

type FollowUpStatus =
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED";

// =============================================
// INITIAL STATE
// =============================================

const initialState: ActivityFormState = {
    error: null,
    success: null,
};

// =============================================
// ACTIVITY OPTIONS
// =============================================

const activityOptions: {
    value: ActivityType;
    label: string;
}[] = [
        {
            value: "FEEDING",
            label: "Pemberian Pakan",
        },
        {
            value: "WATER_CHANGE",
            label: "Pergantian Air",
        },
        {
            value: "WATER_ADDITION",
            label: "Penambahan Air",
        },
        {
            value: "AERATOR",
            label: "Penggunaan Aerator",
        },
        {
            value: "CLEANING",
            label: "Pembersihan Kolam",
        },
        {
            value: "FOLLOW_UP",
            label: "Tindak Lanjut Kondisi Kolam",
        },
        {
            value: "OTHER",
            label: "Aktivitas Lainnya",
        },
    ];

// =============================================
// WIB DATE HELPER
// Tanggal dibuat di browser agar tidak
// menyebabkan error Date.now() saat prerender.
// =============================================

function getWibNow() {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date());

    const values: Record<string, string> = {};

    for (const part of parts) {
        if (part.type !== "literal") {
            values[part.type] = part.value;
        }
    }

    return {
        date: `${values.year}-${values.month}-${values.day}`,
        time: `${values.hour}:${values.minute}`,
    };
}

// =============================================
// STYLE
// =============================================

const inputClass =
    "h-11 w-full rounded-lg border border-[#CBD3E7] " +
    "bg-white px-3.5 text-sm font-medium text-[#1F2937] " +
    "placeholder:text-[#64748B] placeholder:opacity-100 " +
    "outline-none transition-all duration-200 " +
    "hover:border-[#94A3B8] " +
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 " +
    "disabled:cursor-not-allowed disabled:bg-[#F8FAFC]";

const labelClass =
    "mb-2 block text-[13px] font-semibold text-[#1F2937]";

const sectionClass =
    "rounded-xl border border-[#CBD3E7] bg-white p-5 shadow-sm";

const textareaClass =
    "min-h-[90px] w-full resize-y rounded-lg border " +
    "border-[#CBD3E7] bg-white px-3.5 py-3 text-sm " +
    "font-medium leading-relaxed text-[#1F2937] " +
    "placeholder:text-[#64748B] outline-none transition " +
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

// =============================================
// SECTION HEADER
// =============================================

function SectionHeader({
    number,
    title,
    description,
    icon,
}: {
    number: number;
    title: string;
    description?: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="mb-5 flex items-center gap-3 border-b border-[#CBD3E7] pb-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-bold text-[#0754CC]">
                {number}
            </div>

            <div className="flex min-w-0 items-center gap-2">
                <span className="text-blue-600">{icon}</span>

                <div>
                    <h2 className="text-sm font-bold text-[#1F2937]">
                        {title}
                    </h2>

                    {description && (
                        <p className="mt-1 text-xs text-[#64748B]">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// =============================================
// SUBMIT BUTTONS
// =============================================

function SubmitButtons() {
    const { pending } = useFormStatus();

    return (
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
                type="submit"
                name="recordState"
                value="DRAFT"
                disabled={pending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#CBD3E7] bg-white px-5 text-sm font-semibold text-[#1F2937] transition hover:bg-[#F1F5F9] disabled:opacity-50"
            >
                {pending ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Save size={16} />
                )}

                Simpan sebagai Draf
            </button>

            <button
                type="submit"
                name="recordState"
                value="SUBMITTED"
                disabled={pending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0754CC] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {pending ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <CheckCircle2 size={17} />
                )}

                Simpan Catatan Aktivitas
            </button>
        </div>
    );
}

// =============================================
// TELEMETRY CARD
// =============================================

function TelemetryCard({
    title,
    value,
    unit,
    icon,
    status,
    observedAt,
}: {
    title: string;
    value?: number;
    unit: string;
    icon: React.ReactNode;
    status?: string;
    observedAt?: string;
}) {
    const statusConfig = {
        ATTENTION: {
            label: "Di luar batas",
            color: "text-red-600",
            background: "bg-red-50",
        },
        NORMAL: {
            label: "Dalam batas",
            color: "text-green-700",
            background: "bg-green-50",
        },
        UNCONFIGURED: {
            label: "Batas belum diatur",
            color: "text-amber-700",
            background: "bg-amber-50",
        },
    };

    const config = status
        ? statusConfig[status as keyof typeof statusConfig]
        : null;

    return (
        <div className="min-w-0 rounded-lg border border-[#CBD3E7] bg-[#F8FAFC] p-3">
            <div className="flex items-center justify-center gap-1.5 text-[#64748B]">
                {icon}
                <span className="text-xs font-medium">{title}</span>
            </div>

            <div className="mt-2 text-center">
                {value !== undefined ? (
                    <p className="text-xl font-bold tabular-nums text-[#1F2937]">
                        {value.toLocaleString("id-ID", {
                            maximumFractionDigits: 3,
                        })}

                        <span className="ml-1 text-xs font-medium text-[#64748B]">
                            {unit}
                        </span>
                    </p>
                ) : (
                    <p className="py-1 text-sm font-semibold text-[#64748B]">
                        Belum ada data
                    </p>
                )}
            </div>

            {config && (
                <div className={`mt-2 rounded-md px-2 py-1 text-center text-[10px] font-semibold ${config.color} ${config.background}`}>
                    {config.label}
                </div>
            )}

            {observedAt && (
                <p className="mt-2 text-center text-[10px] text-[#64748B]">
                    {new Date(observedAt).toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                        dateStyle: "short",
                        timeStyle: "short",
                    })} WIB
                </p>
            )}
        </div>
    );
}

// =============================================
// MAIN COMPONENT
// =============================================

export function ActivityEntryForm({
    ponds,
    staff,
    telemetryByPond,
    initialPondId,
    alert,
}: Props) {
    const [state, formAction] = useActionState(
        saveActivityAction,
        initialState
    );

    const formRef = useRef<HTMLFormElement>(null);

    const [selectedPondId, setSelectedPondId] =
        useState(initialPondId);

    const [activityType, setActivityType] =
        useState<ActivityType>("FOLLOW_UP");

    const [status, setStatus] =
        useState<FollowUpStatus>("PENDING");

    const [assignedToId, setAssignedToId] =
        useState("");

    const [performedById, setPerformedById] =
        useState("");

    const [activityDate, setActivityDate] =
        useState("");

    const [activityTime, setActivityTime] =
        useState("");

    const [performedDate, setPerformedDate] =
        useState("");

    const [performedTime, setPerformedTime] =
        useState("");

    const [receiptName, setReceiptName] =
        useState("");

    // ===========================================
    // DATE INITIALIZATION
    // ===========================================

    useEffect(() => {
        const now = getWibNow();

        setActivityDate(now.date);
        setActivityTime(now.time);
    }, []);

    // ===========================================
    // SWEETALERT NOTIFICATION
    // ===========================================

    useEffect(() => {
        if (!state.error && !state.success) {
            return;
        }

        const isSuccess = Boolean(state.success);

        void import("sweetalert2").then(({ default: Swal }) => {
            Swal.fire({
                toast: true,
                position: "top",
                icon: isSuccess ? "success" : "error",
                title: state.success ?? state.error ?? "",
                showConfirmButton: false,
                timer: 3500,
                timerProgressBar: true,
                background: "#FFFFFF",
                color: "#1F2937",
            });
        });

        if (isSuccess) {
            formRef.current?.reset();

            const now = getWibNow();

            setSelectedPondId(initialPondId);
            setActivityType("FOLLOW_UP");
            setStatus("PENDING");
            setAssignedToId("");
            setPerformedById("");
            setActivityDate(now.date);
            setActivityTime(now.time);
            setPerformedDate("");
            setPerformedTime("");
            setReceiptName("");
        }
    }, [state, initialPondId]);

    // ===========================================
    // SELECTED DATA
    // ===========================================

    const selectedTelemetry =
        telemetryByPond[selectedPondId] ?? {};

    const availableStaff = staff.filter((member) =>
        member.pondIds.includes(selectedPondId)
    );

    const isFollowUp = activityType === "FOLLOW_UP";

    const needsPerformance =
        !isFollowUp || status !== "PENDING";

    const statusOptions: {
        value: FollowUpStatus;
        label: string;
        active: string;
    }[] = [
            {
                value: "PENDING",
                label: "Belum Ditangani",
                active: "border-amber-400 bg-amber-50 text-amber-900",
            },
            {
                value: "IN_PROGRESS",
                label: "Sedang Ditangani",
                active: "border-blue-400 bg-blue-50 text-blue-800",
            },
            {
                value: "COMPLETED",
                label: "Selesai",
                active: "border-green-400 bg-green-50 text-green-800",
            },
        ];

    // ===========================================
    // EMPTY POND
    // ===========================================

    if (ponds.length === 0) {
        return (
            <div className="mx-auto max-w-[1100px] rounded-xl border border-[#CBD3E7] bg-white p-10 text-center">
                <Waves size={36} className="mx-auto text-blue-500" />

                <h2 className="mt-4 font-bold text-[#1F2937]">
                    Belum Ada Kolam Aktif
                </h2>

                <p className="mt-2 text-sm text-[#64748B]">
                    Tidak ada kolam yang tersedia untuk pencatatan aktivitas.
                </p>

                <Link
                    href="/ponds"
                    className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#0754CC] px-5 text-sm font-semibold text-white"
                >
                    Kelola Kolam
                </Link>
            </div>
        );
    }

    // ===========================================
    // RENDER
    // ===========================================

    return (
        <form
            ref={formRef}
            action={formAction}
            className="mx-auto w-full max-w-[1100px] space-y-5 pb-24"
        >
            <input
                type="hidden"
                name="alertId"
                value={alert?.id ?? ""}
            />

            <input
                type="hidden"
                name="status"
                value={status}
            />

            {/* PAGE HEADER */}

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-[#1F2937]">
                        Pencatatan Aktivitas Operasional
                    </h1>

                    <p className="mt-1 text-sm text-[#64748B]">
                        Catat aktivitas tambak, tindak lanjut, dan pengeluaran operasional.
                    </p>
                </div>

                <Link
                    href="/operations"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#475569] transition hover:text-blue-600"
                >
                    <ArrowLeft size={16} />
                    Kembali
                </Link>
            </div>

            {/* ALERT CONTEXT */}

            {alert && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <AlertCircle
                        size={19}
                        className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <div>
                        <p className="text-sm font-bold text-[#1F2937]">
                            Tindak Lanjut Pengingat
                        </p>

                        <p className="mt-1 text-sm text-[#475569]">
                            {alert.message}
                        </p>

                        <p className="mt-1 text-xs text-[#64748B]">
                            {new Date(alert.occurredAt).toLocaleString("id-ID", {
                                timeZone: "Asia/Jakarta",
                            })} WIB
                        </p>
                    </div>
                </div>
            )}

            {/* =======================================
          SECTION 1 - DATA UTAMA
      ======================================= */}

            <section className={sectionClass}>
                <SectionHeader
                    number={1}
                    title="Data Utama Aktivitas Tambak"
                    icon={<ClipboardList size={18} />}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    {/* POND */}

                    <div className="sm:col-span-2">
                        <label className={labelClass}>
                            Pilih Kolam Sasaran <span className="text-red-500">*</span>
                        </label>

                        <select
                            name="pondId"
                            value={selectedPondId}
                            onChange={(e) => {
                                setSelectedPondId(e.target.value);
                                setAssignedToId("");
                                setPerformedById("");
                            }}
                            required
                            disabled={Boolean(alert)}
                            className={inputClass}
                        >
                            {ponds.map((pond) => (
                                <option key={pond.id} value={pond.id}>
                                    {pond.name} ({pond.code})
                                </option>
                            ))}
                        </select>

                        {alert && (
                            <p className="mt-1 text-xs text-[#64748B]">
                                Kolam otomatis mengikuti kolam dari pengingat.
                            </p>
                        )}
                    </div>

                    {/* ACTIVITY TYPE */}

                    <div className="sm:col-span-2">
                        <label className={labelClass}>
                            Jenis Aktivitas <span className="text-red-500">*</span>
                        </label>

                        <select
                            name="type"
                            value={activityType}
                            onChange={(e) => {
                                setActivityType(e.target.value as ActivityType);
                                setStatus("PENDING");
                                setPerformedById("");
                            }}
                            required
                            className={inputClass}
                        >
                            {activityOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ACTIVITY DATE */}

                    <div>
                        <label className={labelClass}>
                            Tanggal Pelaksanaan <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            <CalendarDays
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                            />

                            <input
                                type="date"
                                name="activityDate"
                                value={activityDate}
                                onChange={(e) => setActivityDate(e.target.value)}
                                required
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>

                    {/* ACTIVITY TIME */}

                    <div>
                        <label className={labelClass}>
                            Waktu / Jam Mulai <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            <Clock3
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                            />

                            <input
                                type="time"
                                name="activityTime"
                                value={activityTime}
                                onChange={(e) => setActivityTime(e.target.value)}
                                required
                                className={`${inputClass} pl-10`}
                            />
                        </div>
                    </div>
                </div>

                {/* TELEMETRY */}

                <div className="mt-6 border-t border-[#CBD3E7] pt-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold tracking-wide text-[#64748B]">
                            TELEMETRI LAPANGAN SEBELUM TINDAKAN
                        </p>

                        <span className="text-[10px] text-[#64748B]">
                            Snapshot terakhir
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                        <TelemetryCard
                            title="Derajat pH"
                            value={selectedTelemetry.PH?.value}
                            unit={selectedTelemetry.PH?.unit ?? ""}
                            icon={<Droplets size={14} />}
                            status={selectedTelemetry.PH?.status}
                            observedAt={selectedTelemetry.PH?.observedAt}
                        />

                        <TelemetryCard
                            title="Suhu Kolam"
                            value={selectedTelemetry.TEMPERATURE?.value}
                            unit={selectedTelemetry.TEMPERATURE?.unit ?? ""}
                            icon={<Thermometer size={14} />}
                            status={selectedTelemetry.TEMPERATURE?.status}
                            observedAt={selectedTelemetry.TEMPERATURE?.observedAt}
                        />

                        <TelemetryCard
                            title="TDS"
                            value={selectedTelemetry.TDS?.value}
                            unit={selectedTelemetry.TDS?.unit ?? ""}
                            icon={<Activity size={14} />}
                            status={selectedTelemetry.TDS?.status}
                            observedAt={selectedTelemetry.TDS?.observedAt}
                        />

                    </div>

                    <p className="mt-3 text-[11px] leading-relaxed text-[#64748B]">
                        Nilai telemetri merupakan pembacaan terakhir yang tersedia.
                        Status parameter mengikuti ambang batas yang telah dikonfigurasi.
                    </p>
                </div>
            </section>

            {/* =======================================
          SECTION 2 - PENANGANAN
      ======================================= */}

            <section className={sectionClass}>
                <SectionHeader
                    number={2}
                    title="Arahan & Status Penanganan Lapangan"
                    icon={<ClipboardList size={18} />}
                />

                {/* ACTIVITY DESCRIPTION */}

                <div className="mb-5">
                    <label className={labelClass}>
                        Keterangan Aktivitas <span className="text-red-500">*</span>
                    </label>

                    <textarea
                        name="description"
                        required
                        minLength={2}
                        maxLength={5000}
                        placeholder="Jelaskan aktivitas atau kondisi kolam yang dicatat..."
                        className={textareaClass}
                    />
                </div>

                {/* FOLLOW UP INSTRUCTION */}

                {isFollowUp && (
                    <div className="mb-5">
                        <label className={labelClass}>
                            Arahan Tindakan
                        </label>

                        <textarea
                            name="instruction"
                            maxLength={5000}
                            placeholder="Tuliskan tindakan yang perlu dilakukan oleh petugas lapangan..."
                            className="min-h-[100px] w-full resize-y rounded-lg border border-[#CBD3E7] bg-[#F8FAFC] px-3.5 py-3 text-sm font-medium leading-relaxed text-[#1F2937] placeholder:text-[#64748B] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                )}

                {/* ASSIGNED STAFF */}

                {isFollowUp && (
                    <div className="mb-5">
                        <label className={labelClass}>
                            Petugas Pelaksana Lapangan
                        </label>

                        <select
                            name="assignedToId"
                            value={assignedToId}
                            onChange={(e) => setAssignedToId(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">
                                Pilih Pengelola / Petugas...
                            </option>

                            {availableStaff.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name} (
                                    {member.role === "MANAGER"
                                        ? "Pengelola"
                                        : "Petugas"}
                                    )
                                </option>
                            ))}
                        </select>

                        <p className="mt-1.5 text-xs text-[#64748B]">
                            Pilih petugas yang bertanggung jawab menangani tindakan.
                        </p>
                    </div>
                )}

                {/* FOLLOW UP STATUS */}

                {isFollowUp && (
                    <div>
                        <label className={labelClass}>
                            Status Penanganan Lapangan Saat Ini
                        </label>

                        <div
                            role="radiogroup"
                            aria-label="Status penanganan"
                            className="grid grid-cols-3 gap-2 sm:flex"
                        >
                            {statusOptions.map((option) => {
                                const active = status === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={active}
                                        onClick={() => {
                                            setStatus(option.value);

                                            if (option.value !== "PENDING") {
                                                setPerformedDate(
                                                    (previous) => previous || activityDate
                                                );

                                                setPerformedTime(
                                                    (previous) => previous || activityTime
                                                );
                                            }
                                        }}
                                        className={`min-h-[48px] rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${active
                                                ? option.active
                                                : "border-[#CBD3E7] bg-white text-[#475569] hover:border-blue-300 hover:bg-blue-50"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ACTUAL PERFORMANCE */}

                {needsPerformance && (
                    <div className="mt-5 space-y-4 rounded-lg border border-[#DCE5F2] bg-[#F8FAFC] p-4">

                        <h3 className="text-sm font-bold text-[#1F2937]">
                            Informasi Pelaksanaan Tindakan
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                            <div className="sm:col-span-1">
                                <label className={labelClass}>
                                    Petugas Pelaksana
                                </label>

                                <select
                                    name="performedById"
                                    value={performedById}
                                    onChange={(e) => setPerformedById(e.target.value)}
                                    required
                                    className={inputClass}
                                >
                                    <option value="">
                                        Pilih petugas...
                                    </option>

                                    {availableStaff.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Tanggal Pelaksanaan
                                </label>

                                <input
                                    type="date"
                                    name="performedDate"
                                    value={performedDate}
                                    onChange={(e) => setPerformedDate(e.target.value)}
                                    required
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Waktu Pelaksanaan
                                </label>

                                <input
                                    type="time"
                                    name="performedTime"
                                    value={performedTime}
                                    onChange={(e) => setPerformedTime(e.target.value)}
                                    required
                                    className={inputClass}
                                />
                            </div>

                        </div>

                        {isFollowUp && status === "COMPLETED" && (
                            <div>
                                <label className={labelClass}>
                                    Hasil Tindakan <span className="text-red-500">*</span>
                                </label>

                                <textarea
                                    name="result"
                                    required
                                    minLength={2}
                                    maxLength={5000}
                                    placeholder="Tuliskan hasil tindakan dan kondisi kolam setelah penanganan..."
                                    className={textareaClass}
                                />
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* =======================================
          SECTION 3 - EXPENSE
      ======================================= */}

            <section className={sectionClass}>
                <SectionHeader
                    number={3}
                    title="Pengeluaran Terkait Aktivitas"
                    description="Catat pengeluaran operasional yang timbul dari kegiatan ini."
                    icon={<Wallet size={18} />}
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

                    {/* CATEGORY */}

                    <div className="lg:col-span-4">
                        <label className={labelClass}>
                            Kategori Pengeluaran
                        </label>

                        <input
                            type="text"
                            name="expenseCategory"
                            maxLength={100}
                            placeholder="Contoh: BBM Genset / Pakan"
                            className={inputClass}
                        />
                    </div>

                    {/* AMOUNT */}

                    <div className="lg:col-span-3">
                        <label className={labelClass}>
                            Nominal Pengeluaran (Rp)
                        </label>

                        <div className="flex h-11 overflow-hidden rounded-lg border border-[#CBD3E7] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                            <span className="flex items-center border-r border-[#CBD3E7] bg-[#F8FAFC] px-3 text-sm font-bold text-[#64748B]">
                                Rp
                            </span>

                            <input
                                type="number"
                                name="expenseAmount"
                                min="1"
                                step="1"
                                placeholder="0"
                                className="min-w-0 flex-1 bg-white px-3 text-sm font-semibold text-[#1F2937] outline-none placeholder:text-[#64748B]"
                            />
                        </div>
                    </div>

                    {/* EXPENSE DATE */}

                    <div className="lg:col-span-5">
                        <label className={labelClass}>
                            Tanggal Pengeluaran
                        </label>

                        <input
                            type="date"
                            name="expenseDate"
                            className={inputClass}
                        />
                    </div>

                    {/* EXPENSE DESCRIPTION */}

                    <div className="lg:col-span-6">
                        <label className={labelClass}>
                            Keterangan Pengeluaran
                        </label>

                        <textarea
                            name="expenseDescription"
                            maxLength={5000}
                            placeholder="Keterangan tambahan penggunaan biaya..."
                            className="min-h-[80px] w-full resize-y rounded-lg border border-[#CBD3E7] bg-white px-3.5 py-3 text-sm font-medium text-[#1F2937] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* RECEIPT */}

                    <div className="lg:col-span-6">
                        <label className={labelClass}>
                            Lampiran Bukti Nota / Struk
                        </label>

                        <label className="flex min-h-[80px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#CBD3E7] bg-[#F8FAFC] px-4 py-3 text-center transition hover:border-blue-400 hover:bg-blue-50">
                            <Upload size={20} className="text-blue-600" />

                            <span className="text-xs font-semibold text-[#334155]">
                                {receiptName || "Pilih foto atau PDF bukti transaksi"}
                            </span>

                            <span className="text-[10px] text-[#64748B]">
                                JPG, PNG, atau PDF (maksimal 5 MB)
                            </span>

                            <input
                                type="file"
                                name="receipt"
                                accept="image/jpeg,image/png,application/pdf"
                                className="sr-only"
                                onChange={(e) =>
                                    setReceiptName(
                                        e.target.files?.[0]?.name ?? ""
                                    )
                                }
                            />
                        </label>

                        {receiptName && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
                                <FileCheck size={15} />
                                Bukti transaksi dipilih.
                            </div>
                        )}
                    </div>

                </div>
            </section>

            {/* =======================================
          BOTTOM ACTION BAR
      ======================================= */}

            <div className="sticky bottom-0 z-20 -mx-2 rounded-xl border border-[#CBD3E7] bg-white/95 p-3 shadow-[0_-5px_20px_rgba(15,23,42,0.06)] backdrop-blur sm:mx-0 sm:p-4">

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                    <Link
                        href="/operations"
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#64748B] transition hover:text-blue-600"
                    >
                        <ArrowLeft size={16} />
                        Batal
                    </Link>

                    <SubmitButtons />

                </div>
            </div>

        </form>
    );
}
