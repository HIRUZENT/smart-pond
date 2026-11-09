import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { UserForm } from "@/src/components/users/user-form";

type Props = { params: Promise<{ id: string }> };
async function EditContent({ params }: Props) {
  await requireRole("ADMIN");
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, loginId: true, email: true, phone: true, role: true, isActive: true },
  });
  if (!user || user.role === "ADMIN") notFound();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Detail Akun Pengguna</h1>
        <p className="mt-1 text-sm text-slate-500">Ubah identitas, role, status, atau reset password pengguna.</p>
      </div>
      <UserForm user={{ ...user, role: user.role }} />
    </div>
  );
}
export default function EditUserPage({ params }: Props) {
  return <Suspense fallback={<p className="p-6 text-slate-500">Memuat detail pengguna…</p>}><EditContent params={params} /></Suspense>;
}
