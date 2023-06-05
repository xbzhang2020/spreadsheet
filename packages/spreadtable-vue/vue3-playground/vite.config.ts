import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "../dist/v3",
    emptyOutDir: false,
    lib: {
      entry: "./src/main.ts",
      name: "Spreadsheet",
      fileName: "index",
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue",
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["vue-demi"],
  },
});
