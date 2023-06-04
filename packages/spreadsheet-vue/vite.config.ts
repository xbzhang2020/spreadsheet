import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
// import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "lib",
    lib: {
      entry: "./index.ts",
    },
    rollupOptions: {
      external: ["vue"],
      input: ["index.ts"],
      output: [
        {
          format: "es",
          dir: "es",
          entryFileNames: "[name].js",
        },
        {
          format: "umd",
          dir: "lib",
          name: "SpreadSheet",
          entryFileNames: "[name].umd.cjs",
          globals: {
            vue: "Vue",
          },
        },
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
