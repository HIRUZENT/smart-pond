
"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { logoutAction } from "@/app/login/actions";

type User = {
  name: string;
  email?: string | null;
  role: string;
};

export function AppShell({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-white">
      <Sidebar
        user={user}
        mobileOpen={open}
        onMobileClose={() => setOpen(false)}
      />

      <div className="min-h-dvh lg:ml-[240px]">
        <Topbar
          user={user}
          onMenuClick={() => setOpen(true)}
        />

        <main className="px-4 py-6 sm:px-7">
          {children}
        </main>
      </div>
    </div>
  );
}
