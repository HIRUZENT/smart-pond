
import Image from "next/image";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center bg-white">
      <div
        role="status"
        aria-label="Memuat SMART-POND"
        className="relative flex h-44 w-44 items-center justify-center"
      >
        <div className="absolute inset-0 animate-spin rounded-full border-[4px] border-blue-100 border-t-[#0866E8] border-r-[#0866E8]" />

        <div className="absolute inset-[10px] rounded-full border border-blue-50" />

        <div className="relative z-10 flex items-center justify-center">
          <Image
            src="/logo_smartpond_nobg.png"
            alt="SMART-POND"
            width={125}
            height={60}
            priority
            className="h-auto w-[100px] object-contain"
          />
        </div>

        <span className="sr-only">
          Memuat halaman SMART-POND...
        </span>
      </div>
    </div>
  );
}
