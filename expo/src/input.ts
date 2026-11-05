import path from "node:path";

import { moduleFor, pathOf, type RouteInput, routeFiles, type SharedRoute } from "@mismo/core/adapter";

import { type ExpoRouteNode, isSystemNode, parseExpoRoutes } from "./parse.ts";

/**
 * Routes written as an Expo Router folder: `_layout`, `index`, `name`, `[param]`, `(group)`, read
 * by Expo Router's own parser. Platform files (`name.web.tsx`, `name.native.tsx`) are this
 * library's rule: a route may have one for a platform alone, which Expo would refuse without a
 * plain file beside it. No root `_layout`: the root belongs to each app, next to its own routes.
 */
export function input(): RouteInput {
  return {
    name: "expo",
    param: (name) => `[${name}]`,
    read(source, target) {
      const files = routeFiles(source);

      if (files.has("_layout")) {
        throw new Error(`${source}/_layout: the root layout belongs to each app. Export what it shares as a component.`);
      }
      for (const route of files.keys()) checkNames(source, route);

      // One file name per route on this target, as Expo would see it, and the module behind it.
      const modules = new Map<string, { id: string; module: string }>();
      for (const [route, platforms] of files) {
        const module = moduleFor(path.join(source, route), platforms, target);
        if (module) modules.set(`./${route}.tsx`, { id: route, module });
      }

      const root = parseExpoRoutes([...modules.keys()].sort());
      if (!root) return [];

      const toModel = (node: ExpoRouteNode): SharedRoute => {
        const found = modules.get(node.contextKey);
        if (!found) throw new Error(`Expo Router returned ${node.contextKey}, which is not a route of ${source}.`);

        const segments = node.route.split("/").filter(Boolean).map(fromExpo);
        const url = pathOf(segments);
        const layout = node.type === "layout";

        return {
          id: found.id,
          file: found.module,
          segments,
          ...(url ? { path: url } : !layout ? { index: true } : {}),
          ...(layout ? { layout: true, children: node.children.map(toModel) } : {}),
        };
      };

      // No root layout in the folder, so the root is Expo's own: its children are the routes.
      return isSystemNode(root) ? root.children.filter((node) => !isSystemNode(node)).map(toModel) : [toModel(root)];
    },
  };
}

/** A segment in the model's spelling: `[id]` is `:id`; the rest are the same. */
function fromExpo(segment: string): string {
  return segment.startsWith("[") && segment.endsWith("]") ? `:${segment.slice(1, -1)}` : segment;
}

/** What this stage supports of Expo's convention. What an output cannot spell is that output's rules. */
function checkNames(source: string, route: string) {
  for (const name of route.split("/")) {
    const file = path.join(source, route);
    if (name.startsWith("[...")) throw new Error(`${file}: catch-all routes are not supported yet.`);
    if (name.startsWith("+")) throw new Error(`${file}: ${name} routes are not supported yet.`);
  }
}

