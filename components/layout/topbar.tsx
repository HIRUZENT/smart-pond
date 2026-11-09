
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
} from "lucide-react";

import { logoutAction } from "@/app/login/actions";

type TopbarProps = {
  user: {
    name: string;
    email?: string | null;
    role: string;
  };
  onMenuClick: () => void;
};

export function Topbar({
  user,
  onMenuClick,
}: TopbarProps) {
  const pathname = usePathname();

  const [isDropdownOpen, setIsDropdownOpen] =
    useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const pageTitle =
    pathname === "/operations"
      ? "Pencatatan Aktivitas & Tindak Lanjut Operasional"
      : pathname === "/operations/history"
        ? "Riwayat Aktivitas Operasional"
        : pathname === "/ponds"
          ? "Pengelolaan Kolam & Penugasan"
          : pathname === "/users"
            ? "Daftar Akun Pengguna"
            : pathname.startsWith("/users/")
              ? "Detail Akun Pengguna"
              : pathname.startsWith("/dashboard")
                ? "Monitoring Kualitas Air"
                : pathname.startsWith("/schedules")
                  ? "Jadwal & Pengingat"
                  : pathname.startsWith("/expenses")
                    ? "Aktivitas & Biaya"
                    : "SMART-POND";

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const roleLabel =
    user.role === "ADMIN"
      ? "Admin"
      : user.role === "MANAGER"
        ? "Pengelola"
        : "Petugas";

  // Tutup dropdown saat klik di luar profil
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setIsDropdownOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // Tutup dropdown ketika berpindah halaman
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-7">

      {/* LEFT: PAGE TITLE */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Buka navigasi"
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <h1 className="truncate text-[18px] font-semibold text-[#222222]">
          {pageTitle}
        </h1>
      </div>

      {/* RIGHT: USER INFORMATION */}
      <div className="flex shrink-0 items-center gap-4 sm:gap-6">

        {/* ROLE BADGE */}
        <span className="hidden items-center rounded-full bg-[#D7E6FF] px-3 py-1 text-[12px] font-semibold text-[#1264DA] sm:inline-flex">
          <span className="mr-1">◯</span>
          {roleLabel}
        </span>

        {/* DIVIDER */}
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        {/* NOTIFICATION */}
        <button
          type="button"
          aria-label="Notifikasi"
          title="Notifikasi"
          className="text-slate-800 transition hover:text-blue-600"
        >
          <Bell size={20} />
        </button>

        {/* PROFILE DROPDOWN */}
        <div
          ref={dropdownRef}
          className="relative"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          {/* PROFILE TRIGGER */}
          <button
            type="button"
            aria-label="Menu akun pengguna"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
            onClick={() =>
              setIsDropdownOpen((prev) => !prev)
            }
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            {/* AVATAR */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E0E7FF] text-xs font-medium text-slate-700">
              {initials}
            </div>

            {/* USER DETAILS */}
            <div className="hidden max-w-[190px] sm:block">
              <p className="truncate text-[13px] font-semibold text-slate-800">
                {user.name}
              </p>

              <p className="truncate text-[12px] text-slate-500">
                {user.email ?? ""}
              </p>
            </div>

            {/* DROPDOWN ARROW */}
            <ChevronDown
              size={16}
              className={`text-slate-600 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {/* DROPDOWN CONTENT */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full z-50 w-[240px] pt-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-[0_10px_35px_rgba(0,0,0,0.12)]">

                {/* ACCOUNT INFORMATION */}
                <div className="border-b border-slate-100 px-3 py-3">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {user.name}
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {user.email || roleLabel}
                  </p>
                </div>

                {/* LOGOUT BUTTON */}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-500"
                  >
                    <LogOut size={17} />
                    <span>Keluar dari Akun</span>
                  </button>
                </form>

              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
