
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$queryRaw<
      { db_name: string | null }[]
    >`SELECT DATABASE() AS db_name`;

    const users = await prisma.user.count();
    const ponds = await prisma.pond.count();
    const readings = await prisma.waterReading.count();

    return NextResponse.json({
      success: true,
      message: "Koneksi MariaDB berhasil!",
      database: result[0]?.db_name,
      tables: {
        users,
        ponds,
        water_readings: readings,
      },
    });
  } catch (error) {
    console.error("Database test error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Pengujian database gagal. Periksa terminal.",
      },
      { status: 500 }
    );
  }
}
