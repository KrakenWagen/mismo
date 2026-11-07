// Builds demo.mismo.dev from the published starter, so the demo is what `pnpm create mismo` gives you:
//   public/          the web app (TanStack Start, as static files) and the panel
//   public/native/   the native app's bundles and assets, for Expo Go
//   src/manifests.json   what the Worker sends Expo Go
//
// MISMO_STARTER=/path/to/mismo-starter uses a local copy of the starter instead.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { build } from "esbuild";

import { buildManifests } from "./src/manifest.ts";

/**
 * What the demo is built from, pinned: a deploy builds what the last one did, however the starter
 * has moved. To take a newer starter, change these (and test the build before deploying).
 */
const CREATE = "create-mismo@0.1.0-beta.1";
const STARTER = "KrakenWagen/mismo-starter#b32e2d0263b64e5f4be3ad6489f1a4256772c473";

const here = import.meta.dirname;
const work = path.join(here, ".build");
const app = path.join(work, "mismo-notes");
const publicDir = path.join(here, "public");

/** Runs a command, showing its output. With `capture`, its output is returned instead of shown. */
function run(command: string, args: string[], cwd: string, { env = {}, capture = false }: { env?: Record<string, string>; capture?: boolean } = {}) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    env: { ...process.env, ...env },
  });
}

function replaceOnce(file: string, from: string, to: string) {
  const text = readFileSync(file, "utf8");
  if (!text.includes(from)) throw new Error(`${file} no longer contains: ${from}`);
  writeFileSync(file, text.replace(from, to));
}

rmSync(work, { recursive: true, force: true });
rmSync(publicDir, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
mkdirSync(path.join(publicDir, "_demo"), { recursive: true });

const starter = process.env.MISMO_STARTER ?? STARTER;
run("pnpm", ["dlx", CREATE, "mismo-notes", "--template", starter, "--web", "tanstack", "--native", "--no-git", "--yes"], work);

// The web app, as static files: a shell that the router fills in, for any URL.
const tanstack = path.join(app, "apps/tanstack");
replaceOnce(path.join(tanstack, "vite.config.ts"), "tanstackStart()", "tanstackStart({ spa: { enabled: true } })");
run("pnpm", ["build"], tanstack);
const client = ["dist/client", ".output/public"].map((dir) => path.join(tanstack, dir)).find(existsSync);
if (!client) throw new Error("Couldn't find the web app's static files.");
cpSync(client, publicDir, { recursive: true });
renameSync(path.join(publicDir, "_shell.html"), path.join(publicDir, "index.html"));

// The panel, added on top: one script, with its styles and markup inside it.
await build({
  entryPoints: [path.join(here, "src/panel/panel.ts")],
  outfile: path.join(publicDir, "_demo/panel.js"),
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  loader: { ".css": "text", ".html": "text" },
  logLevel: "warning",
});
replaceOnce(path.join(publicDir, "index.html"), "</body>", '<script src="/_demo/panel.js" defer></script></body>');

// The native app. Expo Go only takes plain JavaScript from a server that isn't Expo's.
const native = path.join(app, "apps/native");
const exported = path.join(work, "native-export");
run("pnpm", ["exec", "expo", "export", "--no-bytecode", "--platform", "ios", "--platform", "android", "--output-dir", exported], native);
const config = JSON.parse(run("pnpm", ["exec", "expo", "config", "--json", "--type", "public"], native, { env: { EXPO_NO_DOTENV: "1" }, capture: true }));
for (const folder of ["_expo", "assets"]) cpSync(path.join(exported, folder), path.join(publicDir, "native", folder), { recursive: true });

const manifests = buildManifests({ exported, config });
writeFileSync(path.join(here, "src/manifests.json"), JSON.stringify(manifests));

// Files whose names carry a hash of their content never change meaning, so browsers and Expo Go can
// keep them for good. The page and the panel's script keep the default: checked on every visit.
const immutable = "  Cache-Control: public, max-age=31536000, immutable";
writeFileSync(path.join(publicDir, "_headers"), ["/assets/*", "/native/_expo/*", "/native/assets/*"].map((glob) => `${glob}\n${immutable}\n`).join("\n"));

console.log(`\nBuilt for Expo SDK ${config.sdkVersion} (${Object.keys(manifests).join(", ")}), from ${CREATE} and ${starter}.`);
