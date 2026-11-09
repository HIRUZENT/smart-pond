
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/src/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingScreen } from "@/components/ui/loading-screen";

async function Authenticated({
  children,
}: {
  children: ReactNode;
}) {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      user={{
        name: user.name,
        role: user.role,
        email:
          "email" in user && typeof user.email === "string"
            ? user.email
            : null,
      }}
    >
      {children}
    </AppShell>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Authenticated>{children}</Authenticated>
    </Suspense>
  );
}