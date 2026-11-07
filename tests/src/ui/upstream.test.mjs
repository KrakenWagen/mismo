// Catches upgrades of the two things this package relies on without either promising them.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { test } from "vitest";

const require = createRequire(new URL("../../../packages/ui/package.json", import.meta.url));
const babel = require("@babel/core");
const uniwind = path.dirname(require.resolve("uniwind/package.json"));
const read = (file) => fs.readFileSync(path.join(uniwind, "src", file), "utf8");

test("Uniwind is pinned to an exact version", () => {
  const { dependencies } = require("./package.json");
  assert.match(dependencies.uniwind, /^\d+\.\d+\.\d+$/);
});

test("Uniwind's CSS is imported with Tailwind's theme, which it needs", () => {
  const root = path.dirname(require.resolve("./package.json"));
  const imports = [...fs.readFileSync(path.join(root, "css/tailwind.css"), "utf8").matchAll(/@import "([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(imports, ["tailwindcss/theme.css", "tailwindcss/utilities.css", "uniwind"]);
});

test("Uniwind still has the internals in uniwind-internals.d.ts", () => {
  assert.match(read("components/native/useStyle.ts"), /export const useStyle = \(className: string \| undefined, componentProps: .+, state\?: ComponentState\)/);
  assert.match(read("core/context.ts"), /export const useUniwindContext = /);
  assert.match(read("core/native/index.ts"), /\.\/store/);
  assert.match(read("core/native/store.ts"), /export const UniwindStore = /);
  assert.match(read("core/native/store.ts"), /getStyles\(\s*className: string \| undefined,\s*componentProps: .+,\s*state: ComponentState \| undefined,\s*uniwindContext: UniwindContextType,/);
});

test("Uniwind still has the public API for safe areas", () => {
  assert.match(read("core/config/config.native.ts"), /updateInsets\(insets: Insets\)/);
  assert.match(read("index.ts"), /export \{ Uniwind \}/);
});

test("Uniwind's stylesheet still resolves these states", () => {
  const matches = read("bundler/css-processor/matches.ts");
  for (const [variant, state] of [["active", "isPressed"], ["focus", "isFocused"], ["disabled", "isDisabled"]]) {
    assert.ok(matches.includes(`['${variant}', '${state}']`), variant);
  }
});

test("React Strict DOM's merge() still adds a compiled style's classes", async () => {
  // The file needs compiling, like an app's, and then has nothing left to import.
  const source = fs.readFileSync(require.resolve("react-strict-dom/runtime"), "utf8");
  const { code } = babel.transformSync(source, {
    babelrc: false,
    configFile: false,
    filename: "/runtime.js",
    presets: [require.resolve("./integrations/babel.cjs")],
  });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mismo-ui-runtime-"));
  const file = path.join(dir, "runtime.mjs");
  fs.writeFileSync(file, code.replace(/^import .*@stylexjs\/stylex.*$/m, ""));
  try {
    const { merge, defaultStyles } = await import(file);
    const { className } = merge(defaultStyles.div, { $$css: true, tailwind: "flex p-4" });
    assert.match(className, /(^| )flex p-4( |$)/);
    assert.match(className, /x\w+/, "keeps the defaults' classes");
    assert.doesNotMatch(merge(defaultStyles.div, { $$css: true, tailwind: null }).className ?? "", /null/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
