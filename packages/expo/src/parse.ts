import { createRequire } from "node:module";

/** The part of Expo Router's route node this reads. */
export interface ExpoRouteNode {
  type: string;
  /** Below the parent layout, in Expo's spelling: `(app)/orgs/[id]`. Empty for the root. */
  route: string;
  /** The file, as given: `./(app)/orgs/[id].tsx`. */
  contextKey: string;
  children: ExpoRouteNode[];
}

/** Where Expo Router builds its route tree from file names, in `expo-router/build/getRoutesCore`. */
type GetRoutes = (context: RequireContext, options: Record<string, unknown>) => ExpoRouteNode | null;

/** Metro's `require.context`, which Expo's parser reads its file names from. */
interface RequireContext {
  (key: string): unknown;
  keys(): string[];
  resolve(key: string): string;
  id: string;
}

const require = createRequire(import.meta.url);

/** The key of the root Expo adds when the folder has no root layout: not a file of the folder. */
const SYSTEM = "expo-router/system";

/**
 * Expo Router's route tree for these files, from Expo Router's own parser: the nesting of layouts,
 * groups, the index routes, and params, by Expo's rules and with Expo's errors. The only place this
 * library touches Expo Router's internals: `getRoutes` is not documented, so this file and its
 * tests are what an Expo SDK that changes it would change.
 *
 * `keys` are `./`-relative file names, one per route, for one target: platform files are already
 * resolved (`model/platforms.ts`), since Expo would also want a plain file beside each one.
 * Nothing is loaded: the parser gets a stand-in for Metro's `require.context` that only lists them.
 */
export function parseExpoRoutes(keys: string[]): ExpoRouteNode | null {
  const { getRoutes } = require("expo-router/build/getRoutesCore.js") as { getRoutes: GetRoutes };
  const context = Object.assign((_key: string) => ({ default: () => null }), {
    keys: () => keys,
    resolve: (key: string) => key,
    id: "shared-routes",
  });

  return getRoutes(context, {
    platformRoutes: false,
    ignoreEntryPoints: true,
    sitemap: false,
    notFound: false,
    getSystemRoute: (route: { route: string; type: string }) => ({
      ...route,
      contextKey: SYSTEM,
      children: [],
      dynamic: null,
      entryPoints: [],
      loadRoute: () => ({ default: () => null }),
    }),
  });
}

/** Whether a node is one Expo added itself, not a file of the folder. */
export const isSystemNode = (node: ExpoRouteNode) => node.contextKey === SYSTEM;
