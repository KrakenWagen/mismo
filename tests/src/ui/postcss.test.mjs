import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, test } from "vitest";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../../../packages/ui/package.json", import.meta.url));
const postcss = require("postcss");
const plugin = require("./integrations/postcss.cjs");

const UI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../packages/ui");
const cwd = process.cwd();
let app;

/** A small workspace: an app, and a shared package outside it. */
beforeAll(() => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "mismo-ui-")));
  app = path.join(root, "app");
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  };
  write("app/screen.tsx", `import { css, html } from "@mismo/ui";\nconst s = css.create({ a: { color: "#111111" } });\nexport const A = () => <html.div className="flex web:p-1 ios:p-2 dark:p-3 light:p-4 disabled:p-5 pb-safe mt-safe-or-4 border-continuous" style={s.a} />;`);
  write("shared/screen.tsx", `import { css, html } from "@mismo/ui";\nconst s = css.create({ a: { color: "#222222" } });\nexport const B = () => <html.div className="grid" style={s.a} />;`);
  write("app/plain.ts", `const s = { css: { create: 1 } }; export default "#333333 not-compiled";`);
  write("app/dist/old.tsx", `import { css } from "@mismo/ui"; export const s = css.create({ a: { color: "#444444" } });`);
  write("app/node_modules/x/index.tsx", `import { css } from "@mismo/ui"; export const s = css.create({ a: { color: "#555555" } });`);
  fs.mkdirSync(path.join(app, "node_modules/@mismo"), { recursive: true });
  fs.symlinkSync(UI, path.join(app, "node_modules/@mismo/ui"));
  process.chdir(app);
});

afterAll(() => {
  process.chdir(cwd);
  fs.rmSync(path.dirname(app), { recursive: true, force: true });
});

const run = async (css, file = "global.css") => {
  const from = path.join(app, file);
  return (await postcss([plugin()]).process(css, { from })).css;
};

const ENTRY = `@import "@mismo/ui/tailwind.css";\n@source "../shared";\n`;

test("generates Tailwind's classes and css.create's styles, from the app and @source", async () => {
  const css = await run(ENTRY);
  assert.match(css, /\.flex/);
  assert.match(css, /\.grid/);
  assert.match(css, /#111/);
  assert.match(css, /#222/);
});

test("includes React Strict DOM's own defaults", async () => {
  assert.match(await run(ENTRY), /word-wrap: ?break-word/);
});

test("Tailwind's utilities beat css.create, which beats the reset", async () => {
  const css = await run(ENTRY);
  const order = css.match(/@layer ([\w-]+(?:, ?[\w-]+)*);/)[1].split(/, ?/);
  assert.ok(order.indexOf("base") < order.indexOf("strict-dom"));
  assert.ok(order.indexOf("strict-dom") < order.indexOf("utilities"));
});

test("skips dependencies and build output", async () => {
  const css = await run(ENTRY);
  assert.doesNotMatch(css, /#444/);
  assert.doesNotMatch(css, /#555/);
});

test("works when the bundler has already replaced the @import, as Vite does", async () => {
  const css = await run(`@layer theme, base, strict-dom, utilities;\n@source "../shared";\n`);
  assert.match(css, /#222/);
});

test("has Uniwind's variants", async () => {
  const css = await run(ENTRY);
  assert.match(css, /@supports selector\(div ?> ?div\)[^}]*web\\:p-1/);
  assert.match(css, /@media ios[^}]*ios\\:p-2/);
  assert.match(css, /dark\\:p-3:where\(\.dark/);
  assert.match(css, /light\\:p-4:where\(\.light/);
  assert.match(css, /disabled\\:p-5\[aria-disabled=["']?true/);
});

test("has Uniwind's safe-area utilities, which work on the web too", async () => {
  const css = await run(ENTRY);
  assert.match(css, /\.pb-safe[^}]*env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.mt-safe-or-4[^}]*env\(safe-area-inset-top\)/);
});

test("only what's used of Uniwind's CSS ends up in the output", async () => {
  assert.doesNotMatch(await run(ENTRY), /\.pt-safe|\.h-screen-safe/);
});

test("leaves other CSS files alone", async () => {
  assert.equal(await run(`.a { color: red; }`), `.a { color: red; }`);
});

test("reports files so that bundlers rebuild on changes", async () => {
  const from = path.join(app, "global.css");
  const { messages } = await postcss([plugin()]).process(ENTRY, { from });
  assert.ok(messages.some((m) => m.type === "dependency" && m.file.endsWith("shared/screen.tsx")));
  assert.ok(messages.some((m) => m.type === "dir-dependency" && m.dir.endsWith("shared")));
});
