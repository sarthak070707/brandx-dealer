import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Tests against a real database, using DATABASE_URL from .env. One file at a time, because they share it.
export default defineConfig(({ mode }) => ({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["lib/**/*.db.test.ts"],
    env: loadEnv(mode, process.cwd(), ""),
    fileParallelism: false,
    testTimeout: 30_000,
  },
}));
