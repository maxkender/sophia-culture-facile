import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests must not apply the Start RPC transform: handlers use mocked dependencies.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { environment: "node" },
});