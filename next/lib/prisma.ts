import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  readOnlyPrisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [],
  });

// Read Replica (읽기 전용)를 위한 싱글톤 Prisma 인스턴스
export const readOnlyPrisma =
  globalForPrisma.readOnlyPrisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_READONLY_URL,
    log: [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.readOnlyPrisma = readOnlyPrisma;
}
