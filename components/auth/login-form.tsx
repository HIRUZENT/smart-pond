
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export function LoginForm() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          loginId: loginId.trim(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Login gagal.");
        return;
      }

      // Tujuan halaman ditentukan oleh server
      // sesuai role pengguna yang berhasil login.
      router.replace(
        typeof result.redirectTo === "string" &&
          result.redirectTo.startsWith("/") &&
          !result.redirectTo.startsWith("//")
          ? result.redirectTo
          : "/dashboard"
      );

      router.refresh();
    } catch {
      setError(
        "Tidak dapat terhubung ke server. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* USERNAME / EMAIL */}
      <div className="mb-[32px]">
        <label
          htmlFor="loginId"
          className="mb-[9px] block text-[16px] font-medium text-[#202124]"
        >
          Username atau Email{" "}
          <span className="text-red-500">*</span>
        </label>

        <input
          id="loginId"
          name="loginId"
          type="text"
          autoComplete="username"
          required
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="Masukkan username atau email"
          className="
            h-[48px] w-full rounded-[8px]
            border border-[#E0E0E0]
            bg-white px-[15px]
            text-[14px] text-[#202124]
            outline-none transition-all
            placeholder:text-[#A5A5A5]
            focus:border-[#0866FF]
            focus:ring-[3px] focus:ring-blue-100
          "
        />
      </div>

      {/* PASSWORD */}
      <div>
        <label
          htmlFor="password"
          className="mb-[9px] block text-[16px] font-medium text-[#202124]"
        >
          Password <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password"
            className="
              h-[48px] w-full rounded-[8px]
              border border-[#E0E0E0]
              bg-white py-3 pl-[15px] pr-12
              text-[14px] text-[#202124]
              outline-none transition-all
              placeholder:text-[#A5A5A5]
              focus:border-[#0866FF]
              focus:ring-[3px] focus:ring-blue-100
            "
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={
              showPassword
                ? "Sembunyikan password"
                : "Tampilkan password"
            }
            className="
              absolute inset-y-0 right-[15px]
              flex items-center justify-center
              text-[#292929]
              hover:text-[#0866FF]
            "
          >
            {showPassword ? (
              <EyeOff size={19} />
            ) : (
              <Eye size={19} />
            )}
          </button>
        </div>
      </div>

      {/* FORGOT PASSWORD */}
      <div className="mt-[24px] mb-[16px] flex justify-end">
        <span
          className="text-[16px] font-semibold text-[#0866FF]"
        >
          Lupa Password?
        </span>
      </div>

      {/* ERROR */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      {/* LOGIN BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="
          flex h-[48px] w-full
          items-center justify-center gap-2
          rounded-[8px] bg-[#0866F9]
          text-[14px] font-medium text-white
          transition-all
          hover:bg-[#0055DC]
          active:scale-[0.99]
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {loading ? (
          "Sedang masuk..."
        ) : (
          <>
            Masuk
            <ArrowRight size={17} strokeWidth={1.8} />
          </>
        )}
      </button>

      {/* DIVIDER */}
      <div className="my-[23px] flex items-center gap-[16px]">
        <div className="h-px flex-1 bg-[#DDDDDD]" />
        <span className="text-[12px] text-[#555555]">
          ATAU
        </span>
        <div className="h-px flex-1 bg-[#DDDDDD]" />
      </div>

      {/* GOOGLE LOGIN VISUAL */}
      <button
        type="button"
        disabled
        title="Login Google belum tersedia"
        className="
          flex h-[49px] w-full
          items-center justify-center gap-3
          rounded-[8px]
          border border-[#E0E3E8]
          bg-white text-[14px]
          font-medium text-[#202124]
          opacity-70
        "
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.27 5.48-4.8 7.18l7.73 6C44.38 38.03 46.98 31.87 46.98 24.55z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>

        Masuk Menggunakan Google
      </button>
    </form>
  );
}
