import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { exportedOptions, exportsName, isPlainValue, routeFiles, serverModule } from "@mismo/core/adapter";
import { generateAppRoutes, resolveRoutesConfig } from "@mismo/core/generate";
import { expo } from "@mismo/expo";
import { next } from "@mismo/next";
import { reactRouter } from "@mismo/react-router";
import { tanstack } from "@mismo/tanstack";
import { describe, expect, it } from "vitest";

const screen = "export default function Screen() { return null; }\n";

/** A routes folder from file contents; `null` is a plain screen. */
function folder(files: Record<string, string | null>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "routes-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content ?? screen);
  }
  return dir;
}

type Adapter = typeof next | typeof reactRouter | typeof tanstack;

/** Writes one app's routes for these files, and returns how to read them. */
function generate(adapter: Adapter, files: Record<string, string | null>) {
  const source = folder(files);
  const out = path.join(mkdtempSync(path.join(tmpdir(), "app-")), "routes");
  generateAppRoutes({
    config: resolveRoutesConfig({ source, input: expo.input(), validFor: [adapter, expo] }, source),
    output: adapter.output({ outDir: out, types: path.join(out, "..", "routes.gen.ts") }),
  });
  return (file: string) => readFileSync(path.join(out, file), "utf8");
}

describe("reading a route's options", () => {
  it("reads each property of an exported object, with its value's source", () => {
    const dir = folder({
      "orgs.tsx": `
        // export const next = { commented: true };
        export const next = {
          revalidate: 60,
          title: "a, b {c}",
          "quoted": [1, 2],
          async generateMetadata({ params }) { return { title: \`\${(await params).id}\` }; },
          shorthand,
        } satisfies Options;
      `,
    });
    const options = exportedOptions(path.join(dir, "orgs"), "next")!;
    expect([...options.keys()]).toEqual(["revalidate", "title", "quoted", "generateMetadata", "shorthand"]);
    expect(options.get("revalidate")).toBe("60");
    expect(options.get("title")).toBe('"a, b {c}"');
    expect(options.get("shorthand")).toBe("shorthand");
  });

  it("finds an export declared first and exported after, and knows when there's none", () => {
    const dir = folder({ "a.tsx": "const tanstack = { ssr: false };\nexport { tanstack };\n", "b.tsx": null });
    expect(exportsName(path.join(dir, "a"), "tanstack")).toBe(true);
    expect(exportedOptions(path.join(dir, "a"), "tanstack")!.get("ssr")).toBe("false");
    expect(exportsName(path.join(dir, "b"), "tanstack")).toBe(false);
    expect(exportedOptions(path.join(dir, "b"), "next")).toBeUndefined();
  });

  it("refuses options it can't read without running them", () => {
    const dir = folder({ "a.ts": "export const next = makeOptions();\n", "b.ts": "export const next = { ...base, revalidate: 1 };\n" });
    expect(() => exportedOptions(path.join(dir, "a"), "next")).toThrow(/should be an object written out/);
    expect(() => exportedOptions(path.join(dir, "b"), "next")).toThrow(/can't be read without running it/);
  });

  it("finds a route's server file, shared by its platform files, and never treats it as a route", () => {
    const dir = folder({ "pricing.tsx": null, "pricing.web.tsx": null, "pricing.server.ts": "export const next = {};\n" });
    expect(serverModule(path.join(dir, "pricing"))).toBe(path.join(dir, "pricing.server"));
    expect(serverModule(path.join(dir, "pricing.web"))).toBe(path.join(dir, "pricing.server"));
    expect([...routeFiles(dir).keys()]).toEqual(["pricing"]);
  });
});

describe("telling plain values from code", () => {
  it("accepts data that stands on its own", () => {
    for (const value of ['"Settings"', "60", "false", "null", '{ title: "a", robots: { index: false } }', '["iad1", "sfo1"]', "-1.5", '"force-static" as const']) {
      expect(isPlainValue(value), value).toBe(true);
    }
  });

  it("refuses names, calls, functions and templates with values", () => {
    for (const value of ["title", "getTitle()", "() => 1", "async () => ({})", "`${id}`", "{ ...base }", "{ title: org.name }"]) {
      expect(isPlainValue(value), value).toBe(false);
    }
  });
});

describe("route options on Next.js", () => {
  it("copies plain values from the route's module into the server page, without importing it", () => {
    const read = generate(next, {
      "settings.tsx": `${screen}export const next = { metadata: { title: "Settings" }, revalidate: 60 };`,
    });
    const page = read("settings/page.tsx");
    expect(page).toContain('export const metadata = { title: "Settings" };');
    expect(page).toContain("export const revalidate = 60;");
    expect(page).not.toMatch(/from ".*\/settings";/);
  });

  it("sends code in the route's module to its server file, and refuses an option set in both", () => {
    expect(() => generate(next, { "a.tsx": `${screen}export const next = { generateMetadata: async () => ({}) };` })).toThrow(
      /`next.generateMetadata` isn't a plain value.*Move it to the route's server file/,
    );
    expect(() => generate(next, { "a.tsx": `${screen}export const next = { metadata: { title: title } };` })).toThrow(/isn't a plain value/);
    expect(() =>
      generate(next, { "a.tsx": `${screen}export const next = { revalidate: 60 };`, "a.server.ts": "export const next = { revalidate: 30 };" }),
    ).toThrow(/`next.revalidate` is set in both/);
  });

  it("passes on the server file's options from the server component, segment config as literals", () => {
    const read = generate(next, {
      "orgs/[id].tsx": null,
      "orgs/[id].server.ts": `export const next = {
        revalidate: 60,
        dynamic: "force-static",
        preferredRegion: ["iad1", "sfo1"],
        metadata: { title: "Org" },
        async generateStaticParams() { return [{ id: "acme" }]; },
      };`,
    });
    const page = read("orgs/[id]/page.tsx");

    expect(page).toMatch(/import \{ next \} from ".*\/orgs\/\[id\]\.server";/);
    expect(page).toContain("export const metadata = next.metadata;");
    expect(page).toContain("export const generateStaticParams = next.generateStaticParams;");
    expect(page).toContain("export const revalidate = 60;");
    expect(page).toContain('export const dynamic = "force-static";');
    expect(page).toContain('export const preferredRegion = ["iad1", "sfo1"];');
    expect(page).not.toContain('"use client"');
  });

  it("refuses config Next.js couldn't read, and options it doesn't have", () => {
    expect(() => generate(next, { "a.tsx": null, "a.server.ts": "export const next = { revalidate: 60 * 10 };" })).toThrow(
      /`next.revalidate` must be a literal/,
    );
    expect(() => generate(next, { "a.tsx": null, "a.server.ts": "export const next = { loader: () => 1 };" })).toThrow(
      /`next.loader` isn't a Next.js route option/,
    );
  });
});

describe("route options on React Router", () => {
  it("passes on the module's browser options and the server file's server options, as route exports", () => {
    const read = generate(reactRouter, {
      "orgs.tsx": `export default function Orgs() { return null; }
        export const reactRouter = { meta: () => [{ title: "Orgs" }], handle: { crumb: "Orgs" } };`,
      "orgs.server.ts": "export const reactRouter = { loader: async () => ({ orgs: [] }) };",
    });
    const route = read("orgs.tsx");

    expect(route).toMatch(/import Component, \{ reactRouter \} from ".*\/orgs";/);
    expect(route).toMatch(/import \{ reactRouter as server \} from ".*\/orgs\.server";/);
    expect(route).toContain("export default Component;");
    expect(route).toContain("export const meta = reactRouter.meta;");
    expect(route).toContain("export const handle = reactRouter.handle;");
    expect(route).toContain("export const loader = server.loader;");
  });

  it("keeps a plain route a plain re-export", () => {
    expect(generate(reactRouter, { "about.tsx": null })("about.tsx")).toMatch(/^\/\/ Generated by mismo.*\nexport \{ default \} from ".*\/about";\n$/);
  });

  it("refuses server code in the module, where the native app would bundle it, and the reverse", () => {
    expect(() => generate(reactRouter, { "a.tsx": `${screen}export const reactRouter = { loader: () => 1 };` })).toThrow(
      /`reactRouter.loader` runs on the server. Move it to the route's server file/,
    );
    expect(() => generate(reactRouter, { "a.tsx": null, "a.server.ts": "export const reactRouter = { meta: () => [] };" })).toThrow(
      /`reactRouter.meta` runs in the browser/,
    );
  });
});

describe("route options on TanStack Start", () => {
  it("spreads the module's options into the route", () => {
    const read = generate(tanstack, { "shell.tsx": `${screen}export const tanstack = { ssr: false };` });
    expect(read("shell.tsx")).toContain("import Component, { tanstack } from");
    expect(read("shell.tsx")).toContain("({ ...tanstack, component: Component })");
  });
});
