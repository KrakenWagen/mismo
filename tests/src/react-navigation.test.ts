import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { createNavigatorFactory, createPathConfigForStaticNavigation, getStateFromPath } from "@react-navigation/core";
import { transformSync } from "esbuild";
import { describe, expect, it } from "vitest";

import { expo } from "@mismo/expo";
import { reactNavigation } from "@mismo/react-navigation";
import { generateAppRoutes, resolveRoutesConfig } from "@mismo/core/generate";

import { paramsAlong } from "../../packages/react-navigation/src/params.ts";

const component = "export default function Screen() { return null; }\n";

/** A routes folder from files by path: a string is the file's source, `null` a plain screen. */
function folder(files: Record<string, string | null>): string {
  const dir = mkdtempSync(path.join(tmpdir(), "routes-"));
  for (const [file, source] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), source === null ? component : `${component}${source}\n`);
  }
  return dir;
}

/** Writes the React Navigation app's routes for these files, and returns the folder they went to. */
function generate(files: Record<string, string | null>) {
  const source = folder(files);
  const out = path.join(mkdtempSync(path.join(tmpdir(), "app-")), "navigation");
  generateAppRoutes({
    config: resolveRoutesConfig({ source, input: expo.input(), validFor: [reactNavigation, expo] }, source),
    output: reactNavigation.output({ outDir: out, types: path.join(out, "routes.gen.ts") }),
  });
  return out;
}

const read = (out: string) => readFileSync(path.join(out, "routes.tsx"), "utf8");

/**
 * Runs the generated `routes.tsx` (and the route modules it imports) with React Navigation's own
 * navigator factory standing in for the native one, so its screens and linking paths are exactly
 * what the app would build. Returns the `Root` navigator.
 */
function load(out: string) {
  const dummy = createNavigatorFactory(() => null);
  const stubs: Record<string, unknown> = {
    "react/jsx-runtime": { jsx: () => null, jsxs: () => null },
    "@react-navigation/native": { createStaticNavigation: (tree: unknown) => tree },
    "@react-navigation/native-stack": { createNativeStackNavigator: (config: never) => dummy(config) },
    "@react-navigation/bottom-tabs": { createBottomTabNavigator: (config: never) => dummy(config) },
    "@react-navigation/drawer": { createDrawerNavigator: (config: never) => dummy(config) },
    "@mismo/react-navigation/runtime": { SlotChildren: () => null },
  };

  const run = (file: string): Record<string, unknown> => {
    const { code } = transformSync(readFileSync(file, "utf8"), { loader: "tsx", jsx: "automatic", format: "cjs" });
    const module = { exports: {} as Record<string, unknown> };
    const require = (id: string) => {
      if (id in stubs) return stubs[id];
      const target = path.resolve(path.dirname(file), id);
      const found = ["", ".tsx", ".ts"].map((ext) => target + ext).find((candidate) => existsSync(candidate) && candidate.includes("."));
      if (!found) throw new Error(`Cannot find ${id} from ${file}`);
      return run(found);
    };
    new Function("require", "module", "exports", code)(require, module, module.exports);
    return module.exports;
  };

  return run(path.join(out, "routes.tsx")).Root as Parameters<typeof createPathConfigForStaticNavigation>[0];
}

/** The screens React Navigation opens for a URL, outermost first, and the params a screen there reads. */
function open(out: string, url: string) {
  const root = load(out);
  const state = getStateFromPath(url, { screens: createPathConfigForStaticNavigation(root, undefined, false)! });
  const names: string[] = [];
  for (let route = state?.routes.at(-1) as { name: string; state?: { routes: unknown[] } } | undefined; route; ) {
    names.push(route.name);
    route = route.state?.routes.at(-1) as typeof route;
  }
  return { names, params: paramsAlong(state, undefined) };
}

describe("the React Navigation runtime", () => {
  it("reads the params of the whole URL: the layouts around a screen, then the screen", () => {
    const state = {
      routes: [{ params: { id: "acme", screen: "members" }, state: { routes: [{ params: { tab: "all", id: "other" } }] } }],
    };

    // The screen's own params win, and the keys React Navigation opens screens with are not the URL's.
    expect(paramsAlong(state, { tab: "admins" })).toEqual({ id: "other", tab: "admins" });
    expect(paramsAlong(undefined, { id: "1" })).toEqual({ id: "1" });
    expect(paramsAlong(undefined, undefined)).toEqual({});
  });
});

describe("the React Navigation output", () => {
  const files = {
    "index.tsx": null,
    "(app)/_layout.tsx": null,
    "(app)/settings.tsx": null,
    "(app)/orgs/[id].tsx": null,
    "(app)/orgs/index.tsx": null,
    "pricing.native.tsx": null,
  };

  it("writes one routes.tsx: a navigator per layout, a screen per page, each with its URL", () => {
    const text = read(generate(files));

    expect(text).toContain('import { createNativeStackNavigator } from "@react-navigation/native-stack";');
    expect(text).toContain('import { SlotChildren } from "@mismo/react-navigation/runtime";');
    expect(text).toMatch(/const Navigator\d+ = createNativeStackNavigator\(\{\n  layout: \(\{ children \}\) => \(/);
    expect(text).toContain('"index": { screen: Route0, linking: { path: "" } }');
    // A group's layout has no URL of its own.
    expect(text).toMatch(/"\(app\)\/_layout": \{ screen: Navigator\d+ \}/);
    expect(text).toContain('"(app)/orgs/[id]": { screen: Route4, linking: { path: "orgs/:id" } }');
    expect(text).toContain("export const Root = createNativeStackNavigator({");
    expect(text).toContain("export function Navigation(");
    expect(text).not.toContain("bottom-tabs");
  });

  it("opens the screen of a URL, a layout around it, with the params", () => {
    const out = generate(files);

    expect(open(out, "/")).toEqual({ names: ["index"], params: {} });
    expect(open(out, "/settings").names).toEqual(["(app)/_layout", "(app)/settings"]);
    expect(open(out, "/orgs")).toMatchObject({ names: ["(app)/_layout", "(app)/orgs/index"] });
    expect(open(out, "/orgs/acme")).toEqual({ names: ["(app)/_layout", "(app)/orgs/[id]"], params: { id: "acme" } });
    expect(open(out, "/pricing").names).toEqual(["pricing"]);
  });

  it("takes names other routers read differently: a dot, a leading underscore", () => {
    const out = generate({ "v1.2.tsx": null, "_draft.tsx": null, "docs/[slug].tsx": null });

    expect(open(out, "/v1.2").names).toEqual(["v1.2"]);
    expect(open(out, "/_draft").names).toEqual(["_draft"]);
    expect(open(out, "/docs/a.b")).toEqual({ names: ["docs/[slug]"], params: { slug: "a.b" } });
  });

  it("nests a layout inside a layout, and keeps a layout's own path", () => {
    const out = generate({ "orgs/_layout.tsx": null, "orgs/[id]/_layout.tsx": null, "orgs/[id]/members.tsx": null, "orgs/index.tsx": null });

    expect(open(out, "/orgs").names).toEqual(["orgs/_layout", "orgs/index"]);
    expect(open(out, "/orgs/acme/members")).toEqual({ names: ["orgs/_layout", "orgs/[id]/_layout", "orgs/[id]/members"], params: { id: "acme" } });
  });

  it("turns a layout into tabs or a drawer, and passes on the screen and navigator options", () => {
    const out = generate({
      "(tabs)/_layout.tsx": `export const reactNavigation = {
        navigator: "tabs",
        screenOptions: { tabBarLabel: "x" },
        initialRouteName: "(tabs)/home",
        options: { title: "Tabs" },
      };`,
      "(tabs)/home.tsx": `export const reactNavigation = { options: { title: "Home" }, initialParams: { a: "1" } };`,
      "(tabs)/inbox.tsx": null,
      "(menu)/_layout.tsx": `export const reactNavigation = { navigator: "drawer" };`,
      "(menu)/help.tsx": null,
    });
    const text = read(out);

    expect(text).toContain('import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";');
    expect(text).toContain('import { createDrawerNavigator } from "@react-navigation/drawer";');
    expect(text).toMatch(/createBottomTabNavigator\(\{[\s\S]*screenOptions: \{ headerShown: false, \.\.\.Options\d+\.screenOptions \},\n  initialRouteName: Options\d+\.initialRouteName,/);
    expect(text).toMatch(/"\(tabs\)\/home": \{ screen: Route\d+, linking: \{ path: "home" \}, options: Options\d+\.options, initialParams: Options\d+\.initialParams \}/);
    expect(text).toMatch(/"\(tabs\)\/_layout": \{ screen: Navigator\d+, options: Options\d+\.options \}/);
    expect(open(out, "/home").names).toEqual(["(tabs)/_layout", "(tabs)/home"]);
    expect(open(out, "/help").names).toEqual(["(menu)/_layout", "(menu)/help"]);
  });

  it("refuses options it can't read, or doesn't have, and two pages at one URL", () => {
    expect(() => generate({ "a.tsx": `export const reactNavigation = { navigator: "tabs" };` })).toThrow(/`reactNavigation.navigator` isn't a React Navigation option for a page/);
    expect(() => generate({ "a/_layout.tsx": `export const reactNavigation = { navigator: pick() };`, "a/b.tsx": null })).toThrow(/navigator/);
    expect(() => generate({ "a/_layout.tsx": `export const reactNavigation = { navigator: "wheel" };`, "a/b.tsx": null })).toThrow(
      /must be "stack", "tabs" or "drawer", written as a literal/,
    );
    expect(() => generate({ "a.tsx": `export const reactNavigation = { loader: 1 };` })).toThrow(/`reactNavigation.loader` isn't a React Navigation option/);
    expect(() => generate({ "(a)/about.tsx": null, "(b)/about.tsx": null })).toThrow(/about is also .*React Navigation allows one page per URL/s);
  });
});
