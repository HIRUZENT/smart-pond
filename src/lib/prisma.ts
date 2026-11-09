import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL belum diatur");
  const url = new URL(rawUrl);
  if (url.protocol !== "mysql:") throw new Error("DATABASE_URL harus menggunakan skema mysql://");

  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
