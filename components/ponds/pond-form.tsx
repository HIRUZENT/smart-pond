
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  ArrowLeft,
  Waves,
  Fish,
  Hash,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  createPondAction,
  type PondAdminState,
} from "@/app/(protected)/ponds/actions";

const inputClass =
  "h-11 w-full rounded-lg border border-[#cbd3e7] bg-white px-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-2 block text-[13px] font-medium text-slate-800";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0754cc] px-6 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
    >
      <Plus size={17} />

      {pending ? "Menyimpan Kolam..." : "Simpan Kolam"}
    </button>
  );
}

export function PondForm() {
  const [state, formAction] = useActionState<
    PondAdminState,
    FormData
  >(createPondAction, {
    error: null,
    success: null,
  });
  {
    state.success && (
      <div
        role="status"
        className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
      >
        {state.success}
      </div>
    )
  }
  return (
    <section className="mx-auto w-full max-w-[1100px]">

      <form
        action={formAction}
        className="space-y-7 rounded-2xl border border-[#cbd3e7] bg-white p-5 shadow-sm sm:p-8"
      >

        {/* IDENTITAS KOLAM */}
        <section>
          <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4">
            <Waves size={20} className="text-blue-600" />

            <h2 className="text-[15px] font-semibold text-slate-900">
              1. Identitas Kolam Budidaya
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* KODE KOLAM */}
            <div>
              <label htmlFor="code" className={labelClass}>
                Kode Kolam <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Hash
                  size={16}
                  className="pointer-events-none absolute left-3 top-3 text-slate-400"
                />

                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  autoComplete="off"
                  placeholder="Contoh: KOLAM-001"
                  className={`${inputClass} pl-9 uppercase`}
                />
              </div>

              <p className="mt-1.5 text-[11px] text-slate-500">
                Kode kolam harus unik dan digunakan sebagai
                identitas kolam dalam sistem.
              </p>
            </div>

            {/* NAMA KOLAM */}
            <div>
              <label htmlFor="name" className={labelClass}>
                Nama Kolam <span className="text-red-500">*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={120}
                placeholder="Contoh: Kolam Lele"
                className={inputClass}
              />

              <p className="mt-1.5 text-[11px] text-slate-500">
                Masukkan nama kolam yang mudah dikenali.
              </p>
            </div>

            {/* JENIS KOLAM */}
            <div>
              <label htmlFor="type" className={labelClass}>
                Jenis Kolam <span className="text-red-500">*</span>
              </label>

              <select
                id="type"
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

              <p className="mt-1.5 text-[11px] text-slate-500">
                Pilih jenis konstruksi kolam budidaya.
              </p>
            </div>

            {/* KOMODITAS IKAN */}
            <div>
              <label htmlFor="fishSpecies" className={labelClass}>
                Komoditas / Jenis Ikan
              </label>

              <div className="relative">
                <Fish
                  size={16}
                  className="pointer-events-none absolute left-3 top-3 text-slate-400"
                />

                <input
                  id="fishSpecies"
                  name="fishSpecies"
                  type="text"
                  maxLength={100}
                  placeholder="Contoh: Lele, Nila, Gurame"
                  className={`${inputClass} pl-9`}
                />
              </div>

              <p className="mt-1.5 text-[11px] text-slate-500">
                Isi jenis ikan yang dibudidayakan jika tersedia.
              </p>
            </div>
          </div>
        </section>

        {/* INFORMASI STATUS */}
        <section>
          <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-4">
            <CheckCircle2 size={19} className="text-blue-600" />

            <h2 className="text-[15px] font-semibold text-slate-900">
              2. Status Kolam
            </h2>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-green-600"
            />

            <div>
              <p className="text-[13px] font-semibold text-green-800">
                Kolam akan didaftarkan sebagai kolam aktif.
              </p>

              <p className="mt-1 text-[11px] leading-5 text-green-700">
                Kolam yang berhasil didaftarkan akan masuk ke
                daftar monitoring. Pengelola dapat melihat
                kolam setelah Admin memberikan penugasan.
              </p>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <p>{state.error}</p>
          </div>
        )}

        {/* ACTION BUTTON */}
        <div className="flex flex-col-reverse justify-between gap-3 border-t border-[#cbd3e7] pt-5 sm:flex-row sm:items-center">

          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#cbd3e7] px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Batal & Kembali
          </Link>

          <SubmitButton />
        </div>
      </form>
    </section>
  );
}
