
import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { LoginForm } from "@/components/auth/login-form";
import {
  getCurrentUser,
  landingPageForRole,
} from "@/src/lib/auth";

async function LoginContent() {
  await connection();

  const user = await getCurrentUser();

  if (user) {
    redirect(landingPageForRole(user.role));
  }

  return (
    <main className="flex min-h-dvh flex-col bg-white lg:flex-row">

      {/* PANEL KIRI */}
      <section
        className="
          flex min-h-[220px] w-full shrink-0
          flex-col justify-center
          rounded-b-[32px]
          bg-[linear-gradient(150deg,#4385ED_0%,#2458B8_48%,#091A35_100%)]
          px-8 py-10 text-white
          sm:px-12
          lg:min-h-dvh lg:w-[43.125%]
          lg:rounded-b-none lg:rounded-r-[32px]
          lg:px-[52px]
        "
      >
        <div className="max-w-[520px]">
          <h1 className="text-[28px] leading-[1.15] font-bold tracking-tight sm:text-[32px]">
            Platform Monitoring
            <br />
            Kualitas Air Kolam
          </h1>

          <p className="mt-[18px] text-[16px] leading-[26px] text-white">
            Integrasi pemantauan, pencatatan, dan
            visualisasi kondisi kualitas air kolam
            dalam satu platform digital terintegrasi.
          </p>
        </div>
      </section>

      {/* PANEL KANAN */}
      <section className="flex min-w-0 flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-12 xl:px-[72px]">
        <div className="w-full max-w-[668px]">

          {/* LOGO */}
          <div className="mb-[42px]">
            <Image
              src="/logo_smartpond.png"
              alt="SMART-POND"
              width={220}
              height={65}
              priority
              className="h-auto w-[210px] object-contain"
            />
          </div>

          {/* JUDUL */}
          <h2 className="text-[28px] leading-[36px] font-bold tracking-tight text-[#202124]">
            Masuk ke Akun Anda
          </h2>

          <p className="mt-1 mb-5 text-[16px] leading-[26px] text-[#50535B]">
            Gunakan username atau email terdaftar dan
            kata sandi untuk mengakses dashboard
          </p>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}

/**
 * Fallback yang tidak membaca session.
 */
function LoginLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white">
      <div
        role="status"
        className="flex flex-col items-center gap-4"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

        <p className="text-sm text-slate-500">
          Memuat SMART-POND...
        </p>
      </div>
    </main>
  );
}

/**
 * Halaman utama login.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
