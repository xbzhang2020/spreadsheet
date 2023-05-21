import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), dts()],
  build: {
    outDir: "lib",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "Spreadsheet",
      fileName: "spreadsheet",
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        dir: "lib",
        globals: {
          vue: "Vue",
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve("src"),
    },
  },
});
