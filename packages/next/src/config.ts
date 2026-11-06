import { createRequire } from "node:module";
import path from "node:path";

import { watchAppRoutes } from "@mismo/core/generate";

import { output } from "./output.ts";

/** The part of Next.js's config this changes, read from any config object. */
interface NextConfigPart {
  turbopack?: { resolveAlias?: Record<string, unknown> } | undefined;
  webpack?: ((config: WebpackConfig, context: unknown) => WebpackConfig) | null | undefined;
}

interface WebpackConfig {
  resolve?: { alias?: Record<string, unknown> };
}

export interface WithMismoOptions {
  /** The shared `routes.config.ts`, relative to the app. */
  config: string;
  /** The App Router's folder, relative to the app: `app`, or `src/app`. */
  outDir: string;
  /** The app's types file, relative to the app. */
  types: string;
  /** The app's folder. Next.js loads its config there, so it is `process.cwd()` by default. */
  cwd?: string;
}

/**
 * Next.js's config for an app on mismo: writes the app's routes into the App Router's folder when
 * Next.js loads its config (before it reads the folder, for `next dev` and `next build` alike), and
 * again in dev as route files come and go; and points `@mismo/core` at Next.js's runtime, for Turbopack
 * and for webpack.
 *
 *     export default withMismo({ … }, { config: "../shared/routes.config.ts", outDir: "app", types: "app/routes.gen.ts" });
 */
export function withMismo<T extends object>(nextConfig: T, { config, outDir, types, cwd = process.cwd() }: WithMismoOptions): T {
  const next = nextConfig as T & NextConfigPart;
  watchAppRoutes({ config, output: output({ outDir, types }), cwd });

  // From the app, which depends on this adapter: the shared package importing `@mismo/core` may not.
  const runtime = createRequire(path.join(cwd, "package.json")).resolve("@mismo/next/runtime");
  // Turbopack takes a path relative to the app, webpack an absolute one.
  const relative = `./${path.relative(cwd, runtime).split(path.sep).join("/")}`;
  const previous = next.webpack;

  const changed: NextConfigPart = {
    turbopack: {
      ...next.turbopack,
      resolveAlias: { ...next.turbopack?.resolveAlias, "@mismo/core": relative },
    },
    webpack: (webpackConfig: WebpackConfig, context: unknown) => {
      const config = previous ? previous(webpackConfig, context) : webpackConfig;
      config.resolve = { ...config.resolve, alias: { ...config.resolve?.alias, "@mismo/core$": runtime } };
      return config;
    },
  };

  return { ...next, ...changed };
}
