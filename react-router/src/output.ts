import path from "node:path";

import {
  exportedOptions,
  type Files,
  GENERATED,
  importPath,
  oneUrlPerPage,
  type RouteOutput,
  type RouteRules,
  serverModule,
  type SharedRoute,
} from "@mismo/core/adapter";

/** What React Router cannot express. Its routes are config, so any name is fine. */
export const rules: RouteRules = {
  router: "React Router",
  target: "web",
  // It would match the first of two routes at one URL, and never the second.
  check: (routes) => oneUrlPerPage(routes, "React Router"),
};

/**
 * React Router's routes, for a web app in framework mode. Its routes are config, not a folder, so
 * `outDir` is a folder of their own (`app/mismo`): a file per route that re-exports its module,
 * and `routes.ts`, which lists them with React Router's own helpers. The app's `app/routes.ts`
 * spreads them in, next to its own:
 *
 *     import { routes } from "./mismo/routes";
 *     export default [...routes, route("admin", "admin.tsx")] satisfies RouteConfig;
 */
export function output({ outDir, types }: { outDir: string; types: string }): RouteOutput {
  return {
    name: "react-router",
    target: "web",
    outDir,
    types,
    rules,
    runtime: "@mismo/react-router/runtime",
    emit(routes, context) {
      const files: Files = new Map();

      const entries = (list: readonly SharedRoute[], depth: number): string[] =>
        list.map((route) => {
          // The route's own file in the folder, named like its file in the routes folder.
          const file = `${route.id}.tsx`;
          files.set(file, routeModule(route, path.join(context.outDir, file)));

          const at = JSON.stringify(`./${file}`);
          // Its id, stable and the same on every machine. React Router's default is the file's path,
          // absolute here, which would put this machine's folders in the app's route manifest.
          const id = `{ id: ${JSON.stringify(`mismo/${route.id}`)} }`;
          const indent = "  ".repeat(depth + 1);
          if (!route.layout) {
            return route.index ? `${indent}index(${at}, ${id})` : `${indent}route(${JSON.stringify(route.path)}, ${at}, ${id})`;
          }

          const children = `[\n${entries(route.children ?? [], depth + 1).join(",\n")},\n${indent}]`;
          return route.path
            ? `${indent}route(${JSON.stringify(route.path)}, ${at}, ${id}, ${children})`
            : `${indent}layout(${at}, ${id}, ${children})`;
        });

      const list = entries(routes, 0);
      files.set(
        "routes.ts",
        `${GENERATED}import { type RouteConfigEntry, relative } from "@react-router/dev/routes";

// Files relative to this folder: React Router makes them relative to the app folder itself.
const { route, layout, index } = relative(import.meta.dirname);

/** The shared routes, for this app's \`app/routes.ts\`: \`export default [...routes, …]\`. */
export const routes: RouteConfigEntry[] = [
${list.join(",\n")}${list.length ? "," : ""}
];
`,
      );

      return files;
    },
  };
}

/**
 * React Router's route exports a shared route may set, by where they run. The browser's come from
 * the route's module, as `export const reactRouter = { meta, … }`; the server's from its server
 * file, `orgs/[id].server.ts`, as `export const reactRouter = { loader, … }`, so their code stays
 * out of the native app, which bundles the module but never the server file.
 */
const CLIENT_EXPORTS = new Set(["meta", "links", "handle", "clientLoader", "clientAction", "ErrorBoundary", "HydrateFallback", "shouldRevalidate"]);
const SERVER_EXPORTS = new Set(["loader", "action", "headers", "middleware"]);

/**
 * A route's module for React Router: its screen as the default export, and each React Router
 * option the route sets as the route export of that name, which React Router reads. Without
 * options, a plain re-export of the screen.
 */
function routeModule(route: SharedRoute, at: string): string {
  const from = importPath(at, route.file);
  const server = serverModule(route.file);
  const client = exportedOptions(route.file, "reactRouter");
  const serverOptions = server ? exportedOptions(server, "reactRouter") : undefined;
  if (!client && !serverOptions) return `${GENERATED}export { default } from "${from}";\n`;

  for (const key of client?.keys() ?? []) {
    if (SERVER_EXPORTS.has(key)) {
      throw new Error(`${route.id}: \`reactRouter.${key}\` runs on the server. Move it to the route's server file, ${route.id}.server.ts, so the native app never bundles it.`);
    }
    if (!CLIENT_EXPORTS.has(key)) throw new Error(`${route.id}: \`reactRouter.${key}\` isn't a React Router route export. It takes ${[...CLIENT_EXPORTS].join(", ")}.`);
  }
  for (const key of serverOptions?.keys() ?? []) {
    if (CLIENT_EXPORTS.has(key)) {
      throw new Error(`${route.id}: \`reactRouter.${key}\` runs in the browser. Move it from ${route.id}.server.ts to the route's own module.`);
    }
    if (!SERVER_EXPORTS.has(key)) throw new Error(`${route.id}.server: \`reactRouter.${key}\` isn't a React Router server export. It takes ${[...SERVER_EXPORTS].join(", ")}.`);
  }

  const lines = [`import Component${client ? ", { reactRouter }" : ""} from "${from}";`];
  if (server && serverOptions) lines.push(`import { reactRouter as server } from "${importPath(at, server)}";`);
  lines.push("", "export default Component;");
  for (const key of client?.keys() ?? []) lines.push(`export const ${key} = reactRouter.${key};`);
  for (const key of serverOptions?.keys() ?? []) lines.push(`export const ${key} = server.${key};`);
  return `${GENERATED}${lines.join("\n")}\n`;
}
