
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

export function RegistrationAlert() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const created = searchParams.get("created") === "1";
  const updated = searchParams.get("updated") === "1";

  if (!created && !updated) {
    return null;
  }

  const message = created
    ? "Akun pengguna berhasil didaftarkan!"
    : "Perubahan akun pengguna berhasil disimpan!";

  function dismiss() {
    router.replace("/users", {
      scroll: false,
    });
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="
        mb-5 flex items-start justify-between
        gap-4 rounded-xl border border-green-200
        bg-green-50 px-4 py-4 shadow-sm
      "
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          size={22}
          className="mt-0.5 shrink-0 text-green-600"
        />

        <div>
          <h3 className="text-sm font-semibold text-green-800">
            Berhasil!
          </h3>

          <p className="mt-1 text-sm text-green-700">
            {message}
          </p>

          {created && (
            <p className="mt-1 text-xs text-green-700">
              Pengguna baru sekarang dapat masuk
              menggunakan email dan password yang
              telah didaftarkan.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup notifikasi"
        className="
          rounded-md p-1 text-green-700
          transition hover:bg-green-100
        "
      >
        <X size={18} />
      </button>
    </div>
  );
}
