import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Neon's own driver for a Neon database, and a plain Postgres connection for any other, such as the
// database that automated tests run against.
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  const adapter = connectionString?.includes(".neon.tech") ? new PrismaNeon({ connectionString }) : new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

// Reuse one client across hot reloads so dev doesn't exhaust connections.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
