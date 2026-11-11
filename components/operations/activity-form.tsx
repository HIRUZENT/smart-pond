
"use client";

import Link from "next/link";
import {
  useActionState,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import {
  CalendarDays,
  Clock3,
  Check,
  CircleAlert,
  ClipboardList,
  Upload,
  ArrowLeft,
  Save,
} from "lucide-react";

import {
  saveActivityAction,
  type ActivityFormState,
} from "@/app/(protected)/operations/actions";

type Parameter = "PH" | "TEMPERATURE" | "TDS";

type Telemetry = {
  parameter: Parameter;
  value: number | null;
  unit: string;
  observedAt: string | null;
  status:
  | "NO_DATA"
  | "NO_THRESHOLD"
  | "WARNING"
  | "NORMAL";
};

type PondOption = {
  id: string;
  name: string;
  code: string;
  telemetry: Telemetry[];
  operators: {
    id: string;
    name: string;
  }[];
};

type ActivityFormProps = {
  ponds: PondOption[];
  role: "MANAGER" | "OPERATOR";
  currentUserId: string;
  initialDate: string;
  initialTime: string;
};

const fieldClass =
  "h-[39px] w-full rounded-md border border-[#C8D0E5] " +
  "bg-white px-3 text-[13px] text-[#333] outline-none " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-1.5 block text-[12px] font-medium text-[#303030]";

const sectionClass =
  "rounded-xl border border-[#C8D0E5] bg-white " +
  "px-5 py-6 sm:px-[22px]";

const activityTypes = [
  { value: "FEEDING", label: "Pemberian Pakan" },
  { value: "WATER_CHANGE", label: "Pergantian Air" },
  { value: "WATER_ADDITION", label: "Penambahan Air" },
  { value: "AERATOR", label: "Aerator / Aerasi" },
  { value: "CLEANING", label: "Pembersihan" },
  { value: "FOLLOW_UP", label: "Tindak Lanjut Peringatan" },
  { value: "OTHER", label: "Aktivitas Lainnya" },
] as const;

const statuses = [
  {
    value: "PENDING",
    label: "Belum Ditangani",
  },
  {
    value: "IN_PROGRESS",
    label: "Sedang Ditangani",
  },
  {
    value: "COMPLETED",
    label: "Selesai",
  },
] as const;

function FormButtons() {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="submit"
        name="saveMode"
        value="DRAFT"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#C8D0E5] bg-[#F4F2F2] px-4 text-[12px] font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
      >
        <Save size={15} />
        Simpan sebagai Draft
      </button>

      <button
        type="submit"
        name="saveMode"
        value="SUBMITTED"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0754CC] px-4 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <Check size={16} />
        {pending
          ? "Menyimpan..."
          : "Simpan Catatan Aktivitas"}
      </button>
    </div>
  );
}

function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 border-b border-[#C8D0E5] pb-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DCE5FF] text-[11px] font-bold text-[#183D92]">
          {number}
        </span>

        <h2 className="text-[14px] font-semibold text-[#252525]">
          {title}
        </h2>
      </div>

      {subtitle && (
        <p className="mt-1 pl-[30px] text-[11px] text-slate-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function SensorCard({
  sensor,
}: {
  sensor: Telemetry;
}) {
  const labels = {
    PH: "Derajat pH",
    TEMPERATURE: "Suhu Kolam",
    TDS: "TDS",
  };

  const displayValue =
    sensor.value === null
      ? "—"
      : sensor.parameter === "TEMPERATURE"
        ? sensor.value.toFixed(1)
        : sensor.value.toString();

  const displayStatus =
    sensor.status === "NO_DATA"
      ? "Data Belum Tersedia"
      : sensor.status === "NO_THRESHOLD"
        ? "Ambang Batas Belum Diatur"
        : sensor.status === "WARNING"
          ? "Perlu Tindak Lanjut"
          : "Kondisi Normal";

  const warning = sensor.status === "WARNING";
  const normal = sensor.status === "NORMAL";

  return (
    <div className="flex min-h-[77px] flex-col items-center justify-center rounded-md border border-[#C8D0E5] bg-[#F1EFEF] px-3 py-2 text-center">
      <p className="text-[10px] text-slate-500">
        {labels[sensor.parameter]}
      </p>

      <p
        className={`mt-0.5 text-[15px] font-bold ${warning
            ? "text-red-600"
            : normal
              ? "text-green-700"
              : "text-slate-700"
          }`}
      >
        {displayValue}
        <span className="ml-1 text-[10px] font-normal text-slate-500">
          {sensor.unit}
        </span>
      </p>

      <p
        className={`mt-1 text-[10px] ${warning
            ? "text-red-600"
            : normal
              ? "text-green-700"
              : "text-slate-500"
          }`}
      >
        {displayStatus}
      </p>
    </div>
  );
}

export function ActivityForm({
  ponds,
  role,
  currentUserId,
  initialDate,
  initialTime,
}: ActivityFormProps) {
  const initialState: ActivityFormState = {
    error: null,
    success: null,
  };

  const [state, action] = useActionState<
    ActivityFormState,
    FormData
  >(saveActivityAction, initialState);

  const [pondId, setPondId] = useState(
    ponds[0]?.id ?? ""
  );

  const [status, setStatus] = useState<
    "PENDING" | "IN_PROGRESS" | "COMPLETED"
  >("PENDING");

  const [receiptName, setReceiptName] =
    useState<string | null>(null);

  const [expenseAmount, setExpenseAmount] =
    useState("");

  const pond = ponds.find(
    (item) => item.id === pondId
  );

  const telemetry = pond?.telemetry ?? [];

  const isManager = role === "MANAGER";

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      {ponds.length == 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex gap-3">
            <CircleAlert
              size={22}
              className="shrink-0 text-amber-600"
            />

            <div>
              <h2 className="font-semibold text-amber-900">
                Belum ada kolam yang ditugaskan
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                Hubungi Admin/Owner untuk mendapatkan
                penugasan kolam terlebih dahulu.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form
          action={action}
          encType="multipart/form-data"
          className="space-y-5"
        >
          {/* 1. DATA UTAMA */}
          <section className={sectionClass}>
            <SectionHeading
              number={1}
              title="Data Utama Aktivitas Tambak"
            />

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="pondId"
                  className={labelClass}
                >
                  Pilih Kolam Sasaran{" "}
                  <span className="text-red-600">*</span>
                </label>

                <select
                  id="pondId"
                  name="pondId"
                  required
                  value={pondId}
                  onChange={(event) =>
                    setPondId(event.target.value)
                  }
                  className={fieldClass}
                >
                  {ponds.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="date"
                    className={labelClass}
                  >
                    Tanggal Pelaksanaan{" "}
                    <span className="text-red-600">*</span>
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={15}
                      className="pointer-events-none absolute left-3 top-3 text-slate-500"
                    />

                    <input
                      id="date"
                      name="date"
                      type="date"
                      defaultValue={initialDate}
                      required
                      className={`${fieldClass} pl-9`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="time"
                    className={labelClass}
                  >
                    Waktu / Jam Mulai{" "}
                    <span className="text-red-600">*</span>
                  </label>

                  <div className="relative">
                    <Clock3
                      size={15}
                      className="pointer-events-none absolute left-3 top-3 text-slate-500"
                    />

                    <input
                      id="time"
                      name="time"
                      type="time"
                      defaultValue={initialTime}
                      required
                      className={`${fieldClass} pl-9`}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#C8D0E5] pt-4">
                <h3 className="mb-2 text-[11px] font-semibold tracking-wide text-[#7B8193]">
                  TELEMETRI LAPANGAN SEBELUM TINDAKAN
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {telemetry.map((sensor) => (
                    <SensorCard
                      key={sensor.parameter}
                      sensor={sensor}
                    />
                  ))}
                </div>

                <p className="mt-2 text-[10px] text-slate-500">
                  Data terakhir yang tersedia pada
                  histori MySQL. Snapshot dicatat ulang
                  oleh server saat aktivitas disimpan.
                </p>
              </div>
            </div>
          </section>

          {/* 2. PENANGANAN LAPANGAN */}
          <section className={sectionClass}>
            <SectionHeading
              number={2}
              title="Arahan & Status Penanganan Lapangan"
            />

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="type"
                  className={labelClass}
                >
                  Jenis Aktivitas{" "}
                  <span className="text-red-600">*</span>
                </label>

                <select
                  id="type"
                  name="type"
                  defaultValue="FOLLOW_UP"
                  required
                  className={fieldClass}
                >
                  {activityTypes.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="instruction"
                  className={labelClass}
                >
                  Arahan Tindakan
                </label>

                <textarea
                  id="instruction"
                  name="instruction"
                  rows={4}
                  placeholder="Tuliskan instruksi atau arahan penanganan..."
                  className="min-h-[94px] w-full resize-y rounded-md border border-[#C8D0E5] bg-[#F5F3F3] p-3 text-[13px] leading-5 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className={labelClass}
                >
                  Catatan Pelaksanaan / Hasil Aktivitas
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Tuliskan kegiatan yang dilakukan dan hasilnya..."
                  className="w-full resize-y rounded-md border border-[#C8D0E5] bg-white p-3 text-[13px] leading-5 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="assignedToId"
                  className={labelClass}
                >
                  Petugas Pelaksana Lapangan
                </label>

                {isManager ? (
                  <select
                    id="assignedToId"
                    name="assignedToId"
                    className={fieldClass}
                    defaultValue=""
                    key={pondId}
                  >
                    <option value="">
                      Belum ditugaskan
                    </option>

                    {(pond?.operators ?? []).map(
                      (operator) => (
                        <option
                          key={operator.id}
                          value={operator.id}
                        >
                          {operator.name}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <div className="rounded-md border border-[#C8D0E5] bg-slate-50 px-3 py-2 text-[13px] text-slate-600">
                    Aktivitas dicatat oleh petugas
                    yang sedang login.
                    <input
                      type="hidden"
                      name="assignedToId"
                      value={currentUserId}
                    />
                  </div>
                )}
              </div>

              <div>
                <p className={labelClass}>
                  Status Penanganan Lapangan Saat Ini{" "}
                  <span className="text-red-600">*</span>
                </p>

                <div className="flex flex-wrap gap-2">
                  {statuses.map((item) => {
                    const selected =
                      status === item.value;

                    return (
                      <label
                        key={item.value}
                        className={`flex min-h-[49px] w-[112px] cursor-pointer items-center justify-center rounded-md border px-3 text-center text-[11px] font-medium transition ${selected
                            ? item.value === "PENDING"
                              ? "border-amber-500 bg-[#FFF7E8] text-amber-900"
                              : "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-[#C8D0E5] bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={item.value}
                          checked={selected}
                          onChange={() =>
                            setStatus(item.value)
                          }
                          className="sr-only"
                        />
                        {item.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 3. PENGELUARAN */}
          <section className={sectionClass}>
            <SectionHeading
              number={3}
              title="Pengeluaran Terkait Aktivitas (Finansial Operasional)"
              subtitle="Catat pengeluaran tunai atau nota langsung ke dalam aktivitas ini."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_0.8fr_1.1fr]">
              <div>
                <label
                  htmlFor="expenseDescription"
                  className={labelClass}
                >
                  Keterangan Pengeluaran
                </label>

                <input
                  id="expenseDescription"
                  name="expenseDescription"
                  type="text"
                  placeholder="Contoh: BBM Genset"
                  className={fieldClass}
                />
              </div>

              <div>
                <label
                  htmlFor="expenseAmount"
                  className={labelClass}
                >
                  Nominal Pengeluaran
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-2.5 text-[12px] font-semibold text-slate-500">
                    Rp
                  </span>

                  <input
                    id="expenseAmount"
                    name="expenseAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(event) =>
                      setExpenseAmount(event.target.value)
                    }
                    placeholder="0"
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="receipt"
                  className={labelClass}
                >
                  Lampiran Bukti Nota / Struk
                </label>

                <label className="flex h-[39px] cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#C8D0E5] bg-[#F1EFEF] px-3 text-[11px] text-[#747C90] hover:bg-blue-50">
                  <Upload
                    size={14}
                    className="shrink-0"
                  />

                  <span className="truncate">
                    {receiptName ?? "Pilih file nota"}
                  </span>

                  <input
                    id="receipt"
                    name="receipt"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={(event) =>
                      setReceiptName(
                        event.target.files?.[0]?.name ??
                        null
                      )
                    }
                  />
                </label>

                <p className="mt-1 text-[10px] text-slate-500">
                  PDF, JPG, atau PNG. Maksimal 650 KB.
                </p>
              </div>
            </div>
          </section>

          {state.error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {state.error}
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="flex flex-col gap-4 rounded-xl border border-[#C8D0E5] bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/operations/history"
              className="inline-flex items-center gap-2 text-[12px] text-[#69758C] hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Batal
            </Link>

            <FormButtons />
          </div>
        </form>
      )}
    </div>
  );
}
