
"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  CircleUserRound,
  ClipboardList,
  RotateCcw,
  Eye,
  EyeOff,
  LockKeyhole,
  CheckCircle2,
  XCircle,
  Info,
  UserRoundPlus,
} from "lucide-react";

import {
  createUserAction,
  updateUserAction,
  type AccountFormState,
} from "@/app/(protected)/users/actions";

type EditableUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: "MANAGER" | "OPERATOR";
  isActive: boolean;
};

type UserRole = "MANAGER" | "OPERATOR";

const inputClass =
  "h-10 w-full rounded-md border border-[#cbd3e7] " +
  "bg-white px-3 text-[13px] text-slate-800 " +
  "outline-none placeholder:text-slate-400 " +
  "focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-1.5 block text-[13px] font-medium text-slate-800";

const roleOptions = [
  {
    value: "MANAGER",
    title: "Pengelola Tambak",
    tags: [
      "Akses Telemetri Real-Time",
      "Konfigurasi Ambang Batas",
      "Disposisi Tindak Lanjut",
      "Rekap Kas Operasional",
    ],
  },
  {
    value: "OPERATOR",
    title: "Petugas Operasional Lapangan",
    tags: [
      "Pencatatan Aktivitas Lapangan",
      "Eksekusi Peringatan",
      "Input Nota Belanja",
    ],
  },
] as const;

function SubmitButton({ edit }: { edit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="
        inline-flex min-h-10 items-center justify-center
        gap-2 rounded-md bg-[#0754cc] px-5
        text-sm font-semibold text-white
        transition hover:bg-[#0646ad]
        disabled:cursor-wait disabled:opacity-60
      "
    >
      <UserRoundPlus size={16} />

      {pending
        ? "Menyimpan..."
        : edit
          ? "Simpan Perubahan Akun"
          : "+ Daftarkan & Simpan Akun Baru"}
    </button>
  );
}

export function UserForm({
  user,
}: {
  user?: EditableUser;
}) {
  const edit = Boolean(user);

  const boundAction = user
    ? updateUserAction.bind(null, user.id)
    : createUserAction;

  const [state, formAction] = useActionState<
    AccountFormState,
    FormData
  >(boundAction, { error: null });

  const [role, setRole] = useState<UserRole>(
    user?.role ?? "MANAGER"
  );

  const [email, setEmail] = useState(
    user?.email ?? ""
  );

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const strength = useMemo(() => {
    let score = 0;

    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
      score++;
    }
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    return score;
  }, [password]);

  const strengthLabel = [
    "Belum diisi",
    "Lemah",
    "Cukup",
    "Baik",
    "Kuat",
  ][strength];

  const passwordsMatch =
    password.length > 0 &&
    confirm.length > 0 &&
    password === confirm;

  return (
    <section className="mx-auto w-full max-w-[1100px] rounded-2xl border border-[#cbd3e7] bg-white px-5 py-7 shadow-sm sm:px-9 sm:py-10">
      <form action={formAction} className="space-y-9">

        {/* ==================================
            1. IDENTITAS PENGGUNA
        ================================== */}
        <section>
          <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4">
            <CircleUserRound
              size={19}
              className="text-blue-600"
            />
            <h2 className="text-[15px] font-semibold text-slate-900">
              1. Identitas Lengkap Anggota Pokdakan
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">

            {/* NAMA LENGKAP */}
            <div>
              <label htmlFor="name" className={labelClass}>
                Nama Lengkap{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                id="name"
                name="name"
                type="text"
                defaultValue={user?.name ?? ""}
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                placeholder="Masukkan nama lengkap"
                className={inputClass}
              />

              <p className="mt-1 text-[11px] text-slate-500">
                Nama lengkap sesuai KTP / kartu identitas
                kelompok.
              </p>
            </div>

            {/* EMAIL SEBAGAI IDENTITAS LOGIN */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Alamat Email{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={191}
                autoComplete="email"
                placeholder="nama@pondoklestari.id"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className={inputClass}
              />

              <p className="mt-1 text-[11px] text-slate-500">
                Email digunakan sebagai identitas login.
                Pastikan email aktif dan belum terdaftar.
              </p>
            </div>

            {/* NOMOR TELEPON */}
            <div className="md:col-span-2 md:max-w-[calc(50%-10px)]">
              <label htmlFor="phone" className={labelClass}>
                Nomor WhatsApp / Telepon{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={user?.phone ?? ""}
                required
                maxLength={25}
                autoComplete="tel"
                placeholder="0812-3456-7890"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* ==================================
            2. ROLE-BASED ACCESS
        ================================== */}
        <section>
          <div className="mb-2 flex items-center gap-2 border-b border-slate-200 pb-4">
            <ClipboardList
              size={19}
              className="text-blue-600"
            />

            <h2 className="text-[15px] font-semibold text-slate-900">
              2. Penetapan Peran Sistem
              (Role-Based Access){" "}
              <span className="text-red-500">*</span>
            </h2>
          </div>

          <p className="mb-4 text-[12px] leading-5 text-slate-500">
            Pilih satu peran yang menentukan wewenang
            akses menu, otorisasi data kolam, dan izin
            tindakan aplikasi sesuai SOP Pokdakan.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {roleOptions.map((item) => {
              const selected = role === item.value;

              return (
                <label
                  key={item.value}
                  className={`
                    cursor-pointer rounded-xl border p-4
                    transition
                    ${
                      selected
                        ? "border-2 border-blue-600 bg-[#f7f9ff]"
                        : "border-[#cbd3e7] bg-white hover:border-blue-300"
                    }
                  `}
                >
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                    <input
                      type="radio"
                      name="role"
                      value={item.value}
                      checked={selected}
                      onChange={() =>
                        setRole(item.value)
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    {item.title}
                  </span>

                  <span className="mt-4 block border-t border-slate-200 pt-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="
                          mr-1 mb-1 inline-block rounded
                          border border-[#cbd3e7]
                          bg-white px-1.5 py-0.5
                          text-[10px] text-slate-600
                        "
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                </label>
              );
            })}
          </div>

          {/* STATUS AKUN - KHUSUS EDIT */}
          {edit && (
            <div className="mt-5 max-w-xs">
              <label
                htmlFor="isActive"
                className={labelClass}
              >
                Status Akun
              </label>

              <select
                id="isActive"
                name="isActive"
                defaultValue={String(
                  user?.isActive ?? true
                )}
                className={inputClass}
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>
          )}

          {!edit && (
            <input
              type="hidden"
              name="isActive"
              value="true"
            />
          )}
        </section>

        {/* ==================================
            3. KREDENSIAL PASSWORD
        ================================== */}
        <section>
          <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4">
            <RotateCcw
              size={19}
              className="text-blue-600"
            />

            <h2 className="text-[15px] font-semibold text-slate-900">
              3. Kredensial Kata Sandi{" "}
              {edit ? "(Opsional)" : "Perdana"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className={labelClass}
              >
                {edit
                  ? "Kata Sandi Baru"
                  : "Kata Sandi Awal"}

                {!edit && (
                  <span className="text-red-500">
                    {" "}*
                  </span>
                )}
              </label>

              <div className="relative">
                <LockKeyhole
                  size={15}
                  className="pointer-events-none absolute left-3 top-3 text-slate-500"
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  required={!edit}
                  minLength={
                    edit ? undefined : 12
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder={
                    edit
                      ? "Kosongkan jika tidak diubah"
                      : "Minimal 12 karakter"
                  }
                  className={`${inputClass} pl-9 pr-10`}
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Sembunyikan sandi"
                      : "Lihat sandi"
                  }
                  onClick={() =>
                    setShowPassword((v) => !v)
                  }
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-blue-600"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* KONFIRMASI PASSWORD */}
            <div>
              <label
                htmlFor="confirmPassword"
                className={labelClass}
              >
                Konfirmasi Kata Sandi{" "}
                {edit ? "Baru" : "Awal"}

                {!edit && (
                  <span className="text-red-500">
                    {" "}*
                  </span>
                )}
              </label>

              <div className="relative">
                <LockKeyhole
                  size={15}
                  className="pointer-events-none absolute left-3 top-3 text-slate-500"
                />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  required={!edit}
                  value={confirm}
                  onChange={(e) =>
                    setConfirm(e.target.value)
                  }
                  placeholder="Ulangi kata sandi"
                  className={`${inputClass} pl-9`}
                />
              </div>

              {confirm.length > 0 && (
                <p
                  className={`
                    mt-1 flex items-center gap-1 text-[11px]
                    ${
                      passwordsMatch
                        ? "text-green-700"
                        : "text-red-600"
                    }
                  `}
                >
                  {passwordsMatch ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <XCircle size={13} />
                  )}

                  {passwordsMatch
                    ? "Sandi cocok"
                    : "Sandi tidak cocok"}
                </p>
              )}
            </div>
          </div>

          {/* KEKUATAN PASSWORD */}
          {password.length > 0 && (
            <div className="mt-4 rounded-md border border-[#cbd3e7] bg-[#fafbff] p-3">
              <div className="mb-1 flex justify-between gap-2 text-[11px]">
                <span>
                  Tingkat Keamanan:{" "}
                  <strong>{strengthLabel}</strong>
                </span>

                <span className="text-slate-500">
                  12 karakter, huruf kapital,
                  angka & simbol
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className={`
                      h-1.5 rounded
                      ${
                        strength >= n
                          ? strength >= 3
                            ? "bg-green-600"
                            : "bg-amber-500"
                          : "bg-slate-200"
                      }
                    `}
                  />
                ))}
              </div>
            </div>
          )}

          {/* KEBIJAKAN PASSWORD */}
          <div className="mt-4 flex gap-2 rounded-md border border-blue-200 bg-[#f3f6ff] p-3 text-[11px] leading-5 text-slate-700">
            <Info
              size={17}
              className="mt-0.5 shrink-0 text-blue-600"
            />

            <span>
              <strong>Kebijakan Sandi Baru:</strong>{" "}
              Admin memberikan kata sandi awal secara
              aman. Fitur wajib mengganti sandi saat
              login pertama memerlukan alur
              change-password tersendiri dan belum
              diaktifkan oleh form ini.
            </span>
          </div>
        </section>

        {/* ==================================
            ERROR MESSAGE
        ================================== */}
        {state.error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {state.error}
          </div>
        )}

        {/* ==================================
            FORM ACTIONS
        ================================== */}
        <div className="flex flex-col-reverse justify-between gap-3 border-t border-[#cbd3e7] pt-5 sm:flex-row sm:items-center">
          <Link
            href="/users"
            className="
              inline-flex h-10 items-center
              justify-center rounded-md
              border border-[#cbd3e7]
              px-5 text-sm font-medium
              text-slate-600 hover:bg-slate-50
            "
          >
            Batal & Kembali
          </Link>

          <SubmitButton edit={edit} />
        </div>
      </form>
    </section>
  );
}
