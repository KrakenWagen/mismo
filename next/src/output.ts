import path from "node:path";

import {
  exportedOptions,
  type Files,
  isPlainValue,
  GENERATED,
  importPath,
  isGroup,
  isParam,
  oneUrlPerPage,
  placesOf,
  type RouteOutput,
  type RouteRules,
  type SharedRoute,
  serverModule,
} from "@mismo/core/adapter";

/** What Next.js's App Router cannot express, from its folder conventions. */
export const rules: RouteRules = {
  router: "Next.js",
  target: "web",
  check(routes) {
    // It refuses two pages that resolve to one URL, such as `(a)/about` and `(b)/about`.
    const problems = oneUrlPerPage(routes, "Next.js");

    // Folder names it reads as something other than a route, without an error.
    for (const { route } of placesOf(routes)) {
      for (const segment of route.segments) {
        if (isParam(segment)) continue;
        if (segment.startsWith("_")) problems.push(`${route.id}: "${segment}" starts with "_", a private folder to Next.js, left out of its routes.`);
        if (segment.startsWith("@")) problems.push(`${route.id}: "${segment}" starts with "@", a parallel route's slot to Next.js.`);
        if (isGroup(segment) && segment.startsWith("(.")) problems.push(`${route.id}: "${segment}" is an intercepting route to Next.js.`);
      }
    }

    return problems;
  },
};

/**
 * Next.js's files, for a web app on the App Router: the routes folder's layout in `app/`, a
 * `page.tsx` per page and a `layout.tsx` per layout, next to the app's own (its root `layout.tsx`
 * among them).
 *
 * Each is a server component that renders a client one beside it: `page.tsx` renders
 * `mismo-page.tsx`, `layout.tsx` renders `mismo-layout.tsx`. The shared screens use hooks, so they
 * render on the client side of that line; the server file carries the route's Next.js options
 * (metadata, `generateStaticParams`, its rendering and caching config), which Next.js reads only
 * from server files. They come from the route's server file, `orgs/[id].server.ts`, as
 * `export const next = { … }` (see `NextServerOptions`).
 *
 * A page renders in a Suspense boundary, which Next.js needs around `useSearchParams` to prerender
 * it; a layout hands the page Next.js gives it (`children`) to `Slot`.
 */
export function output({ outDir, types }: { outDir: string; types: string }): RouteOutput {
  return {
    name: "next",
    target: "web",
    outDir,
    types,
    rules,
    runtime: "@mismo/next/runtime",
    emit(routes, context) {
      const files: Files = new Map();

      for (const { route, folder } of placesOf(routes)) {
        const segments = [...folder, ...route.segments].map(toNext);
        const dirs = route.layout || segments.at(-1) !== "index" ? segments : segments.slice(0, -1);
        const kind = route.layout ? "layout" : "page";
        const server = [...dirs, `${kind}.tsx`].join("/");
        const client = [...dirs, `mismo-${kind}.tsx`].join("/");

        const from = importPath(path.join(context.outDir, client), route.file);
        files.set(client, route.layout ? clientLayout(from) : clientPage(from));
        files.set(server, serverFile(route, kind, path.join(context.outDir, server)));
      }

      return files;
    },
  };
}

/** A segment as Next.js spells it: `:id` is `[id]`. */
const toNext = (segment: string) => (isParam(segment) ? `[${segment.slice(1)}]` : segment);

/** Options Next.js reads as values at run time: passed on as the export of their name. */
const VALUE_EXPORTS = new Set(["metadata", "generateMetadata", "viewport", "generateViewport", "generateStaticParams"]);

/**
 * Route segment config: Next.js reads these from the file's source without running it, so each
 * must be a literal, and is written into the generated file as one.
 */
const CONFIG_EXPORTS = new Set(["dynamic", "dynamicParams", "revalidate", "fetchCache", "runtime", "preferredRegion", "maxDuration"]);
const LITERAL = /^(?:-?\d+(?:\.\d+)?|true|false|"[^"\\]*"|'[^'\\]*'|\[\s*(?:(?:"[^"]*"|'[^']*')\s*,?\s*)*\])$/;

/**
 * The server component: the route's Next.js options, and the client component it renders.
 *
 * Options come from two places. The route's module may set plain values (`metadata: { title }`,
 * `revalidate: 60`): it's a client module Next.js can't read from the server, so they're copied in
 * as text. Its server file may set anything, functions included (`generateMetadata`), and is
 * imported. An option set in both is an error, so each has one source.
 */
function serverFile(route: SharedRoute, kind: "page" | "layout", at: string): string {
  const imports: string[] = [];
  const exports: string[] = [];
  const server = serverModule(route.file);
  const fromModule = exportedOptions(route.file, "next") ?? new Map<string, string>();
  const fromServer = (server && exportedOptions(server, "next")) || new Map<string, string>();

  const known = (key: string, where: string) => {
    if (!VALUE_EXPORTS.has(key) && !CONFIG_EXPORTS.has(key)) {
      throw new Error(`${where}: \`next.${key}\` isn't a Next.js route option. It takes ${[...VALUE_EXPORTS, ...CONFIG_EXPORTS].join(", ")}.`);
    }
  };
  const config = (key: string, value: string, where: string) => {
    const literal = value.replace(/\s+as\s+const$/, "").trim();
    if (!LITERAL.test(literal)) {
      throw new Error(`${where}: \`next.${key}\` must be a literal, such as \`${key}: 60\`. Next.js reads it without running the file.`);
    }
    exports.push(`export const ${key} = ${literal};`);
  };

  for (const [key, value] of fromModule) {
    known(key, route.id);
    if (fromServer.has(key)) throw new Error(`${route.id}: \`next.${key}\` is set in both the route's module and its server file. Keep one.`);
    if (CONFIG_EXPORTS.has(key)) config(key, value, route.id);
    else if (isPlainValue(value)) exports.push(`export const ${key} = ${value.replace(/\s+as\s+const$/, "").trim()};`);
    else {
      throw new Error(
        `${route.id}: \`next.${key}\` isn't a plain value, so the server can't take it from the route's module. Move it to the route's server file, ${route.id}.server.ts.`,
      );
    }
  }

  for (const [key, value] of fromServer) {
    known(key, `${route.id}.server`);
    if (CONFIG_EXPORTS.has(key)) config(key, value, `${route.id}.server`);
    else exports.push(`export const ${key} = next.${key};`);
  }
  if (server && exports.some((line) => line.includes("= next."))) imports.push(`import { next } from "${importPath(at, server)}";`);

  if (kind === "layout") {
    imports.unshift('import type { ReactNode } from "react";');
    imports.push('import Shell from "./mismo-layout";');
  } else {
    imports.push('import Screen from "./mismo-page";');
  }

  const component =
    kind === "layout"
      ? `export default function MismoLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}`
      : `export default function MismoPage() {
  return <Screen />;
}`;

  return `${GENERATED}${[imports.join("\n"), ...(exports.length ? [exports.join("\n")] : []), component].join("\n\n")}\n`;
}

const clientPage = (from: string) => `${GENERATED}"use client";

import { Suspense } from "react";

import Page from "${from}";

// Next.js prerenders a page only with a boundary around \`useSearchParams\`.
export default function MismoScreen() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
`;

const clientLayout = (from: string) => `${GENERATED}"use client";

import { SlotChildren } from "@mismo/next/runtime";
import type { ReactNode } from "react";

import Layout from "${from}";

// Next.js gives a layout its page as \`children\`: the shared layout renders it with \`Slot\`.
export default function MismoShell({ children }: { children: ReactNode }) {
  return (
    <SlotChildren value={children}>
      <Layout />
    </SlotChildren>
  );
}
`;
