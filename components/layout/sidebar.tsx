
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Waves,
  Clock3,
  ClipboardList,
  CircleDollarSign,
  UserRoundCog,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  X,
  Database,
  History,
} from "lucide-react";

type UserRole = "ADMIN" | "MANAGER" | "OPERATOR";

type SidebarProps = {
  user: {
    name: string;
    email?: string | null;
    role: string;
  };
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

const navigation = [
  {
    title: "Monitoring Kualitas Air",
    href: "/dashboard",
    icon: Waves,
    roles: ["MANAGER", "OPERATOR"],
  },
  {
    title: "Jadwal & Pengingat",
    href: "/schedules",
    icon: Clock3,
    roles: ["MANAGER"],
  },
  {
    title: "Catat Aktivitas Operasional",
    href: "/operations",
    icon: ClipboardList,
    roles: ["MANAGER", "OPERATOR"],
  },
  {
    title: "Riwayat Aktivitas",
    href: "/operations/history",
    icon: History,
    roles: ["ADMIN", "MANAGER", "OPERATOR"],
  },
  {
    title: "Aktivitas & Biaya",
    href: "/expenses",
    icon: CircleDollarSign,
    roles: ["MANAGER", "OPERATOR"],
  },
  {
    title: "Kelola Pengguna",
    href: "/users",
    icon: UserRoundCog,
    roles: ["ADMIN"],
  },
  {
    title: "Kelola Kolam & Assign",
    href: "/ponds",
    icon: Database,
    roles: ["ADMIN"],
  },
];

export function Sidebar({
  user,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase();

  const roleLabel =
    user.role === "ADMIN"
      ? "Admin/Owner"
      : user.role === "MANAGER"
        ? "Pengelola Tambak"
        : "Petugas Operasional";

  const items = navigation.filter((item) =>
    item.roles.includes(user.role as UserRole)
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup navigasi"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[240px] flex-col
          border-r border-slate-200 bg-white
          transition-all duration-300
          ${
            collapsed
              ? "lg:w-[76px]"
              : "lg:w-[240px]"
          }
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* LOGO */}
        <div className="flex h-[108px] shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <Link
            href={
              user.role === "ADMIN"
                ? "/users"
                : "/dashboard"
            }
            onClick={onMobileClose}
            className={collapsed ? "lg:hidden" : ""}
          >
            <Image
              src="/logo_smartpond.png"
              alt="SMART-POND"
              width={165}
              height={50}
              priority
              className="h-auto w-[155px] object-contain"
            />
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label="Ubah ukuran sidebar"
            className="hidden rounded-md bg-slate-50 p-2 text-blue-600 hover:bg-blue-50 lg:block"
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>

          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Tutup navigasi"
            className="text-slate-600 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p
            className={`mb-3 px-1 text-[12px] font-medium text-slate-500 ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            Navigasi
          </p>

          <nav
            aria-label="Navigasi utama"
            className="space-y-2"
          >
            {items.map((item) => {
              const Icon = item.icon;

              const active =
                item.href === "/operations"
                  ? pathname === "/operations"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.title}
                  onClick={onMobileClose}
                  aria-current={
                    active ? "page" : undefined
                  }
                  className={`
                    flex min-h-[44px] items-center
                    gap-3 rounded-lg px-3 py-2.5
                    text-[13px] transition-colors
                    ${
                      active
                        ? "bg-[#F2F6FF] font-semibold text-[#0754CC]"
                        : "text-[#5A5A5A] hover:bg-slate-50"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.2 : 1.8}
                    className="shrink-0"
                  />

                  <span
                    className={`whitespace-nowrap ${
                      collapsed ? "lg:hidden" : ""
                    }`}
                  >
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* USER PROFILE */}
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B5D4FA] text-[12px] font-medium text-slate-800">
              {initials}
            </div>

            <div
              className={`min-w-0 flex-1 ${
                collapsed ? "lg:hidden" : ""
              }`}
            >
              <p className="truncate text-[13px] font-semibold text-slate-800">
                {user.name}
              </p>

              <p className="truncate text-[12px] text-slate-500">
                {roleLabel}
              </p>
            </div>

            <MoreVertical
              size={17}
              className={`text-slate-500 ${
                collapsed ? "lg:hidden" : ""
              }`}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
