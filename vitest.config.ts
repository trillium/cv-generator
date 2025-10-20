import { defineConfig } from "vitest/config";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    globals: true,
    css: true,
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
  resolve: {
    alias: {
      "@/lib": resolve(__dirname, "./lib"),
      "@/types": resolve(__dirname, "./src/types"),
      "@": resolve(__dirname, "./src"),
      "~": resolve(__dirname, "./"),
    },
  },
});
