import { createRequire } from "node:module";
import path from "node:path";

import type { Plugin } from "vite";

import type { RouteOutput } from "../config/interfaces.ts";
import { type AppRoutesOptions, generateAppRoutes, watchAppRoutes } from "../generate/index.ts";

/**
 * Writes this app's routes with its output, from the shared config, and points `@mismo/core` at the
 * output's runtime, so shared screens' `Link` and `useNav` run on this app's router. List it before
 * the router's own plugin (TanStack Start's reads the routes folder). It generates when the config
 * loads, so the files exist before any other plugin starts, and in dev again as route files come
 * and go.
 *
 *     mismo({ config: "../../packages/app/routes.config.ts", output: tanstack.output({ outDir: "src/routes", types: "src/routes.gen.ts" }) })
 */
export function mismo(options: { config: string; output: RouteOutput }): Plugin {
  let stop: (() => void) | undefined;
  const cwd = process.cwd();
  const app: AppRoutesOptions = { ...options, cwd };
  // From the app, which depends on the adapter: the shared package importing `@mismo/core` may not.
  const runtime = createRequire(path.join(cwd, "package.json")).resolve(options.output.runtime);

  return {
    name: "mismo",
    config(_, env) {
      if (env.command === "serve" && !env.isPreview) stop = watchAppRoutes(app);
      else generateAppRoutes(app);

      return { resolve: { alias: [{ find: /^@mismo\/core$/, replacement: runtime }] } };
    },
    closeBundle() {
      stop?.();
    },
  };
}
