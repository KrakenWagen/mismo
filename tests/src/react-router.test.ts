import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { expo } from "@mismo/expo";
import { reactRouter } from "@mismo/react-router";
import { generateAppRoutes, resolveRoutesConfig } from "@mismo/core/generate";
import { describe, expect, it } from "vitest";

const component = "export default function Screen() { return null; }\n";

function folder(files: string[]): string {
  const dir = mkdtempSync(path.join(tmpdir(), "routes-"));
  for (const file of files) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), component);
  }
  return dir;
}

/** Writes the React Router app's routes for these files, and returns its output folder. */
function generate(files: string[], validFor = [reactRouter, expo]) {
  const source = folder(files);
  const out = path.join(mkdtempSync(path.join(tmpdir(), "app-")), "mismo");
  generateAppRoutes({
    config: resolveRoutesConfig({ source, input: expo.input(), validFor }, source),
    output: reactRouter.output({ outDir: out, types: path.join(out, "..", "routes.gen.ts") }),
  });
  return { source, out, read: (file: string) => readFileSync(path.join(out, file), "utf8") };
}

describe("the React Router output", () => {
  it("lists the routes with React Router's helpers: index, pathless layouts, :params, stable ids", () => {
    const { read } = generate(["index.tsx", "(app)/_layout.tsx", "(app)/orgs/[id].tsx", "(app)/orgs/index.tsx"]);
    const routes = read("routes.ts");

    expect(routes).toContain('const { route, layout, index } = relative(import.meta.dirname);');
    expect(routes).toContain('index("./index.tsx", { id: "mismo/index" })');
    expect(routes).toContain('layout("./(app)/_layout.tsx", { id: "mismo/(app)/_layout" }, [');
    expect(routes).toContain('route("orgs/:id", "./(app)/orgs/[id].tsx", { id: "mismo/(app)/orgs/[id]" })');
    // A folder's own page without a layout of its own is a page at the folder's URL, not an index.
    expect(routes).toContain('route("orgs", "./(app)/orgs/index.tsx", { id: "mismo/(app)/orgs/index" })');
  });

  it("writes a file per route that re-exports its module, the web file where there is one", () => {
    const { source, read } = generate(["pricing.web.tsx", "camera.native.tsx"]);

    expect(read("pricing.tsx")).toMatch(/export \{ default \} from ".*\/pricing\.web";/);
    expect(read("routes.ts")).toContain('route("pricing", "./pricing.tsx"');
    expect(read("routes.ts")).not.toContain("camera");
  });

  it("refuses two pages at one URL, which React Router would never reach the second of", () => {
    expect(() => generate(["(a)/about.tsx", "(b)/about.tsx"])).toThrow(/about is also \(a\)\/about, and React Router allows one page per URL/);
  });
});

describe("the React Router input", () => {
  /** A React Router config, as plain entries, beside the route files it names. */
  function config(files: string[], routes: string) {
    const dir = folder(files);
    writeFileSync(path.join(dir, "routes.ts"), `export default ${routes};\n`);
    return path.join(dir, "routes.ts");
  }

  const routes = `[
    { index: true, file: "home.tsx" },
    { file: "dashboard.tsx", children: [
      { path: "orgs/:id", file: "org.tsx" },
      { path: "settings", file: "settings.tsx" },
    ] },
    { path: "camera", file: "camera.tsx" },
  ]`;
  const files = ["home.tsx", "dashboard.tsx", "org.tsx", "settings.tsx", "settings.native.tsx", "camera.native.tsx"];

  it("reads the config into the model: a pathless layout is a group named after its file", () => {
    const source = config(files, routes);
    const web = reactRouter.input().read(source, "web");

    expect(web.map((r) => r.id)).toEqual(["home", "dashboard"]);
    expect(web[1]).toMatchObject({ layout: true, segments: ["(dashboard)"] });
    expect(web[1]?.children?.map((c) => [c.path, c.segments])).toEqual([
      ["orgs/:id", ["orgs", ":id"]],
      ["settings", ["settings"]],
    ]);
  });

  it("takes platform files beside a route's file, and leaves out a route a platform has no file for", () => {
    const source = config(files, routes);
    const native = reactRouter.input().read(source, "native");
    const dir = path.dirname(source);

    expect(native.map((r) => r.id)).toEqual(["home", "dashboard", "camera"]);
    expect(native[1]?.children?.find((c) => c.id === "settings")?.file).toBe(path.join(dir, "settings"));
    expect(native[2]?.file).toBe(path.join(dir, "camera.native"));
    expect(reactRouter.input().read(source, "web").map((r) => r.id)).not.toContain("camera");
  });

  it("writes Expo Router's files from it, and types in React Router's spelling", () => {
    const source = config(files, routes);
    const out = mkdtempSync(path.join(tmpdir(), "app-"));
    const typesFile = path.join(out, "routes.gen.ts");
    generateAppRoutes({
      config: resolveRoutesConfig({ source, input: reactRouter.input(), validFor: [expo, reactRouter] }, path.dirname(source)),
      output: expo.output({ outDir: path.join(out, "app"), types: typesFile }),
    });

    expect(readFileSync(path.join(out, "app/(dashboard)/orgs/[id].tsx"), "utf8")).toMatch(/from ".*\/org";/);
    expect(readFileSync(path.join(out, "app/(dashboard)/_layout.tsx"), "utf8")).toMatch(/from ".*\/dashboard";/);
    expect(readFileSync(typesFile, "utf8")).toContain('"/orgs/:id": { id: string };');
  });

  it("refuses what the model cannot hold yet", () => {
    expect(() => reactRouter.input().read(config(["a.tsx"], '[{ path: "files/*", file: "a.tsx" }]'), "web")).toThrow(/splats and optional segments/);
  });
});
