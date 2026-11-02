import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations need Neon's direct connection; the app uses the pooled DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL_UNPOOLED },
});
