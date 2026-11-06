import { createRequire } from "node:module";
import path from "node:path";

import type { RouteInput, RouteRules } from "./interfaces.ts";

/** The routes, defined once, in the package that holds them. */
export interface RoutesOptions {
  /** The routes folder, relative to the config file. */
  source: string;
  /** The convention it is written in, read by that router's parser. */
  input: RouteInput;
  /**
   * The routers the routes must stay valid for, by their adapters: `[tanstack, expo]`. Every app's
   * build checks all of their rules, not only its own router's, so a route one router cannot
   * express fails in every build. An app's own output is always checked.
   */
  validFor?: { rules: RouteRules }[];
  /**
   * Types for the package's own code, relative to the config file. `shared` is what every platform
   * has, for its plain files; `web` and `native` add a platform's own, for its platform files.
   */
  types?: { shared?: string; web?: string; native?: string };
}

/** A loaded config, with its paths absolute. */
export interface RoutesConfig {
  source: string;
  input: RouteInput;
  rules: RouteRules[];
  types: { shared?: string; web?: string; native?: string };
}

/** Defines the routes once. Each app reads this file and runs its own output on it. */
export function defineRoutes(options: RoutesOptions): RoutesOptions {
  return options;
}

const require = createRequire(import.meta.url);

/**
 * Reads a `routes.config.ts`, at a path relative to `cwd`. Synchronous, for Metro's config: Node
 * loads a TypeScript module with `require` itself.
 */
export function loadRoutesConfig(file: string, cwd = process.cwd()): RoutesConfig {
  const absolute = path.resolve(cwd, file);
  const loaded = require(absolute) as { default?: RoutesOptions };
  const options = loaded.default;

  if (typeof options?.source !== "string" || typeof options.input?.read !== "function") {
    throw new Error(`${absolute} should export defineRoutes({ source, input, … }) as its default.`);
  }

  return resolveRoutesConfig(options, path.dirname(absolute));
}

/** Options with their paths made absolute against `dir`, the config file's folder. */
export function resolveRoutesConfig(options: RoutesOptions, dir: string): RoutesConfig {
  const types = Object.entries(options.types ?? {}).map(([target, file]) => [target, path.resolve(dir, file)]);

  return {
    source: path.resolve(dir, options.source),
    input: options.input,
    rules: (options.validFor ?? []).map((output) => output.rules),
    types: Object.fromEntries(types) as RoutesConfig["types"],
  };
}
