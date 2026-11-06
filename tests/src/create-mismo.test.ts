import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseArguments } from "../../packages/create-mismo/src/args.ts";
import { customize, packageName, type Web } from "../../packages/create-mismo/src/customize.ts";

/** The parts of the starter that pruning reads and edits, as small files. */
const starter: Record<string, string> = {
  "package.json": JSON.stringify(
    {
      name: "mismo-starter",
      private: true,
      scripts: {
        dev: 'pnpm --parallel --filter "./apps/*" dev',
        next: "pnpm --filter @acme/next dev",
        tanstack: "pnpm --filter @acme/tanstack dev",
        native: "pnpm --filter @acme/native start",
        typecheck: "pnpm -r typecheck",
        build: "pnpm --filter @acme/next --filter @acme/tanstack build",
      },
    },
    null,
    2,
  ),
  "pnpm-workspace.yaml": `packages:
  - "apps/*"
overrides:
  react: 19.3.0
  "@mismo/core": file:.local-mismo/mismo-core-0.1.0-beta.1.tgz
  "@mismo/expo": file:.local-mismo/mismo-expo-0.1.0-beta.1.tgz
  "@mismo/next": file:.local-mismo/mismo-next-0.1.0-beta.1.tgz
  "@mismo/tanstack": file:.local-mismo/mismo-tanstack-0.1.0-beta.1.tgz
onlyBuiltDependencies:
  - esbuild
`,
  "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
  "docs/removing-an-app.md": "# Keep only the apps you need\n",
  "README.md": `# mismo starter

Intro.

\`\`\`
apps
├── native                # Expo app
├── next                  # Next.js app
└── tanstack              # TanStack Start app
packages
└── app                   # Shared by every app
\`\`\`

## Quick start

\`\`\`sh
pnpm dlx degit KrakenWagen/mismo-starter my-app  # Copy the starter
pnpm create mismo my-app                         # Or: pick your apps
cd my-app
pnpm install                                     # Install dependencies
pnpm dev                                         # Start every app
\`\`\`

Your apps are now running:

- **Next.js:** http://localhost:3000
- **TanStack Start:** http://localhost:3001
- **Expo:** the bundler is on port 8081.

## Learn more

- [Keep only the apps you need](docs/removing-an-app.md)
- [mismo docs](https://mismo.dev)
`,
  "apps/next/package.json": JSON.stringify({ name: "@acme/next", dependencies: { "@acme/app": "workspace:*" } }),
  "apps/tanstack/package.json": JSON.stringify({ name: "@acme/tanstack", dependencies: { "@acme/app": "workspace:*" } }),
  "apps/native/package.json": JSON.stringify({ name: "@acme/native", dependencies: { "@acme/app": "workspace:*" } }),
  "apps/native/app.json": JSON.stringify({ expo: { slug: "mismo-starter" } }),
  "packages/app/package.json": JSON.stringify(
    {
      name: "@acme/app",
      dependencies: {
        "@mismo/core": "0.1.0-beta.1",
        "@mismo/expo": "0.1.0-beta.1",
        "@mismo/next": "0.1.0-beta.1",
        "@mismo/tanstack": "0.1.0-beta.1",
        "@react-native-async-storage/async-storage": "2.2.0",
        "react-strict-dom": "^0.0.55",
      },
      devDependencies: { "expo-router": "~58.0.29", react: "19.3.0", "react-native": "0.88.1", "react-native-safe-area-context": "~5.11.1" },
    },
    null,
    2,
  ),
  "packages/app/routes.config.ts": `import { defineRoutes } from "@mismo/core/config";
import { expo } from "@mismo/expo";
import { next } from "@mismo/next";
import { tanstack } from "@mismo/tanstack";

export default defineRoutes({
  source: "./routes",
  input: expo.input(),
  validFor: [expo, next, tanstack],
  types: {
    shared: "./src/routes.gen.ts",
    web: "./src/routes.web.gen.ts",
    native: "./src/routes.native.gen.ts",
  },
});
`,
  "packages/app/tsconfig.json": `{
  "files": [],
  "references": [{ "path": "./tsconfig.shared.json" }, { "path": "./tsconfig.native.json" }, { "path": "./tsconfig.web.json" }]
}
`,
  "packages/app/tsconfig.native.json": "{}\n",
  "packages/app/routes/(app)/(tabs)/index.tsx": `import type { NextRouteOptions } from "@mismo/next";
import type { TanstackRouteOptions } from "@mismo/tanstack";
import { html } from "react-strict-dom";

export const next = { metadata: { title: "Notes" } } satisfies NextRouteOptions;
export const tanstack = { head: () => ({ meta: [{ title: "Notes" }] }) } satisfies TanstackRouteOptions;

export default function Home() {
  return <html.main />;
}
`,
  "packages/app/routes/(app)/_layout.native.tsx": "export default function Layout() { return null; }\n",
  "packages/app/routes/(app)/_layout.web.tsx": 'import { Slot } from "@acme/app";\nexport default function Layout() { return <Slot />; }\n',
  "packages/app/src/notes/storage.native.ts": 'export const KEY = "mismo-starter-notes";\n',
  "packages/app/src/notes/storage.web.ts": 'export const KEY = "mismo-starter-notes";\n',
};

/** A copy of the starter's files, ready to be customized. */
function copyOfStarter(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "starter-"));
  for (const [file, content] of Object.entries(starter)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

const read = (dir: string, file: string) => readFileSync(path.join(dir, file), "utf8");
const has = (dir: string, file: string) => existsSync(path.join(dir, file));

describe("customizing the starter", () => {
  it("keeps one web app and no native app: removes the rest, and the code for it", () => {
    const dir = copyOfStarter();
    customize(dir, { name: "my-app", web: ["next"], native: false });

    expect(has(dir, "apps/next")).toBe(true);
    expect(has(dir, "apps/tanstack")).toBe(false);
    expect(has(dir, "apps/native")).toBe(false);

    const root = JSON.parse(read(dir, "package.json"));
    expect(root.name).toBe("my-app");
    expect(Object.keys(root.scripts)).toEqual(["dev", "next", "typecheck", "build"]);
    expect(root.scripts.next).toBe("pnpm --filter @my-app/next dev");
    expect(root.scripts.build).toBe("pnpm --filter @my-app/next build");

    const config = read(dir, "packages/app/routes.config.ts");
    expect(config).toContain('import { next } from "@mismo/next";');
    expect(config).toContain("validFor: [expo, next],");
    expect(config).not.toMatch(/tanstack|native/);

    const shared = JSON.parse(read(dir, "packages/app/package.json"));
    expect(shared.name).toBe("@my-app/app");
    expect(Object.keys(shared.dependencies)).toEqual(["@mismo/core", "@mismo/expo", "@mismo/next", "react-strict-dom"]);
    expect(Object.keys(shared.devDependencies)).toEqual(["react"]);

    const route = read(dir, "packages/app/routes/(app)/(tabs)/index.tsx");
    expect(route).toContain('export const next = { metadata: { title: "Notes" } } satisfies NextRouteOptions;');
    expect(route).not.toMatch(/tanstack|Tanstack/);

    expect(has(dir, "packages/app/routes/(app)/_layout.native.tsx")).toBe(false);
    expect(has(dir, "packages/app/src/notes/storage.native.ts")).toBe(false);
    expect(has(dir, "packages/app/routes/(app)/_layout.web.tsx")).toBe(true);
    expect(has(dir, "packages/app/tsconfig.native.json")).toBe(false);
    expect(JSON.parse(read(dir, "packages/app/tsconfig.json")).references).toEqual([
      { path: "./tsconfig.shared.json" },
      { path: "./tsconfig.web.json" },
    ]);

    const workspace = read(dir, "pnpm-workspace.yaml");
    expect(workspace).toContain('"@mismo/next"');
    expect(workspace).toContain('"@mismo/expo"');
    expect(workspace).not.toContain("tanstack");
  });

  it("keeps the other web app and the native app", () => {
    const dir = copyOfStarter();
    customize(dir, { name: "my-app", web: ["tanstack"], native: true });

    expect(has(dir, "apps/tanstack")).toBe(true);
    expect(has(dir, "apps/native")).toBe(true);
    expect(has(dir, "apps/next")).toBe(false);
    expect(read(dir, "packages/app/routes.config.ts")).toContain("validFor: [expo, tanstack],");
    expect(read(dir, "packages/app/routes.config.ts")).toContain("native:");
    expect(JSON.parse(read(dir, "package.json")).scripts).toMatchObject({ tanstack: expect.any(String), native: expect.any(String) });
    expect(has(dir, "packages/app/routes/(app)/_layout.native.tsx")).toBe(true);
    expect(JSON.parse(read(dir, "packages/app/package.json")).devDependencies).toHaveProperty("react-native");
    expect(read(dir, "packages/app/routes/(app)/(tabs)/index.tsx")).not.toContain("NextRouteOptions");
  });

  it("keeps everything, and still renames it, and drops the lockfile for the starter's names", () => {
    const dir = copyOfStarter();
    customize(dir, { name: "My App", web: ["next", "tanstack"], native: true });

    expect(JSON.parse(read(dir, "package.json")).scripts.build).toBe("pnpm --filter @my-app/next --filter @my-app/tanstack build");
    expect(read(dir, "packages/app/routes.config.ts")).toContain("validFor: [expo, next, tanstack],");
    expect(read(dir, "apps/native/package.json")).toContain("@my-app/app");
    expect(read(dir, "apps/native/app.json")).toContain('"slug":"my-app"');
    expect(read(dir, "packages/app/src/notes/storage.web.ts")).toContain("my-app-notes");
    expect(read(dir, "packages/app/routes/(app)/_layout.web.tsx")).toContain('from "@my-app/app"');
    expect(has(dir, "pnpm-lock.yaml")).toBe(false);
    expect(has(dir, "docs")).toBe(false);
  });

  it("matches the README to the apps left, and drops the steps for copying the starter", () => {
    const dir = copyOfStarter();
    customize(dir, { name: "my-app", web: ["tanstack"], native: false });
    const readme = read(dir, "README.md");

    expect(readme.startsWith("# my-app\n")).toBe(true);
    expect(readme).toContain("apps\n└── tanstack              # TanStack Start app\npackages");
    expect(readme).not.toMatch(/native {16}|next {18}/);
    expect(readme).toContain("- **TanStack Start:** http://localhost:3001");
    expect(readme).not.toMatch(/\*\*Next\.js:\*\*|\*\*Expo:\*\*/);
    expect(readme).not.toMatch(/degit|create mismo|cd my-app|removing-an-app/);
    expect(readme).toContain("pnpm install");
    expect(readme).toContain("[mismo docs](https://mismo.dev)");

    const both = copyOfStarter();
    customize(both, { name: "my-app", web: ["next", "tanstack"], native: false });
    expect(read(both, "README.md")).toContain("apps\n├── next                  # Next.js app\n└── tanstack              # TanStack Start app\n");
  });

  it("stops, and says so, when the starter isn't the shape it expects", () => {
    const dir = copyOfStarter();
    writeFileSync(path.join(dir, "packages/app/routes.config.ts"), "export default {};\n");

    expect(() => customize(dir, { name: "my-app", web: ["next"], native: true })).toThrow(/couldn't find its tanstack import/);
  });

  it("names a project's packages from its folder", () => {
    expect(packageName("my-app")).toBe("my-app");
    expect(packageName("My App_2")).toBe("my-app-2");
    expect(packageName("--weird--")).toBe("weird");
    expect(packageName("***")).toBe("");
  });
});

describe("the command line", () => {
  it("reads a name, the web apps, and what to skip", () => {
    expect(parseArguments(["my-app", "--web", "next", "--no-native", "--no-install", "--no-git", "-y"])).toEqual({
      help: false,
      yes: true,
      name: "my-app",
      web: ["next"],
      native: false,
      install: false,
      git: false,
    });
    expect(parseArguments(["--web", "both"]).web).toEqual(["next", "tanstack"]);
    expect(parseArguments(["--web", "tanstack,next"]).web).toEqual(["next", "tanstack"]);
    expect(parseArguments(["--web", "tanstack", "--web", "next"]).web).toEqual(["next", "tanstack"]);
    expect(parseArguments(["--native"]).native).toBe(true);
    expect(parseArguments(["--template", "owner/repo#v1"]).template).toBe("owner/repo#v1");
    expect(parseArguments([])).toEqual({ help: false, yes: false });
  });

  it("refuses what it doesn't know", () => {
    expect(() => parseArguments(["--web", "remix"])).toThrow(/--web takes next, tanstack or both, not "remix"/);
    expect(() => parseArguments(["a", "b"])).toThrow(/Expected one folder name/);
    expect(() => parseArguments(["--frobnicate"])).toThrow();
  });
});

// Against the real starter, when there's a copy: MISMO_STARTER=/path/to/mismo-starter pnpm test
describe.skipIf(!process.env.MISMO_STARTER)("customizing the real starter", () => {
  const source = process.env.MISMO_STARTER ?? "";

  const variants: { web: Web[]; native: boolean }[] = [
    { web: ["next"], native: false },
    { web: ["tanstack"], native: true },
    { web: ["next", "tanstack"], native: false },
  ];

  for (const { web, native } of variants) {
    it(`leaves nothing of what is removed: ${web.join("+")}${native ? " + native" : ""}`, () => {
      const dir = mkdtempSync(path.join(tmpdir(), "real-starter-"));
      cpSync(source, dir, { recursive: true, filter: (file) => !/(^|\/)(\.git|node_modules)$/.test(file) });
      customize(dir, { name: "demo", web: [...web], native });

      const text = [
        "package.json",
        "packages/app/package.json",
        "packages/app/routes.config.ts",
        "packages/app/routes/(app)/(tabs)/index.tsx",
        "packages/app/routes/(app)/(tabs)/settings.tsx",
        "README.md",
      ]
        .map((file) => read(dir, file))
        .join("\n");

      expect(text).not.toContain("@acme");
      if (!web.includes("next")) expect(text).not.toMatch(/@mismo\/next|NextRouteOptions|export const next/);
      if (!web.includes("tanstack")) expect(text).not.toMatch(/@mismo\/tanstack|TanstackRouteOptions|export const tanstack/);
      if (!native) expect(has(dir, "apps/native")).toBe(false);
    });
  }
});
