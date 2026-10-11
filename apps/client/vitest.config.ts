import { defineConfig } from "vitest/config";

// Unit tests of plain TypeScript modules (no DOM, no React rendering)
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
