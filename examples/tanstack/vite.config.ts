import { mismo } from "@mismo/core/vite";
import { tanstack } from "@mismo/tanstack";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    // Before Start's plugin, which reads the routes folder and so the routes mismo writes.
    mismo({
      config: "../shared/routes.config.ts",
      output: tanstack.output({ outDir: "src/routes", types: "src/routes.gen.ts" }),
    }),
    // Start refuses `*.server.*` files in the browser's bundle. A loader runs in the browser too, so
    // the shared routes' server files are let in: their `createServerFn`s are still compiled away.
    tanstackStart({ importProtection: { client: { excludeFiles: ["**/shared/routes/**/*.server.*"] } } }),
    // React's plugin has to come after Start's.
    viteReact(),
  ],
});
