
"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Plus,
  Search,
  UsersRound,
  X,
} from "lucide-react";

type UserRole = "ADMIN" | "MANAGER" | "OPERATOR";

export type UserTableItem = {
  id: string;
  name: string;
  loginId: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

type UsersTableProps = {
  users: UserTableItem[];
};

type FilterType = "ALL" | "ACTIVE" | "INACTIVE";

type SortType =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "email-asc";

const PAGE_SIZE = 6;

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Pengelola Tambak",
  OPERATOR: "Petugas Tambak",
};

const sortOptions: {
  value: SortType;
  label: string;
}[] = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "name-asc", label: "Nama A-Z" },
  { value: "name-desc", label: "Nama Z-A" },
  { value: "email-asc", label: "Email A-Z" },
];

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

function RoleBadge({
  role,
}: {
  role: UserRole;
}) {
  return (
    <span
      className="
        inline-flex max-w-full items-center gap-1.5
        rounded-full bg-[#C8DCFF] px-3 py-1
        text-[12px] font-medium text-[#0065DF]
      "
    >
      <span
        className="
          h-2.5 w-2.5 shrink-0 rounded-full
          border border-[#0065DF]
        "
      />
      <span className="truncate">
        {roleLabels[role]}
      </span>
    </span>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return active ? (
    <span
      className="
        inline-flex items-center gap-1.5
        rounded-full border border-[#A6E9AE]
        bg-[#F0FFF1] px-3 py-1
        text-[11px] font-semibold text-[#238D35]
      "
    >
      <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
      Aktif
    </span>
  ) : (
    <span
      className="
        inline-flex items-center gap-1.5
        rounded-full border border-[#D9D9D9]
        bg-[#F7F7F7] px-3 py-1
        text-[11px] font-semibold text-[#777777]
      "
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
      Nonaktif
    </span>
  );
}

export function UsersTable({
  users,
}: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [sort, setSort] = useState<SortType>("newest");
  const [page, setPage] = useState(1);
  const [sortOpen, setSortOpen] = useState(false);

  const total = users.length;

  const activeCount = useMemo(
    () => users.filter((user) => user.isActive).length,
    [users]
  );

  const inactiveCount = total - activeCount;

  // Filter, search, dan sorting data
  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = users.filter((user) => {
      const matchesStatus =
        filter === "ALL" ||
        (filter === "ACTIVE" && user.isActive) ||
        (filter === "INACTIVE" && !user.isActive);

      const matchesSearch =
        keyword.length === 0 ||
        user.name.toLowerCase().includes(keyword) ||
        (user.email ?? user.loginId)
          .toLowerCase()
          .includes(keyword) ||
        (user.phone ?? "")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesSearch;
    });

    return result.sort((a, b) => {
      switch (sort) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );

        case "oldest":
          return (
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
          );

        case "name-asc":
          return a.name.localeCompare(b.name, "id");

        case "name-desc":
          return b.name.localeCompare(a.name, "id");

        case "email-asc":
          return (a.email ?? a.loginId).localeCompare(
            b.email ?? b.loginId,
            "id"
          );

        default:
          return 0;
      }
    });
  }, [users, filter, search, sort]);

  const filteredTotal = filteredUsers.length;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTotal / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const endIndex = Math.min(
    startIndex + PAGE_SIZE,
    filteredTotal
  );

  const paginatedUsers = filteredUsers.slice(
    startIndex,
    endIndex
  );

  useEffect(() => {
    setPage(1);
  }, [filter, search, sort]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSortOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        closeOnEscape
      );
    };
  }, []);

  const filterTabs: {
    key: FilterType;
    label: string;
    count: number;
  }[] = [
    {
      key: "ALL",
      label: "Semua Akun",
      count: total,
    },
    {
      key: "ACTIVE",
      label: "Aktif",
      count: activeCount,
    },
    {
      key: "INACTIVE",
      label: "Nonaktif",
      count: inactiveCount,
    },
  ];

  return (
    <div className="w-full space-y-4">

      {/* =====================================
          PAGE HEADING
      ===================================== */}
      <section
        className="
          rounded-xl border border-[#E1E7F2]
          bg-white px-5 py-6 shadow-sm
          sm:px-6
        "
      >
        <div
          className="
            flex flex-col justify-between gap-4
            sm:flex-row sm:items-center
          "
        >
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="
                  flex h-9 w-9 items-center justify-center
                  rounded-lg bg-[#EFF5FF] text-[#0866F9]
                "
              >
                <CircleUserRound size={21} fill="#0866F9" stroke="white" />
              </div>

              <h1
                className="
                  text-[21px] font-bold tracking-tight
                  text-[#121C33] sm:text-[24px]
                "
              >
                Daftar Akun Pengguna
              </h1>
            </div>

            <p className="mt-2 text-[13px] text-[#677B98]">
              Menampilkan {total} akun pengguna dari
              Pokdakan Pondok Lestari, Sawangan - Depok
            </p>
          </div>

          <Link
            href="/users/new"
            className="
              inline-flex h-[46px] shrink-0
              items-center justify-center gap-2
              rounded-lg bg-[#0866F9] px-5
              text-[13px] font-medium text-white
              transition hover:bg-[#0055D9]
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-blue-600
            "
          >
            <Plus size={18} />
            Buat Akun
          </Link>
        </div>
      </section>

      {/* =====================================
          SEARCH / FILTER / SORT
      ===================================== */}
      <section
        className="
          flex flex-col gap-4 rounded-xl
          border border-[#C6D2EA]
          bg-white p-4 shadow-sm
          lg:flex-row lg:items-center lg:justify-between
        "
      >
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">

          {/* SEARCH */}
          <div className="relative w-full sm:w-[210px]">
            <Search
              size={15}
              className="
                pointer-events-none absolute
                left-3 top-1/2 -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari akun..."
              aria-label="Cari akun pengguna"
              className="
                h-9 w-full rounded-lg
                border border-[#C6D2EA]
                bg-[#F8F8FA] pl-9 pr-8
                text-[12px] text-slate-800
                outline-none
                placeholder:text-slate-400
                focus:border-blue-500
                focus:ring-2 focus:ring-blue-100
              "
            />

            {search && (
              <button
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => setSearch("")}
                className="
                  absolute right-2 top-1/2
                  -translate-y-1/2 text-slate-400
                  hover:text-slate-700
                "
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* STATUS FILTER */}
          <div
            role="group"
            aria-label="Filter status akun"
            className="
              flex max-w-full items-center
              gap-1 overflow-x-auto rounded-lg
              border border-[#C6D2EA]
              bg-[#F8F8FA] p-1
            "
          >
            {filterTabs.map((tab) => {
              const selected = filter === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFilter(tab.key)}
                  className={`
                    inline-flex h-8 shrink-0 items-center
                    justify-center gap-2 rounded-md
                    px-3 text-[12px] transition
                    ${
                      selected
                        ? "bg-white font-semibold text-slate-900 shadow-sm"
                        : "text-[#7889A4] hover:bg-white/70"
                    }
                  `}
                >
                  {tab.label}

                  <span
                    className={
                      selected
                        ? "text-slate-800"
                        : "text-[#7889A4]"
                    }
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SORT BUTTON */}
        <div className="relative self-end lg:self-auto">
          <button
            type="button"
            onClick={() => setSortOpen((prev) => !prev)}
            aria-expanded={sortOpen}
            aria-label="Urutkan daftar akun"
            className="
              flex h-11 w-14 items-center
              justify-center rounded-lg
              border border-[#C6D2EA]
              bg-white text-[#0866F9]
              shadow-sm transition
              hover:bg-blue-50
            "
          >
            <ArrowDownUp size={23} strokeWidth={1.8} />
          </button>

          {sortOpen && (
            <>
              <button
                type="button"
                aria-label="Tutup pilihan urutan"
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setSortOpen(false)}
              />

              <div
                className="
                  absolute right-0 top-12 z-40
                  w-[210px] rounded-xl border
                  border-slate-200 bg-white p-2
                  shadow-lg
                "
              >
                <p className="px-3 py-2 text-[11px] font-semibold text-slate-500">
                  URUTKAN BERDASARKAN
                </p>

                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSort(option.value);
                      setSortOpen(false);
                    }}
                    className={`
                      flex w-full items-center
                      justify-between rounded-lg
                      px-3 py-2 text-left text-[12px]
                      transition
                      ${
                        sort === option.value
                          ? "bg-blue-50 font-semibold text-blue-600"
                          : "text-slate-600 hover:bg-slate-50"
                      }
                    `}
                  >
                    {option.label}

                    {sort === option.value && (
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* =====================================
          USERS TABLE
      ===================================== */}
      <section
        className="
          overflow-hidden rounded-xl
          border border-[#E0E8F6]
          bg-white shadow-sm
        "
      >
        <div className="w-full overflow-x-auto">
          <table
            className="
              w-full min-w-[900px]
              border-collapse text-left
            "
          >
            <thead>
              <tr className="bg-[#EDF3FC]">
                <th className="w-[23%] px-4 py-5 text-[12px] font-semibold text-[#50545D]">
                  Nama Lengkap
                </th>
                <th className="w-[17%] border-l border-[#DCE6F4] px-4 py-5 text-[12px] font-semibold text-[#50545D]">
                  Nomor Telepon
                </th>
                <th className="w-[22%] border-l border-[#DCE6F4] px-4 py-5 text-[12px] font-semibold text-[#50545D]">
                  Email
                </th>
                <th className="w-[17%] border-l border-[#DCE6F4] px-4 py-5 text-center text-[12px] font-semibold text-[#50545D]">
                  Peran
                </th>
                {/* <th className="w-[11%] border-l border-[#DCE6F4] px-4 py-5 text-center text-[12px] font-semibold text-[#50545D]">
                  Status
                </th> */}
                <th className="w-[10%] border-l border-[#DCE6F4] px-4 py-5 text-center text-[12px] font-semibold text-[#50545D]">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E0E8F6]">
              {paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="
                    h-[90px] transition-colors
                    hover:bg-[#F9FBFF]
                  "
                >
                  {/* NAME */}
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex h-10 w-10 shrink-0
                          items-center justify-center
                          rounded-full bg-[#EEF4FF]
                          text-[13px] font-semibold
                          text-[#0866F9]
                        "
                      >
                        {getInitials(user.name)}
                      </div>

                      <span className="text-[13px] font-semibold text-[#242424]">
                        {user.name}
                      </span>
                    </div>
                  </td>

                  {/* PHONE */}
                  <td className="border-l border-[#E0E8F6] px-4 py-5 text-[12px] text-[#383838]">
                    {user.phone || "—"}
                  </td>

                  {/* EMAIL */}
                  <td className="border-l border-[#E0E8F6] px-4 py-5 text-[12px] text-[#383838]">
                    <span className="break-all">
                      {user.email ?? user.loginId}
                    </span>
                  </td>

                  {/* ROLE */}
                  <td className="border-l border-[#E0E8F6] px-3 py-5 text-center">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* STATUS */}
                  {/* <td className="border-l border-[#E0E8F6] px-3 py-5 text-center">
                    <StatusBadge active={user.isActive} />
                  </td> */}

                  {/* ACTION */}
                  <td className="border-l border-[#E0E8F6] px-3 py-5 text-center">
                    {user.role === "ADMIN" ? (
                      <span className="text-xs text-slate-400">
                        —
                      </span>
                    ) : (
                      <Link
                        href={`/users/${user.id}/edit`}
                        className="
                          inline-flex items-center
                          justify-center gap-2
                          whitespace-nowrap
                          text-[13px] font-semibold
                          text-[#0866F9]
                          transition hover:text-[#0053CB]
                        "
                        title={`Lihat akun ${user.name}`}
                      >
                        Lihat Detail
                        <ArrowRight size={18} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}

              {paginatedUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <UsersRound
                        size={35}
                        className="text-slate-300"
                      />

                      <p className="text-sm font-semibold text-slate-600">
                        Tidak ada akun ditemukan
                      </p>

                      <p className="text-xs text-slate-400">
                        Coba ubah kata kunci atau filter status.
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setFilter("ALL");
                        }}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================
            PAGINATION FOOTER
        ===================================== */}
        <div
          className="
            flex flex-col justify-between gap-4
            border-t border-[#E0E8F6]
            px-5 py-4
            sm:flex-row sm:items-center
          "
        >
          <p className="text-[11px] text-[#858585]">
            {filteredTotal === 0
              ? "Tidak ada akun yang sesuai"
              : `Menampilkan ${startIndex + 1} sampai ${endIndex} dari ${filteredTotal} akun pengguna`}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() =>
                setPage((prev) => Math.max(1, prev - 1))
              }
              className="
                inline-flex h-9 items-center gap-1
                rounded-lg border border-[#E2E9F7]
                px-3 text-[11px] font-medium
                text-slate-700 transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              <ChevronLeft size={14} />
              Sebelumnya
            </button>

            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            ).map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => setPage(number)}
                aria-label={`Halaman ${number}`}
                aria-current={
                  currentPage === number ? "page" : undefined
                }
                className={`
                  flex h-9 min-w-9 items-center
                  justify-center rounded-lg px-2
                  text-[12px] font-medium
                  transition
                  ${
                    currentPage === number
                      ? "bg-[#0866F9] text-white"
                      : "border border-[#E2E9F7] bg-white text-slate-800 hover:bg-slate-50"
                  }
                `}
              >
                {number}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage((prev) =>
                  Math.min(totalPages, prev + 1)
                )
              }
              className="
                inline-flex h-9 items-center gap-1
                rounded-lg border border-[#E2E9F7]
                px-3 text-[11px] font-medium
                text-slate-700 transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Selanjutnya
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
