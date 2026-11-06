import { createRequire } from "node:module";
import path from "node:path";

import { watchAppRoutes } from "@mismo/core/generate";

import { output } from "./output.ts";

type Resolve = (context: { resolveRequest: Resolve }, moduleName: string, platform: string | null) => unknown;

/** The part of Metro's config this changes. */
interface MetroConfig {
  resolver?: { resolveRequest?: Resolve | null | undefined } & Record<string, unknown>;
}

export interface WithMismoOptions {
  /** The shared `routes.config.ts`, relative to `cwd`. */
  config: string;
  /** Expo Router's folder, relative to `cwd`: `src/app`. */
  outDir: string;
  /** The app's types file, relative to `cwd`. */
  types: string;
  /** The app's folder: `__dirname` in `metro.config.js`. */
  cwd: string;
}

/**
 * Metro's config for an Expo app on mismo: writes the app's routes into Expo Router's folder now
 * (Metro loads its config for `expo start` and `expo export` alike, before Expo Router looks), and
 * again as route files come and go; and points `@mismo/core` at Expo Router's runtime. The watcher is
 * unref'd, so a one-off export still exits.
 *
 *     module.exports = withMismo(getDefaultConfig(__dirname), { config: "../../packages/app/routes.config.ts", outDir: "src/app", types: "src/routes.gen.ts", cwd: __dirname });
 */
export function withMismo<T extends MetroConfig>(metro: T, { config, outDir, types, cwd }: WithMismoOptions): T {
  watchAppRoutes({ config, output: output({ outDir, types }), cwd });

  // From the app, which depends on this adapter: the shared package importing `@mismo/core` may not.
  const runtime = createRequire(path.join(cwd, "package.json")).resolve("@mismo/expo/runtime");
  const previous = metro.resolver?.resolveRequest;

  return {
    ...metro,
    resolver: {
      ...metro.resolver,
      resolveRequest: ((context, moduleName, platform) =>
        moduleName === "@mismo/core"
          ? { type: "sourceFile", filePath: runtime }
          : (previous ?? context.resolveRequest)(context, moduleName, platform)) satisfies Resolve,
    },
  };
}
