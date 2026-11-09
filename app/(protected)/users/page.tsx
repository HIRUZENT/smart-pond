
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getCurrentUser } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

import {
  UsersTable,
  type UserTableItem,
} from "@/src/components/users/users-table";

import { RegistrationAlert } from "@/src/components/users/registration-alert";

async function UsersContent() {
  // Next.js 16 Cache Components:
  // tunggu request aktual sebelum membaca session.
  await connection();

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const records = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      loginId: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  const users: UserTableItem[] = records.map((user) => ({
    id: user.id,
    name: user.name,
    loginId: user.loginId,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <Suspense fallback={null}>
        <RegistrationAlert />
      </Suspense>

      <UsersTable users={users} />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div
            role="status"
            aria-label="Memuat daftar pengguna"
            className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"
          />
        </div>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
