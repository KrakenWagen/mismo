import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { moduleFor, type Platform, PLATFORMS, platformOf, type RouteInput, type SharedRoute, type Target } from "@mismo/core/adapter";

/** A route in React Router's config (`RouteConfigEntry`, from `@react-router/dev/routes`). */
interface RouteConfigEntry {
  id?: string;
  path?: string;
  index?: boolean;
  file: string;
  children?: RouteConfigEntry[];
}

const require = createRequire(import.meta.url);
const SCRIPT = /\.(tsx|ts|jsx|js)$/;

/**
 * Routes written as React Router's config: a `routes.ts` whose default export is a route list,
 * made with `route()`, `index()`, and `layout()` from `@react-router/dev/routes`, or written out.
 * Files are relative to that file's folder, as they are to the app folder in React Router. The
 * config is already mismo's model, so reading it is a mapping.
 *
 * Platform files are this library's rule, the same as for every input: beside `about.tsx`, an
 * `about.web.tsx` or `about.native.tsx` replaces it on that platform, and a route whose file is
 * only `about.native.tsx` is on native alone. A layout a platform does not have hands its routes to
 * its parent there.
 */
export function input(): RouteInput {
  return {
    name: "react-router",
    param: (name) => `:${name}`,
    read(source, target) {
      const loaded = require(source) as { default?: RouteConfigEntry[] };
      if (!Array.isArray(loaded.default)) throw new Error(`${source} should export its routes as its default.`);

      return toModel(loaded.default, path.dirname(source), target, source);
    },
  };
}

function toModel(entries: readonly RouteConfigEntry[], dir: string, target: Target, source: string): SharedRoute[] {
  return entries.flatMap((entry): SharedRoute[] => {
    for (const segment of (entry.path ?? "").split("/")) {
      if (segment === "*" || segment.endsWith("?")) {
        throw new Error(`${source}: "${entry.path}" (${entry.file}): splats and optional segments are not supported yet.`);
      }
    }

    const stem = platformOf(path.resolve(dir, entry.file).replace(SCRIPT, "")).base;
    const module = moduleFor(stem, platformsOf(stem), target);
    const id = path.relative(dir, stem).split(path.sep).join("/");
    const segments = entry.path ? entry.path.split("/") : [];
    const children = entry.children ? toModel(entry.children, dir, target, source) : undefined;

    // Not on this platform: a page is left out, a layout hands its routes to its parent.
    if (!module) {
      return (children ?? []).map((child) => ({
        ...child,
        segments: [...segments, ...child.segments],
        ...(child.path || segments.length ? { path: [...segments, child.path].filter(Boolean).join("/") } : {}),
      }));
    }

    if (children) {
      // A pathless layout is a group to a router that reads folders: named after its file.
      const group = segments.length ? segments : [`(${path.basename(stem)})`];
      return [{ id, file: module, layout: true, segments: group, ...(entry.path ? { path: entry.path } : {}), children }];
    }

    if (entry.index) return [{ id, file: module, index: true, segments: ["index"] }];
    return [{ id, file: module, segments, ...(entry.path ? { path: entry.path } : {}) }];
  });
}

/** The platforms a route has a file for, beside its plain one. */
function platformsOf(stem: string): Set<Platform | ""> {
  const has = (name: string) => [".tsx", ".ts", ".jsx", ".js"].some((ext) => existsSync(name + ext));
  const found = new Set<Platform | "">(has(stem) ? [""] : []);
  for (const platform of PLATFORMS) if (has(`${stem}.${platform}`)) found.add(platform);
  return found;
}
