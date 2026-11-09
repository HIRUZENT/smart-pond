import "dotenv/config";
import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const name = process.env.ADMIN_NAME?.trim() || "Admin SMART-POND";
  const loginId = process.env.ADMIN_LOGIN?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!loginId || !password || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Isi ADMIN_LOGIN dan ADMIN_PASSWORD (12-72 byte) di .env terlebih dahulu");
  }

  const existing = await prisma.user.findUnique({ where: { loginId } });
  if (existing) {
    console.log(`Akun ${loginId} sudah ada; password tidak ditimpa.`);
    return;
  }
  await prisma.user.create({
    data: { name, loginId, passwordHash: await hash(password, 12), role: "ADMIN", isActive: true },
  });
  console.log(`Admin pertama berhasil dibuat: ${loginId}`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
