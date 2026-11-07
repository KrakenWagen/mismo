import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { test } from "vitest";

const require = createRequire(new URL("../../../packages/ui/package.json", import.meta.url));
const { withUI } = require("./integrations/metro.cjs");

const configure = (serializer) => withUI({ projectRoot: process.cwd(), resolver: {}, serializer }, { cssEntryFile: "./global.css" });

test("safe areas are set up before the app starts, after what ran already", () => {
  const modules = configure({ getModulesRunBeforeMainModule: () => ["core"] }).serializer.getModulesRunBeforeMainModule("entry");
  assert.equal(modules[0], "core");
  assert.match(modules[1], /safe-areas\.native\.(ts|js)$/);
  assert.ok(fs.existsSync(modules[1]));
});

test("it works when nothing else runs before the app", () => {
  assert.equal(configure(undefined).serializer.getModulesRunBeforeMainModule("entry").length, 1);
});

test("Uniwind's internals resolve to real files", () => {
  const seen = [];
  const { resolver } = configure();
  const context = { originModulePath: "/app/x.ts", resolveRequest: (_, name) => (seen.push(name), { type: "sourceFile", filePath: name }) };
  resolver.resolveRequest(context, "uniwind/internal/core/context", "ios");
  const file = seen.at(-1);
  assert.match(file, /uniwind[\\/]src[\\/]core[\\/]context$/);
  assert.ok(fs.existsSync(`${file}.ts`));
});

// Metro only runs a "before main" module that's in the bundle, and the native entry is what puts it
// there. A build drops a bare import of a module that the package calls side-effect free.
test("the safe-area module stays in the native bundle once built", () => {
  const { sideEffects } = require("./package.json");
  assert.ok(Array.isArray(sideEffects), "sideEffects must list the modules that run on import");
  assert.ok(sideEffects.some((file) => /dist\/safe-areas\.native\.js$/.test(file)), "dist/safe-areas.native.js");
  assert.match(fs.readFileSync(require.resolve("./src/index.native.ts"), "utf8"), /^import "\.\/safe-areas\.native\.ts";$/m);
});
