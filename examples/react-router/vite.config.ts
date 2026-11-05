import { reactRouter } from "@react-router/dev/vite";
import { reactRouter as mismoReactRouter } from "@mismo/react-router";
import { mismo } from "@mismo/core/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // Before React Router's plugin, which reads app/routes.ts and so the routes mismo writes.
    mismo({
      config: "../shared/routes.config.ts",
      output: mismoReactRouter.output({ outDir: "app/mismo", types: "app/routes.gen.ts" }),
    }),
    reactRouter(),
  ],
  // The shared screens are TypeScript source in another package: bundle them, and `@mismo/core` with them.
  ssr: { noExternal: ["@mismo/example-shared", "@mismo/core", "@mismo/react-router"] },
});
