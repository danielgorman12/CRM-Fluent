import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The geographic and trip engines are pure functions over plain data, so the
// whole suite runs in a node environment with no DOM, no database, and no
// network. That is what makes it viable to run inside the Vercel build.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
