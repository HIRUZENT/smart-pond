
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Waves } from "lucide-react";

import { requireRole } from "@/src/lib/auth";
import { PondForm } from "@/components/ponds/pond-form";

function LoadingForm() {
  return (
    <div className="mx-auto max-w-[1100px] animate-pulse rounded-2xl border border-slate-200 bg-white p-8">
      <div className="h-6 w-56 rounded bg-slate-200" />
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-16 rounded bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

export default function NewPondPage() {
  return (
    <Suspense fallback={<LoadingForm />}>
      <NewPondContent />
    </Suspense>
  );
}

async function NewPondContent() {
  const admin = await requireRole("ADMIN");

  if (!admin) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">

      {/* HEADER HALAMAN */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Waves size={21} className="text-blue-600" />

            <h2 className="text-xl font-semibold text-slate-900">
              Tambah Kolam
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Daftarkan kolam budidaya baru ke dalam sistem
            monitoring SMART-POND.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Kembali ke Monitoring
        </Link>
      </section>

      {/* FORM */}
      <PondForm />

    </div>
  );
}
