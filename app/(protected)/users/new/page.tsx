
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { UserForm } from "@/src/components/users/user-form";
import { getCurrentUser } from "@/src/lib/auth";

async function NewUserContent() {
  // Pastikan halaman diproses saat request,
  // bukan ketika prerender.
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <UserForm />
    </div>
  );
}

export default function NewUserPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-slate-500">
          Memuat formulir akun...
        </div>
      }
    >
      <NewUserContent />
    </Suspense>
  );
}
