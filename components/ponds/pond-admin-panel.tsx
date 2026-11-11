
"use client";
import { useActionState, useEffect } from "react";
import Swal from "sweetalert2";
import { useFormStatus } from "react-dom";

import {
  CircleCheck,
  Plus,
  Waves,
  Fish,
  Layers3,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  createPondAction,
  type PondAdminState,
} from "@/app/(protected)/ponds/actions";

// =============================================
// TYPES
// =============================================

type Pond = {
  id: string;
  code: string;
  name: string;
  type: string;
  fishSpecies: string | null;
  isActive: boolean;
};

type Props = {
  ponds: Pond[];
};

// =============================================
// INITIAL STATE
// =============================================

const initialState: PondAdminState = {
  error: null,
  success: null,
};

// =============================================
// STYLE
// =============================================

const inputClass =
  "h-11 w-full rounded-lg border border-[#CBD3E7] " +
  "bg-white px-3.5 text-sm font-medium text-[#1F2937] " +
  "placeholder:text-[#64748B] placeholder:opacity-100 " +
  "outline-none transition-all duration-200 " +
  "hover:border-[#94A3B8] " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

// =============================================
// SUBMIT BUTTON
// =============================================

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="
        inline-flex h-11 items-center justify-center gap-2
        rounded-lg bg-[#0754CC] px-5
        text-sm font-semibold text-white
        shadow-sm transition-all
        hover:bg-blue-700
        active:scale-[0.98]
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      <Plus size={17} />
      {pending ? "Menyimpan..." : "Daftarkan Kolam"}
    </button>
  );
}

// =============================================
// FEEDBACK
// =============================================


function Feedback({
  state,
}: {
  state: PondAdminState;
}) {
  useEffect(() => {
    if (!state.error && !state.success) return;

    const isError = Boolean(state.error);

    void Swal.fire({
      icon: isError ? "error" : "success",

      title: isError
        ? "Gagal!"
        : "Berhasil!",

      text: state.error ?? state.success ?? "",

      position: "top",

      showConfirmButton: isError,

      confirmButtonText: "Mengerti",

      confirmButtonColor: "#0754CC",

      timer: isError ? undefined : 2500,

      timerProgressBar: !isError,

      allowOutsideClick: !isError,

      allowEscapeKey: true,

      background: "#FFFFFF",

      color: "#1F2937",

      iconColor: isError ? "#DC2626" : "#16A34A",

      width: "420px",

      padding: "1.5rem",

      customClass: {
        popup: "rounded-2xl shadow-2xl",
        title: "text-lg font-bold",
        htmlContainer: "text-sm",
        confirmButton:
          "rounded-lg px-5 py-2.5 text-sm font-semibold",
      },
    });

  }, [state]);

  return null;
}


// =============================================
// POND TYPE LABEL
// =============================================

function pondTypeLabel(type: string) {
  switch (type) {
    case "TABUNG":
      return "Tabung";

    case "PARIT_SEKAT":
      return "Parit Sekat";

    default:
      return type;
  }
}

// =============================================
// MAIN COMPONENT
// =============================================

export function PondAdminPanel({ ponds }: Props) {
  const [pondState, pondAction] = useActionState(
    createPondAction,
    initialState
  );

  const activeCount = ponds.filter(
    (pond) => pond.isActive
  ).length;

  const inactiveCount = ponds.length - activeCount;

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6">

      {/* HEADER */}

      <section
        className="
          flex flex-col justify-between gap-4
          rounded-xl border border-[#CBD3E7]
          bg-white p-5 shadow-sm
          sm:flex-row sm:items-center
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-11 w-11 shrink-0 items-center
              justify-center rounded-xl bg-blue-50
            "
          >
            <Waves size={23} className="text-blue-600" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#1F2937]">
              Kelola Kolam
            </h1>

            <p className="mt-1 text-sm text-[#475569]">
              Kelola dan daftarkan kolam budidaya
              Pondok Lestari.
            </p>
          </div>
        </div>

        <a
          href="#tambah-kolam"
          className="
            inline-flex h-10 items-center justify-center gap-2
            rounded-lg bg-[#0754CC] px-4
            text-sm font-semibold text-white
            transition hover:bg-blue-700
          "
        >
          <Plus size={17} />
          Tambah Kolam
        </a>
      </section>

      {/* SUMMARY */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* TOTAL */}

        <div
          className="
            flex items-center justify-between
            rounded-xl border border-[#D5DCEB]
            bg-white p-5 shadow-sm
          "
        >
          <div>
            <p className="text-sm text-[#475569]">
              Total Kolam
            </p>

            <p className="mt-2 text-3xl font-bold text-[#1F2937]">
              {ponds.length}
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              Seluruh kolam terdaftar
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
            <Waves size={25} className="text-blue-600" />
          </div>
        </div>

        {/* ACTIVE */}

        <div
          className="
            flex items-center justify-between
            rounded-xl border border-[#D5DCEB]
            bg-white p-5 shadow-sm
          "
        >
          <div>
            <p className="text-sm text-[#475569]">
              Kolam Aktif
            </p>

            <p className="mt-2 text-3xl font-bold text-[#15803D]">
              {activeCount}
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              Siap digunakan
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
            <CircleCheck size={25} className="text-green-700" />
          </div>
        </div>

        {/* INACTIVE */}

        <div
          className="
            flex items-center justify-between
            rounded-xl border border-[#D5DCEB]
            bg-white p-5 shadow-sm
          "
        >
          <div>
            <p className="text-sm text-[#475569]">
              Kolam Nonaktif
            </p>

            <p className="mt-2 text-3xl font-bold text-[#64748B]">
              {inactiveCount}
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              Tidak sedang digunakan
            </p>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
            <Layers3 size={25} className="text-slate-600" />
          </div>
        </div>

      </section>

      {/* POND LIST */}

      <section
        className="
          rounded-xl border border-[#CBD3E7]
          bg-white p-5 shadow-sm
        "
      >
        <div
          className="
            mb-5 flex flex-wrap items-center
            justify-between gap-3
            border-b border-[#E2E8F0] pb-4
          "
        >
          <div className="flex items-center gap-2">
            <Waves size={20} className="text-blue-600" />

            <div>
              <h2 className="font-semibold text-[#1F2937]">
                Daftar Kolam Terdaftar
              </h2>

              <p className="mt-1 text-xs text-[#64748B]">
                Informasi seluruh kolam budidaya.
              </p>
            </div>
          </div>

          <span
            className="
              rounded-full border border-blue-100
              bg-blue-50 px-3 py-1.5
              text-xs font-semibold text-blue-700
            "
          >
            {ponds.length} Kolam
          </span>
        </div>

        {/* POND CARDS */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {ponds.map((pond) => (
            <div
              key={pond.id}
              className="
                rounded-xl border border-[#DCE3EF]
                bg-white p-4 transition-all
                hover:border-blue-300 hover:shadow-sm
              "
            >
              <div className="flex items-start justify-between gap-3">

                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex h-11 w-11 shrink-0
                      items-center justify-center
                      rounded-xl bg-blue-50
                    "
                  >
                    <Waves size={21} className="text-blue-600" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#1F2937]">
                      {pond.name}
                    </h3>

                    <p className="mt-1 text-xs font-medium text-[#64748B]">
                      {pond.code}
                    </p>
                  </div>
                </div>

                <span
                  className={`
                    shrink-0 rounded-full px-3 py-1
                    text-xs font-semibold
                    ${
                      pond.isActive
                        ? "border border-green-200 bg-green-50 text-green-700"
                        : "border border-slate-200 bg-slate-100 text-[#475569]"
                    }
                  `}
                >
                  {pond.isActive ? "Aktif" : "Nonaktif"}
                </span>

              </div>

              <div
                className="
                  mt-4 grid grid-cols-2 gap-3
                  border-t border-[#E2E8F0] pt-4
                "
              >
                <div>
                  <p className="text-xs text-[#64748B]">
                    Jenis Kolam
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#334155]">
                    {pondTypeLabel(pond.type)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <Fish size={14} className="text-[#64748B]" />

                    <p className="text-xs text-[#64748B]">
                      Jenis Ikan
                    </p>
                  </div>

                  <p className="mt-1 text-sm font-semibold text-[#334155]">
                    {pond.fishSpecies || "-"}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* EMPTY STATE */}

          {ponds.length === 0 && (
            <div
              className="
                col-span-full flex flex-col
                items-center justify-center
                rounded-xl border border-dashed
                border-[#CBD5E1] bg-[#F8FAFC]
                px-5 py-12 text-center
              "
            >
              <div
                className="
                  flex h-14 w-14 items-center
                  justify-center rounded-full bg-blue-50
                "
              >
                <Waves size={26} className="text-blue-600" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-[#1F2937]">
                Belum Ada Kolam
              </h3>

              <p className="mt-2 max-w-sm text-sm text-[#64748B]">
                Belum ada kolam yang terdaftar.
                Silakan daftarkan kolam pertama
                untuk memulai pengelolaan.
              </p>
            </div>
          )}

        </div>
      </section>

      {/* CREATE POND FORM */}

      <section
        id="tambah-kolam"
        className="
          scroll-mt-6 rounded-xl
          border border-[#CBD3E7]
          bg-white p-5 shadow-sm
        "
      >
        <div
          className="
            mb-5 flex items-center gap-3
            border-b border-[#E2E8F0] pb-4
          "
        >
          <div
            className="
              flex h-10 w-10 items-center
              justify-center rounded-lg bg-blue-50
            "
          >
            <Plus size={21} className="text-blue-600" />
          </div>

          <div>
            <h2 className="font-semibold text-[#1F2937]">
              Daftarkan Kolam Baru
            </h2>

            <p className="mt-1 text-xs text-[#64748B]">
              Lengkapi informasi kolam yang akan ditambahkan ke sistem.
            </p>
          </div>
        </div>

        <form action={pondAction} className="space-y-5">

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* NAMA KOLAM */}

            <div>
              <label
                htmlFor="pond-name"
                className="mb-2 block text-sm font-medium text-[#334155]"
              >
                Nama Kolam
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="pond-name"
                name="name"
                type="text"
                placeholder="Contoh: Kolam 4 - Gurame"
                required
                minLength={2}
                maxLength={120}
                className={inputClass}
              />
            </div>

            {/* JENIS KOLAM */}

            <div>
              <label
                htmlFor="pond-type"
                className="mb-2 block text-sm font-medium text-[#334155]"
              >
                Jenis Kolam
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                id="pond-type"
                name="type"
                required
                defaultValue="PARIT_SEKAT"
                className={inputClass}
              >
                <option value="PARIT_SEKAT">
                  Parit Sekat
                </option>

                <option value="TABUNG">
                  Tabung
                </option>
              </select>
            </div>

            {/* JENIS IKAN */}

            <div>
              <label
                htmlFor="pond-fish"
                className="mb-2 block text-sm font-medium text-[#334155]"
              >
                Jenis Ikan
              </label>

              <input
                id="pond-fish"
                name="fishSpecies"
                type="text"
                placeholder="Contoh: Gurame"
                maxLength={100}
                className={inputClass}
              />

              {/* <p className="mt-1.5 text-xs text-[#64748B]">
                Boleh dikosongkan jika belum ditentukan.
              </p> */}
            </div>

          </div>

          <Feedback state={pondState} />

          {/* BUTTONS */}

          <div
            className="
              flex flex-col-reverse justify-end
              gap-3 border-t border-[#E2E8F0]
              pt-4 sm:flex-row
            "
          >
            <button
              type="reset"
              className="
                h-11 rounded-lg border
                border-[#CBD3E1] bg-white
                px-5 text-sm font-medium
                text-[#334155] transition
                hover:bg-[#F8FAFC]
              "
            >
              Reset
            </button>

            <SubmitButton />
          </div>

        </form>
      </section>

      {/* FOOTER INFORMATION */}

      <div
        className="
          flex items-start gap-2.5
          rounded-lg border border-blue-100
          bg-blue-50 p-4
        "
      >
        <CircleCheck
          size={18}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <p className="text-xs leading-relaxed text-[#334155]">
          Data kolam disimpan secara langsung ke database
          MySQL menggunakan Prisma. Kode kolam dibuat otomatis
          berdasarkan ID unik database. Hanya Admin yang dapat
          mendaftarkan kolam baru melalui halaman ini.
        </p>
      </div>

    </div>
  );
}
