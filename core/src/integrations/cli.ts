#!/usr/bin/env node
// For apps without a Vite plugin, typechecks, and the shared package's types:
//
//   mismo generate --config <routes.config.ts> --adapter <package> --out <dir> --types <file> [--watch]
//   mismo types --config <routes.config.ts>
//
// `--adapter` is the adapter's package, as the app depends on it: `@mismo/tanstack`, `@mismo/expo`,
// or your own. Its `output` writes the app's routes.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import type { RouterAdapter } from "../config/interfaces.ts";
import { generateAppRoutes, generateTypes, watchAppRoutes } from "../generate/index.ts";

const USAGE = [
  "usage: mismo generate --config <file> --adapter <package> --out <dir> --types <file> [--watch]",
  "       mismo types --config <file>",
].join("\n");

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    config: { type: "string" },
    adapter: { type: "string" },
    out: { type: "string" },
    types: { type: "string" },
    watch: { type: "boolean", default: false },
  },
});

function fail(message = USAGE): never {
  console.error(message);
  process.exit(1);
}

/** The adapter a package exports: its default export, or its one export with an `output`. */
async function adapterOf(name: string): Promise<RouterAdapter> {
  const file = createRequire(path.join(process.cwd(), "package.json")).resolve(name);
  const module = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
  const adapters = Object.values(module).filter((value): value is RouterAdapter =>
    Boolean(value && typeof value === "object" && "rules" in value && "output" in value),
  );

  if (adapters.length !== 1) fail(`${name} should export one mismo adapter with an output; it has ${adapters.length}.`);
  return adapters[0]!;
}

const [command] = positionals;
if (!values.config) fail();

if (command === "types") {
  generateTypes(values.config);
} else if (command === "generate") {
  if (!values.adapter || !values.out || !values.types) fail();

  const adapter = await adapterOf(values.adapter);
  const app = { config: values.config, output: adapter.output!({ outDir: values.out, types: values.types }) };
  if (values.watch) watchAppRoutes(app);
  else generateAppRoutes(app);
} else {
  fail();
}
