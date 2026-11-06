import path from "node:path";

import { type Files, GENERATED, importPath, isParam, placesOf, type RouteOutput, type RouteRules } from "@mismo/core/adapter";

/** Expo Router expresses everything the Expo input reads: its own convention. */
export const rules: RouteRules = { router: "Expo Router", target: "native", check: () => [] };

/**
 * Expo Router's files, for a native app: the routes folder's layout, each file re-exporting its
 * module. `outDir` is Expo Router's folder (`src/app`), next to the app's own routes.
 */
export function output({ outDir, types }: { outDir: string; types: string }): RouteOutput {
  return {
    name: "expo",
    target: "native",
    outDir,
    types,
    rules,
    runtime: "@mismo/expo/runtime",
    emit(routes, context) {
      const files: Files = new Map();

      for (const { route, folder } of placesOf(routes)) {
        const segments = [...folder, ...route.segments].map(toExpo);
        const parts = route.layout ? [...segments, "_layout.tsx"] : [...segments.slice(0, -1), `${segments.at(-1)}.tsx`];
        const from = importPath(path.join(context.outDir, ...parts), route.file);

        files.set(parts.join("/"), `${GENERATED}export * from "${from}";\nexport { default } from "${from}";\n`);
      }

      return files;
    },
  };
}

/** A segment as Expo Router spells it: `:id` is `[id]`. */
const toExpo = (segment: string) => (isParam(segment) ? `[${segment.slice(1)}]` : segment);
