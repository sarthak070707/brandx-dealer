import { configDefaults, defineConfig } from "vitest/config";

// The everyday tests: pure logic, fast, and no database. Tests that need a real database end in
// .db.test.ts and run with `npm run test:db`.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { include: ["lib/**/*.test.ts"], exclude: [...configDefaults.exclude, "lib/**/*.db.test.ts"] },
});
