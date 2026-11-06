import { watch } from "node:fs";
import path from "node:path";

import { loadRoutesConfig, type RoutesConfig } from "../config/define.ts";
import type { RouteOutput, RouteRules } from "../config/interfaces.ts";
import type { SharedRoute, Target } from "../model/route.ts";
import { emitTypes } from "./types.ts";
import { writeFile, writeRoutes } from "./write.ts";

/** One app's routes: the shared config, and the app's own output. */
export interface AppRoutesOptions {
  /** The shared `routes.config.ts`, relative to `cwd`, or the config already loaded. */
  config: string | RoutesConfig;
  output: RouteOutput;
  /** The app's folder: what `output`'s paths are relative to. */
  cwd?: string;
}

const load = (config: string | RoutesConfig, cwd: string) => (typeof config === "string" ? loadRoutesConfig(config, cwd) : config);

/**
 * The routes a target has, after checking every router's rules on the routes it would take.
 * Throws with every problem at once.
 */
function checkedRoutes(config: RoutesConfig, target: Target, rules: readonly RouteRules[]): SharedRoute[] {
  const read = new Map<Target, SharedRoute[]>();
  const routesOf = (t: Target) => read.get(t) ?? read.set(t, config.input.read(config.source, t)).get(t)!;

  const routers = [...new Map(rules.map((r) => [r.router, r])).values()];
  const problems = routers.flatMap((r) => r.check(routesOf(r.target)));
  if (problems.length > 0) {
    throw new Error(`The routes do not fit every router they are for:\n${problems.map((p) => `  ${p}`).join("\n")}`);
  }

  return routesOf(target);
}

/**
 * Writes one app's routes into its router's folder, next to the app's own, and its types: the
 * shared routes plus its platform's own. Throws on a problem, leaving the last good output.
 */
export function generateAppRoutes({ config, output, cwd = process.cwd() }: AppRoutesOptions) {
  const loaded = load(config, cwd);
  const routes = checkedRoutes(loaded, output.target, [...loaded.rules, output.rules]);
  const outDir = path.resolve(cwd, output.outDir);

  writeRoutes(outDir, output.emit(routes, { outDir }));
  writeFile(path.resolve(cwd, output.types), emitTypes(routes, loaded.input.param));
}

/** Writes the types the config lists, for the package that holds the routes. */
export function generateTypes(config: string | RoutesConfig, cwd = process.cwd()) {
  const loaded = load(config, cwd);

  for (const [target, file] of Object.entries(loaded.types) as [Target, string | undefined][]) {
    if (file) writeFile(file, emitTypes(checkedRoutes(loaded, target, loaded.rules), loaded.input.param));
  }
}

/**
 * Generates now, then again whenever the routes folder gains, loses, or renames a file. Edits to a
 * file's content need nothing: the generated files only import it. Errors are logged, not thrown,
 * so a half-made route does not stop the dev server.
 */
export function watchAppRoutes(options: AppRoutesOptions, log: (message: string) => void = console.error): () => void {
  const cwd = options.cwd ?? process.cwd();
  const config = load(options.config, cwd);
  const run = () => generateAppRoutes({ ...options, config, cwd });

  run();
  return watchFolder(config.source, () => {
    try {
      run();
    } catch (error) {
      log(`[routes] ${(error as Error).message}`);
    }
  });
}

function watchFolder(dir: string, onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const watcher = watch(dir, { recursive: true }, (event) => {
    if (event !== "rename") return;
    clearTimeout(timer);
    timer = setTimeout(onChange, 50);
  })
    // Unref'd: a one-off build that loads the same config exits when it is done.
    .unref();

  return () => {
    clearTimeout(timer);
    watcher.close();
  };
}

export { defineRoutes, loadRoutesConfig, resolveRoutesConfig, type RoutesConfig, type RoutesOptions } from "../config/define.ts";
export type { Files, OutputContext, RouteInput, RouteOutput, RouteRules, RouterAdapter } from "../config/interfaces.ts";
export type { SharedRoute, Target } from "../model/route.ts";
