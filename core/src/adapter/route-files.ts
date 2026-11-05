import { readdirSync, statSync } from "node:fs";
import path from "node:path";

import { type Platform, platformOf } from "../model/platforms.ts";

const SCRIPT = /\.(tsx|ts|jsx|js)$/;

/**
 * The route files in a folder, by route: its path without extension or platform, posix, such as
 * `(app)/orgs/[id]`, and the platforms it has a file for (`""` the plain file). Skips dotfiles,
 * names starting with `-`, tests, declaration files, and server files (`name.server.ts`, see
 * options.ts). Platform files are this library's rule,
 * the same for every input, so a folder-based input starts here.
 */
export function routeFiles(source: string): Map<string, Set<Platform | "">> {
  const routes = new Map<string, Set<Platform | "">>();

  const walk = (dirs: string[]) => {
    for (const name of readdirSync(path.join(source, ...dirs)).sort()) {
      if (name.startsWith(".") || name.startsWith("-")) continue;
      if (statSync(path.join(source, ...dirs, name)).isDirectory()) {
        walk([...dirs, name]);
        continue;
      }
      if (!SCRIPT.test(name) || /\.(test|spec)\./.test(name) || name.endsWith(".d.ts")) continue;
      // A route's server file (`orgs/[id].server.ts`) holds its server-only options, not a route.
      if (/\.server\.(tsx|ts|jsx|js)$/.test(name)) continue;

      const { base, platform } = platformOf(name.replace(SCRIPT, ""));
      const route = [...dirs, base].join("/");
      routes.set(route, (routes.get(route) ?? new Set()).add(platform));
    }
  };

  walk([]);
  return routes;
}
