import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

/** The web apps in the starter. */
export type Web = "next" | "tanstack";

/** What the person picked. */
export interface Choices {
  /** The project's name: its folder, its root package, and its package scope (`@name/app`). */
  name: string;
  /** The web apps to keep. */
  web: Web[];
  /** Whether to keep the Expo native app. */
  native: boolean;
}

/** The scope the starter's packages are under, which becomes the project's. */
const STARTER_SCOPE = "@acme";
const STARTER_NAME = "mismo-starter";

/** Every web app in the starter. */
const WEB_APPS: readonly Web[] = ["next", "tanstack"];

/**
 * Turns the starter in `dir` into the project the choices describe: removes the apps and the code
 * for them that weren't chosen, and renames what the starter calls itself. The same steps as
 * "Keep only the apps you need" in the starter, done for you.
 *
 * It is written against the starter's layout, and fails with a message when a step no longer
 * finds what it removes, instead of leaving a half-pruned project.
 */
export function customize(dir: string, choices: Choices): void {
  const removed = WEB_APPS.filter((web) => !choices.web.includes(web));

  removeApps(dir, choices, removed);
  rootPackage(dir, choices);
  sharedPackage(dir, choices, removed);
  routesConfig(dir, choices, removed);
  routeOptions(dir, removed);
  if (!choices.native) removeNative(dir);
  workspace(dir, removed);

  // A lockfile for the starter's packages and names is wrong for this project: install writes one.
  rmSync(path.join(dir, "pnpm-lock.yaml"), { force: true });
  rmSync(path.join(dir, "docs/removing-an-app.md"), { force: true });
  if (existsSync(path.join(dir, "docs")) && readdirSync(path.join(dir, "docs")).length === 0) rmSync(path.join(dir, "docs"), { recursive: true });

  readme(dir, choices);
  rename(dir, choices.name);
}

/** The npm-safe name for a folder name: lowercase letters, digits and dashes. */
export function packageName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ─── Steps ─────────────────────────────────────────────────────────────────── */

function removeApps(dir: string, { native }: Choices, removed: Web[]) {
  for (const app of [...removed, ...(native ? [] : ["native"])]) {
    const folder = path.join(dir, "apps", app);
    if (!existsSync(folder)) throw missing(`apps/${app}`);
    rmSync(folder, { recursive: true });
  }
}

/** The root scripts: one per app, and a build of the web apps that are left. */
function rootPackage(dir: string, { web, native }: Choices) {
  editJson(dir, "package.json", (json) => {
    const scripts = json.scripts as Record<string, string>;
    for (const app of WEB_APPS) if (!web.includes(app)) delete scripts[app];
    if (!native) delete scripts.native;
    scripts.build = `pnpm ${web.map((app) => `--filter ${STARTER_SCOPE}/${app}`).join(" ")} build`;
  });
}

/** The shared package's dependencies: the adapters of the web apps removed, and React Native's if there's no native app. */
function sharedPackage(dir: string, { native }: Choices, removed: Web[]) {
  editJson(dir, "packages/app/package.json", (json) => {
    const sections = [json.dependencies, json.devDependencies] as Record<string, string>[];
    const drop = [
      ...removed.map((web) => `@mismo/${web}`),
      ...(native ? [] : ["@react-native-async-storage/async-storage", "expo-router", "react-native", "react-native-safe-area-context"]),
    ];
    for (const section of sections) for (const name of drop) delete section?.[name];
  });
}

/** The routes config: the routers it checks the routes for, and the native types file. */
function routesConfig(dir: string, { native }: Choices, removed: Web[]) {
  edit(dir, "packages/app/routes.config.ts", (text) => {
    let result = text;

    for (const web of removed) {
      result = replaceOnce(result, new RegExp(`^import \\{ ${web} \\} from "@mismo/${web}";\\n`, "m"), "", `its ${web} import`);
    }
    result = replaceOnce(
      result,
      /validFor: \[([^\]]*)\]/,
      (_, list: string) => `validFor: [${list.split(",").map((item) => item.trim()).filter((item) => item && !removed.includes(item as Web)).join(", ")}]`,
      "its validFor list",
    );
    if (!native) result = replaceOnce(result, /^[ \t]*native: "[^"]*",\n/m, "", "its native types file");

    return result;
  });
}

/** Each route's options for a router removed: its `export const next = …` and the type import for it. */
function routeOptions(dir: string, removed: Web[]) {
  const types = { next: "NextRouteOptions", tanstack: "TanstackRouteOptions" };

  for (const file of walk(path.join(dir, "packages/app")).filter((f) => /\.tsx?$/.test(f))) {
    const text = readFileSync(file, "utf8");
    let result = text;

    for (const web of removed) {
      result = result
        .replace(new RegExp(`^import type \\{ ${types[web]} \\} from "@mismo/${web}";\\n`, "m"), "")
        .replace(new RegExp(`^export const ${web} = [\\s\\S]*?satisfies ${types[web]};\\n`, "m"), "");
    }

    if (result !== text) writeFileSync(file, result);
  }
}

/** The native app's files in the shared package, and the TypeScript project for them. */
function removeNative(dir: string) {
  for (const file of walk(path.join(dir, "packages/app")).filter((f) => /\.native\.[^./]+$/.test(path.basename(f)))) rmSync(file);

  rmSync(path.join(dir, "packages/app/tsconfig.native.json"), { force: true });
  edit(dir, "packages/app/tsconfig.json", (text) =>
    replaceOnce(text, /,?\s*\{ "path": "\.\/tsconfig\.native\.json" \}/, "", "its reference to tsconfig.native.json"),
  );
}

/** pnpm's overrides that point at a package removed: local builds of the adapters, until they're on npm. */
function workspace(dir: string, removed: Web[]) {
  const file = path.join(dir, "pnpm-workspace.yaml");
  if (!existsSync(file)) return;

  let text = readFileSync(file, "utf8");
  for (const web of removed) text = text.replace(new RegExp(`^[ \\t]*"@mismo/${web}":.*\\n`, "m"), "");
  writeFileSync(file, text);
}

/**
 * The README, to match: the apps left, and no step to copy the starter. Best effort: a README that
 * no longer has these lines is left as it is.
 */
function readme(dir: string, { web, native, name }: Choices) {
  const file = path.join(dir, "README.md");
  if (!existsSync(file)) return;

  const kept: Record<string, boolean> = { native, next: web.includes("next"), tanstack: web.includes("tanstack") };
  const titles: Record<string, string> = { native: "Expo", next: "Next.js", tanstack: "TanStack Start" };
  const lines = readFileSync(file, "utf8").split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // The apps in the folder tree: drop the removed ones, and end the list on its last one.
    if (/^[├└]── (native|next|tanstack)\b/.test(line)) {
      const group: string[] = [];
      for (; i < lines.length && /^[├└]── (native|next|tanstack)\b/.test(lines[i]!); i++) group.push(lines[i]!);
      i--;
      const left = group.filter((entry) => kept[/^[├└]── (\w+)/.exec(entry)![1]!]);
      out.push(...left.map((entry, index) => (index === left.length - 1 ? "└──" : "├──") + entry.slice(3)));
      continue;
    }

    const running = Object.entries(titles).find(([, title]) => line.startsWith(`- **${title}:**`));
    if (running && !kept[running[0]]) continue;

    if (/degit KrakenWagen\/mismo-starter/.test(line) || /^cd my-app\s*$/.test(line) || line.includes("(docs/removing-an-app.md)")) continue;

    out.push(line);
  }

  writeFileSync(file, out.join("\n").replace(/^# mismo starter\b/, `# ${name}`));
}

/** The starter's name for itself and its packages, as the project's: `@acme/app` is `@my-app/app`. */
function rename(dir: string, name: string) {
  const scope = `@${packageName(name)}`;

  for (const file of walk(dir)) {
    if (statSync(file).size > 1_000_000) continue;
    const buffer = readFileSync(file);
    if (buffer.includes(0)) continue; // not text

    const text = buffer.toString("utf8");
    const result = text.replaceAll(`${STARTER_SCOPE}/`, `${scope}/`).replaceAll(STARTER_NAME, packageName(name));
    if (result !== text) writeFileSync(file, result);
  }
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

const SKIPPED = new Set(["node_modules", ".git"]);

/** Every file under a folder. */
function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    SKIPPED.has(entry.name) ? [] : entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  );
}

function edit(dir: string, file: string, change: (text: string) => string) {
  const target = path.join(dir, file);
  if (!existsSync(target)) throw missing(file);
  const text = readFileSync(target, "utf8");
  const result = change(text);
  if (result !== text) writeFileSync(target, result);
}

function editJson(dir: string, file: string, change: (json: Record<string, unknown>) => void) {
  edit(dir, file, (text) => {
    const json = JSON.parse(text) as Record<string, unknown>;
    change(json);
    return `${JSON.stringify(json, null, 2)}\n`;
  });
}

/** A replacement that has to happen: the starter has changed shape if what it replaces isn't there. */
function replaceOnce(text: string, pattern: RegExp, replacement: string | ((substring: string, ...groups: string[]) => string), what: string): string {
  if (!pattern.test(text)) throw missing(what);
  return text.replace(pattern, replacement as string);
}

function missing(what: string): Error {
  return new Error(
    `The starter doesn't look as this version of create-mismo expects: couldn't find ${what}. Update create-mismo (pnpm create mismo@latest), or report it at https://github.com/KrakenWagen/mismo/issues.`,
  );
}
