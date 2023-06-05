import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

// function processSass() {
//   return {
//     name: "process-sass",
//     generateBundle(options, bundle) {
//       const keys = Object.keys(bundle);

//       for (const key of keys) {
//         const bundler = bundle[key];
//         this.emitFile({
//           type: "asset",
//           fileName: key, //文件名名不变
//           source: bundler.code.replace(/\.scss/g, ".css"),
//         });
//       }
//     },
//   };
// }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      copyDtsFiles: true,
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: "lib",
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
    },
  },
  optimizeDeps: {
    exclude: ["vue-demi"],
  },
});
