import { type Dirent, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { expo } from "@mismo/expo";
import { tanstack } from "@mismo/tanstack";
import { pagesOf, type Target } from "@mismo/core/adapter";
import { generateAppRoutes, generateTypes, loadRoutesConfig, resolveRoutesConfig } from "@mismo/core/generate";

const component = "export default function Screen() { return null; }\n";

/** A temp folder with these files. */
function folder(files: string[], content = component): string {
  const dir = mkdtempSync(path.join(tmpdir(), "routes-"));
  for (const file of files) put(dir, file, content);
  return dir;
}

function put(dir: string, file: string, content = component) {
  mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  writeFileSync(path.join(dir, file), content);
}

/** Every file under `dir`, relative and sorted. */
function list(dir: string): string[] {
  return (readdirSync(dir, { recursive: true, withFileTypes: true }) as Dirent[])
    .filter((e) => e.isFile())
    .map((e) => path.relative(dir, path.join(e.parentPath, e.name)))
    .sort();
}

const readFile = (dir: string, file: string) => readFileSync(path.join(dir, file), "utf8");

const shared = [
  "index.tsx",
  "(auth)/sign-in.tsx",
  "(app)/_layout.tsx",
  "(app)/home.tsx",
  "(app)/orgs/[id].tsx",
  "pricing.web.tsx",
  "camera.native.tsx",
];

/** The shared config for a routes folder, as `routes.config.ts` would give it: valid for both routers. */
const configOf = (source: string, types: { shared?: string; web?: string; native?: string } = {}, validFor = [tanstack, expo]) =>
  resolveRoutesConfig({ source, input: expo.input(), validFor, types }, source);

const read = (source: string, target: Target) => expo.input().read(source, target);

describe("the Expo input", () => {
  const dir = folder(shared);
  const pages = (target: Target) =>
    pagesOf(read(dir, target))
      .map((p) => p.route.id)
      .sort();

  it("keeps a platform file's route on its platform only", () => {
    expect(pages("web")).toContain("pricing");
    expect(pages("web")).not.toContain("camera");
    expect(pages("native")).toContain("camera");
    expect(pages("native")).not.toContain("pricing");
    expect(pages("shared")).toEqual(["(app)/home", "(app)/orgs/[id]", "(auth)/sign-in", "index"]);
  });

  it("imports a platform file by name when there is no plain one", () => {
    const page = (target: Target, id: string) => pagesOf(read(dir, target)).find((p) => p.route.id === id)!.route;
    expect(page("web", "pricing").file).toBe(path.join(dir, "pricing.web"));
    expect(page("native", "camera").file).toBe(path.join(dir, "camera.native"));
    expect(page("native", "(app)/home").file).toBe(path.join(dir, "(app)/home"));
  });

  it("builds the tree with Expo Router's parser: layouts, groups, index pages, and :params", () => {
    const routes = read(dir, "web");
    const app = routes.find((r) => r.id === "(app)/_layout")!;

    expect(app).toMatchObject({ layout: true, segments: ["(app)"] });
    expect(app.path).toBeUndefined();
    expect(app.children?.map((c) => [c.id, c.path, c.segments])).toEqual(
      expect.arrayContaining([
        ["(app)/home", "home", ["home"]],
        ["(app)/orgs/[id]", "orgs/:id", ["orgs", ":id"]],
      ]),
    );
    expect(routes.find((r) => r.id === "index")).toMatchObject({ index: true, segments: ["index"] });
  });

  it("refuses a root layout, and what this stage does not support", () => {
    expect(() => read(folder(["_layout.tsx"]), "web")).toThrow(/root layout belongs to each app/);
    expect(() => read(folder(["[...rest].tsx"]), "web")).toThrow(/catch-all routes are not supported yet/);
    expect(() => read(folder(["+not-found.tsx"]), "web")).toThrow(/routes are not supported yet/);
  });
});

describe("loadRoutesConfig", () => {
  it("reads routes.config.ts, with paths relative to it", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "config-"));
    const mismo = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
    put(
      dir,
      "routes.config.ts",
      `import { defineRoutes } from "${mismo}/core/src/config/define.ts";
import { expo } from "${mismo}/expo/src/index.ts";
export default defineRoutes({ source: "./routes", input: expo.input(), types: { shared: "./src/routes.gen.ts" } });
`,
    );
    const config = loadRoutesConfig(path.join(dir, "routes.config.ts"));

    expect(config.source).toBe(path.join(dir, "routes"));
    expect(config.types.shared).toBe(path.join(dir, "src/routes.gen.ts"));
    expect(config.input.name).toBe("expo");
  });

  it("refuses a file that is not a routes config", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "config-"));
    put(dir, "routes.config.ts", "export default { source: './routes' };\n");
    expect(() => loadRoutesConfig(path.join(dir, "routes.config.ts"))).toThrow(/should export defineRoutes/);
  });
});

describe("generating routes", () => {
  it("writes TanStack Router's files next to the app's own: group layouts as route.tsx, $params", () => {
    const source = folder(shared);
    const out = mkdtempSync(path.join(tmpdir(), "out-"));
    put(out, "routes/__root.tsx", "// the app's root\n");
    put(out, "routes/(app)/device.tsx", "// the app's own\n");
    generateAppRoutes({ config: configOf(source), output: tanstack.output({ outDir: path.join(out, "routes"), types: path.join(out, "routes.gen.ts") }) });

    expect(list(path.join(out, "routes"))).toEqual([
      "(app)/device.tsx",
      "(app)/home.tsx",
      "(app)/orgs/$id.tsx",
      "(app)/route.tsx",
      "(auth)/sign-in.tsx",
      ".gitignore",
      "__root.tsx",
      "index.tsx",
      "pricing.tsx",
    ]);
    expect(readFile(out, "routes/(app)/orgs/$id.tsx")).toContain('createFileRoute("/(app)/orgs/$id")');
    expect(readFile(out, "routes/(app)/route.tsx")).toContain('createFileRoute("/(app)")');
    expect(readFile(out, "routes/index.tsx")).toContain('createFileRoute("/")');
    expect(readFile(out, "routes/pricing.tsx")).toContain(`from "${path.relative(path.join(out, "routes"), source)}/pricing.web"`);
    expect(readFile(out, "routes/(app)/device.tsx")).toBe("// the app's own\n");
  });

  it("passes a route's `tanstack` export into createFileRoute, and leaves it out when there is none", () => {
    const source = folder(["index.tsx"]);
    put(source, "(app)/_layout.tsx", 'export const tanstack = { ssr: false };\nexport default function Shell() { return null; }\n');
    const out = mkdtempSync(path.join(tmpdir(), "out-"));
    generateAppRoutes({ config: configOf(source), output: tanstack.output({ outDir: path.join(out, "routes"), types: path.join(out, "t.ts") }) });

    expect(readFile(out, "routes/(app)/route.tsx")).toContain('import Component, { tanstack } from');
    expect(readFile(out, "routes/(app)/route.tsx")).toContain('createFileRoute("/(app)")({ ...tanstack, component: Component })');
    expect(readFile(out, "routes/index.tsx")).toContain('createFileRoute("/")({ component: Component })');
  });

  it("writes Expo Router's files, and a .gitignore that lists them and itself, escaped", () => {
    const source = folder(shared);
    const out = mkdtempSync(path.join(tmpdir(), "out-"));
    generateAppRoutes({ config: configOf(source), output: expo.output({ outDir: path.join(out, "app"), types: path.join(out, "routes.gen.ts") }) });

    expect(readFile(out, "app/camera.tsx")).toContain('export { default } from "../');
    expect(readFile(out, "app/.gitignore").split("\n").filter((l) => l.startsWith("/"))).toEqual([
      "/.gitignore",
      "/(app)/_layout.tsx",
      "/(app)/home.tsx",
      "/(app)/orgs/\\[id\\].tsx",
      "/(auth)/sign-in.tsx",
      "/camera.tsx",
      "/index.tsx",
    ]);
  });

  it("writes the routes' types, and only what both platforms have for a shared package", () => {
    const out = mkdtempSync(path.join(tmpdir(), "out-"));
    generateTypes(configOf(folder(shared), { shared: path.join(out, "routes.gen.ts") }));
    const types = readFile(out, "routes.gen.ts");

    expect(types).toContain('"/orgs/[id]": { id: string };');
    expect(types).toContain('"/": Record<never, never>;');
    expect(types).not.toContain("pricing");
    expect(types).not.toContain("camera");
  });

  it("writes one platform's types for the shared package's platform files: shared routes plus that platform's", () => {
    const out = mkdtempSync(path.join(tmpdir(), "out-"));
    generateTypes(configOf(folder(shared), { native: path.join(out, "routes.native.gen.ts") }));
    const types = readFile(out, "routes.native.gen.ts");

    expect(types).toContain('"/camera": Record<never, never>;');
    expect(types).toContain('"/orgs/[id]": { id: string };');
    expect(types).not.toContain("pricing");
  });

  it("removes generated files for routes that are gone, and their emptied folders, but no hand-written file", () => {
    const source = folder(["index.tsx", "(app)/orgs/[id].tsx"]);
    const out = mkdtempSync(path.join(tmpdir(), "out-"));
    put(out, "app/_layout.tsx", "// the app's root\n");
    const options = { config: configOf(source), output: expo.output({ outDir: path.join(out, "app"), types: path.join(out, "t.ts") }) };

    generateAppRoutes(options);
    rmSync(path.join(source, "(app)"), { recursive: true });
    generateAppRoutes(options);

    expect(list(path.join(out, "app"))).toEqual([".gitignore", "_layout.tsx", "index.tsx"]);
  });

  it("refuses a shared route where the app has a hand-written file, and writes nothing", () => {
    const source = folder(["index.tsx", "about.tsx"]);
    const out = mkdtempSync(path.join(tmpdir(), "out-"));
    put(out, "app/about.tsx", "// the app's own\n");

    expect(() => generateAppRoutes({ config: configOf(source), output: expo.output({ outDir: path.join(out, "app"), types: path.join(out, "t.ts") }) })).toThrow(
      /about.tsx is hand-written/,
    );
    expect(list(path.join(out, "app"))).toEqual(["about.tsx"]);
    expect(readFile(out, "app/about.tsx")).toBe("// the app's own\n");
  });
});

describe("every router's rules, in every app's build", () => {
  const nativeApp = (source: string, validFor = [tanstack, expo]) => () =>
    generateAppRoutes({
      config: configOf(source, {}, validFor),
      output: expo.output({ outDir: path.join(mkdtempSync(path.join(tmpdir(), "out-")), "app"), types: path.join(tmpdir(), "t.ts") }),
    });

  it("refuses two pages at one URL in the native build, since TanStack Start would", () => {
    expect(nativeApp(folder(["(a)/about.tsx", "(b)/about.tsx"]))).toThrow(
      /\(b\)\/about: \/about is also \(a\)\/about, and TanStack Start allows one page per URL/,
    );
  });

  it("allows them when the routes are for Expo Router alone, which matches both", () => {
    expect(nativeApp(folder(["(a)/about.tsx", "(b)/about.tsx"]), [expo])).not.toThrow();
  });

  it("refuses a name TanStack Start would read as a path or a param, and lists every problem", () => {
    const build = nativeApp(folder(["v1.2.tsx", "$slug.tsx"]));
    expect(build).toThrow(/v1\.2: "v1\.2" has "\." or "\$", which TanStack Start reads/);
    expect(build).toThrow(/\$slug: "\$slug" has "\." or "\$"/);
  });

  it("checks a router's rules on the routes its platform has: a native-only duplicate is fine for TanStack", () => {
    expect(nativeApp(folder(["(a)/about.tsx", "(b)/about.native.tsx"]))).not.toThrow();
  });
});
