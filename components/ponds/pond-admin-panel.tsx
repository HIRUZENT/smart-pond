
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  CircleCheck,
  Plus,
  Users,
  Waves,
  ShieldCheck,
} from "lucide-react";

import {
  assignPondAction,
  createPondAction,
  createAdminAccountAction,
  removePondAssignmentAction,
  type PondAdminState,
} from "@/app/(protected)/ponds/actions";

type Member = {
  id: string;
  name: string;
  role: string;
};

type Pond = {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
  members: Member[];
};

type Props = {
  ponds: Pond[];
  users: Member[];
};

const initialState: PondAdminState = {
  error: null,
  success: null,
};

const inputClass =
  "h-10 w-full rounded-lg border border-[#C8D0E5] " +
  "bg-white px-3 text-sm text-slate-800 " +
  "outline-none focus:border-blue-500 " +
  "focus:ring-2 focus:ring-blue-100";

function Submit({
  text,
}: {
  text: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0754CC] px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      <Plus size={16} />
      {pending ? "Menyimpan..." : text}
    </button>
  );
}

function Feedback({
  state,
}: {
  state: PondAdminState;
}) {
  if (!state.error && !state.success) return null;

  return (
    <div
      role="status"
      className={`rounded-lg border p-3 text-sm ${
        state.error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {state.error ?? state.success}
    </div>
  );
}

export function PondAdminPanel({
  ponds,
  users,
}: Props) {
  const [pondState, pondAction] = useActionState(
    createPondAction,
    initialState
  );

  const [assignState, assignAction] = useActionState(
    assignPondAction,
    initialState
  );

  const [adminState, adminAction] = useActionState(
    createAdminAccountAction,
    initialState
  );

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-slate-900">
          Pengelolaan Kolam & Penugasan
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Admin dapat mendaftarkan kolam,
          menetapkan pengelola dan petugas,
          serta membuat akun Admin.
        </p>
      </div>

      {/* DAFTAR KOLAM */}
      <section className="rounded-xl border border-[#C8D0E5] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Waves size={20} className="text-blue-600" />
          <h2 className="font-semibold text-slate-900">
            Daftar Kolam Terdaftar
          </h2>
        </div>

        <div className="space-y-3">
          {ponds.map((pond) => (
            <div
              key={pond.id}
              className="rounded-lg border border-slate-200 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {pond.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {pond.code} ·{" "}
                    {pond.type === "TABUNG"
                      ? "Tabung"
                      : "Parit Sekat"}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    pond.isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {pond.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {pond.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {member.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {member.role === "MANAGER"
                          ? "Pengelola"
                          : "Petugas"}
                      </p>
                    </div>

                    <form
                      action={removePondAssignmentAction}
                    >
                      <input
                        type="hidden"
                        name="pondId"
                        value={pond.id}
                      />
                      <input
                        type="hidden"
                        name="userId"
                        value={member.id}
                      />
                      <button
                        type="submit"
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      >
                        Hapus Penugasan
                      </button>
                    </form>
                  </div>
                ))}

                {pond.members.length === 0 && (
                  <p className="text-xs text-amber-700">
                    Belum memiliki pengguna yang ditugaskan.
                  </p>
                )}
              </div>
            </div>
          ))}

          {ponds.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              Belum ada kolam terdaftar.
            </p>
          )}
        </div>
      </section>

      {/* FORM TAMBAH KOLAM */}
      <section className="rounded-xl border border-[#C8D0E5] bg-white p-5">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4">
          <Plus size={19} className="text-blue-600" />
          <h2 className="font-semibold text-slate-900">
            Daftarkan Kolam Baru
          </h2>
        </div>

        <form action={pondAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Kode Kolam
              </label>
              <input
                name="code"
                placeholder="KLM-001"
                required
                minLength={2}
                maxLength={50}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Nama Kolam
              </label>
              <input
                name="name"
                placeholder="Kolam 4 - Gurame"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Jenis Kolam
              </label>
              <select
                name="type"
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

            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Jenis Ikan
              </label>
              <input
                name="fishSpecies"
                placeholder="Gurame"
                className={inputClass}
              />
            </div>
          </div>

          <Feedback state={pondState} />
          <Submit text="Daftarkan Kolam" />
        </form>
      </section>

      {/* PENUGASAN KOLAM */}
      <section className="rounded-xl border border-[#C8D0E5] bg-white p-5">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4">
          <Users size={19} className="text-blue-600" />
          <h2 className="font-semibold text-slate-900">
            Assign Pengelola / Petugas
          </h2>
        </div>

        <form action={assignAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Pilih Kolam
              </label>

              <select
                name="pondId"
                required
                className={inputClass}
                defaultValue=""
              >
                <option value="" disabled>
                  Pilih kolam...
                </option>

                {ponds
                  .filter((pond) => pond.isActive)
                  .map((pond) => (
                    <option
                      key={pond.id}
                      value={pond.id}
                    >
                      {pond.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Pilih Pengguna
              </label>

              <select
                name="userId"
                required
                className={inputClass}
                defaultValue=""
              >
                <option value="" disabled>
                  Pilih Pengelola/Petugas...
                </option>

                {users.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.name} (
                    {user.role === "MANAGER"
                      ? "Pengelola"
                      : "Petugas"}
                    )
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Feedback state={assignState} />

          <Submit text="Simpan Penugasan" />
        </form>
      </section>

      {/* REGISTRASI ADMIN */}
      <section className="rounded-xl border border-[#C8D0E5] bg-white p-5">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-200 pb-4">
          <ShieldCheck
            size={19}
            className="text-blue-600"
          />
          <h2 className="font-semibold text-slate-900">
            Daftarkan Admin Baru
          </h2>
        </div>

        <form action={adminAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Nama Admin
              </label>
              <input
                name="adminName"
                required
                minLength={2}
                autoComplete="off"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">
                Email Admin
              </label>
              <input
                name="adminEmail"
                type="email"
                required
                autoComplete="off"
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium">
                Password Awal
              </label>
              <input
                name="adminPassword"
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                className={inputClass}
                placeholder="Minimal 12 karakter"
              />
            </div>
          </div>

          <Feedback state={adminState} />

          <Submit text="Daftarkan Admin" />
        </form>
      </section>

      <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-4 text-xs text-blue-800">
        <CircleCheck size={17} />
        Penugasan kolam disimpan pada MySQL melalui Prisma.
      </div>
    </div>
  );
}
