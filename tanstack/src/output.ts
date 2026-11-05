import path from "node:path";

import {
  exportsName,
  type Files,
  GENERATED,
  importPath,
  isParam,
  oneUrlPerPage,
  placesOf,
  type RouteOutput,
  type RouteRules,
} from "@mismo/core/adapter";

/** What TanStack Router cannot express, from its file conventions. */
export const rules: RouteRules = {
  router: "TanStack Start",
  target: "web",
  check(routes) {
    // Its generator refuses two files at one URL, such as `(a)/about` and `(b)/about`.
    const problems = oneUrlPerPage(routes, "TanStack Start");

    // It reads `.` as a path separator and `$` as a param, without an error.
    for (const { route } of placesOf(routes)) {
      for (const segment of route.segments) {
        if (!isParam(segment) && /[.$]/.test(segment)) {
          problems.push(`${route.id}: "${segment}" has "." or "$", which TanStack Start reads as a path separator or a param.`);
        }
      }
    }

    return problems;
  },
};

/**
 * TanStack Router's files, for a web app on TanStack Start. The same folders: a group keeps its
 * name, and its layout is `(group)/route.tsx`, which TanStack treats as a layout that adds nothing
 * to the URL. Only `:id` becomes `$id`. Each file wraps its module in `createFileRoute`, with the
 * module's `tanstack` export as options when it has one; TanStack's generator then builds its
 * route tree from them. A route module cannot export TanStack's `Route` itself: native would
 * import TanStack.
 */
export function output({ outDir, types }: { outDir: string; types: string }): RouteOutput {
  return {
    name: "tanstack",
    target: "web",
    outDir,
    types,
    rules,
    runtime: "@mismo/tanstack/runtime",
    emit(routes, context) {
      const files: Files = new Map();

      for (const { route, folder } of placesOf(routes)) {
        const segments = [...folder, ...route.segments].map(toTanstack);
        let parts: string[];
        let id: string;

        if (route.layout) {
          parts = [...segments, "route.tsx"];
          id = `/${segments.join("/")}`;
        } else {
          const dirs = segments.slice(0, -1);
          const leaf = segments.at(-1)!;
          parts = [...dirs, `${leaf}.tsx`];
          id = leaf === "index" ? `/${dirs.map((d) => `${d}/`).join("")}` : `/${segments.join("/")}`;
        }

        const from = importPath(path.join(context.outDir, ...parts), route.file);
        const options = exportsName(route.file, "tanstack");

        files.set(
          parts.join("/"),
          `${GENERATED}import { createFileRoute } from "@tanstack/react-router";

import Component${options ? ", { tanstack }" : ""} from "${from}";

export const Route = createFileRoute("${id}")({ ${options ? "...tanstack, " : ""}component: Component });
`,
        );
      }

      return files;
    },
  };
}

/** A segment as TanStack Router spells it: `:id` is `$id`. */
const toTanstack = (segment: string) => (isParam(segment) ? `$${segment.slice(1)}` : segment);
