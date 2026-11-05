import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { expo } from "@mismo/expo";
import { next } from "@mismo/next";
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

/** Writes the Next.js app's routes for these files, and returns how to read them. */
function generate(files: string[]) {
  const source = folder(files);
  const out = path.join(mkdtempSync(path.join(tmpdir(), "app-")), "app");
  generateAppRoutes({
    config: resolveRoutesConfig({ source, input: expo.input(), validFor: [next, expo] }, source),
    output: next.output({ outDir: out, types: path.join(out, "routes.gen.ts") }),
  });
  return (file: string) => readFileSync(path.join(out, file), "utf8");
}

describe("the Next.js output", () => {
  it("writes a page.tsx per page and a layout.tsx per layout, index pages at their folder", () => {
    const read = generate(["index.tsx", "(app)/_layout.tsx", "(app)/orgs/[id].tsx", "(app)/orgs/index.tsx", "pricing.web.tsx"]);

    expect(read("mismo-page.tsx")).toMatch(/import Page from ".*\/index";/);
    expect(read("(app)/mismo-layout.tsx")).toMatch(/import Layout from ".*\/\(app\)\/_layout";/);
    expect(read("(app)/orgs/[id]/mismo-page.tsx")).toMatch(/import Page from ".*\/orgs\/\[id\]";/);
    expect(read("(app)/orgs/mismo-page.tsx")).toMatch(/import Page from ".*\/orgs\/index";/);
    expect(read("pricing/mismo-page.tsx")).toMatch(/import Page from ".*\/pricing\.web";/);
  });

  it("renders each shared screen from a server component, in a client component beside it", () => {
    const read = generate(["(app)/_layout.tsx", "(app)/home.tsx"]);

    // The server components: no "use client", rendering the client file beside them.
    expect(read("(app)/home/page.tsx")).not.toContain('"use client"');
    expect(read("(app)/home/page.tsx")).toContain('import Screen from "./mismo-page";');
    expect(read("(app)/layout.tsx")).not.toContain('"use client"');
    expect(read("(app)/layout.tsx")).toContain("<Shell>{children}</Shell>");

    // The client components: a page in a Suspense boundary, a layout handing its page to Slot.
    expect(read("(app)/home/mismo-page.tsx")).toContain('"use client";');
    expect(read("(app)/home/mismo-page.tsx")).toContain("<Suspense>\n      <Page />\n    </Suspense>");
    expect(read("(app)/mismo-layout.tsx")).toContain('import { SlotChildren } from "@mismo/next/runtime";');
    expect(read("(app)/mismo-layout.tsx")).toContain("<SlotChildren value={children}>");
  });

  it("refuses what Next.js reads as something else, without an error: private, slot, and intercepting folders", () => {
    expect(() => generate(["_drafts/post.tsx"])).toThrow(/"_drafts" starts with "_", a private folder to Next\.js/);
    expect(() => generate(["@modal/login.tsx"])).toThrow(/"@modal" starts with "@", a parallel route's slot/);
    expect(() => generate(["(a)/about.tsx", "(b)/about.tsx"])).toThrow(/and Next\.js allows one page per URL/);
  });
});
