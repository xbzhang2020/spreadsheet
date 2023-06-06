import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({
      copyDtsFiles: true,
      rollupTypes: true,
      insertTypesEntry: false,
      aliasesExclude: ["vue-demi"],
      // copyDtsFiles: true,
      outputDir: ["lib/v3"],
      // include: ['src/index.ts'],
      // exclude: ["src/ignore"],
      // aliasesExclude: [/^@components/],
      staticImport: true,
      skipDiagnostics: false,
      // rollupTypes: true,
      // insertTypesEntry: true,
    }),
    vue(),
  ],
  build: {
    outDir: "./lib/v3",
    lib: {
      entry: "./index.ts",
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
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
      vue: resolve(__dirname, "./node_modules/vue3/dist/vue.runtime.esm-browser.js"),
      "vue-demi": resolve(__dirname, "./node_modules/vue-demi/lib/v3/index.mjs"),
    },
  },
  optimizeDeps: {
    exclude: ["vue-demi", "vue", "vue2"],
  },
});
