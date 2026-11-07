import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createHandler, type Env } from "../../demo/src/handler.ts";
import { buildManifests, describeAsset, type Manifests } from "../../demo/src/manifest.ts";

/** A folder like `expo export` writes: files by path, and its metadata.json. */
function exportOf(files: Record<string, string>, metadata: object): string {
  const dir = mkdtempSync(path.join(tmpdir(), "export-"));
  for (const [file, content] of Object.entries({ ...files, "metadata.json": JSON.stringify(metadata) })) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), content);
  }
  return dir;
}

describe("the manifests Expo Go reads", () => {
  it("describes a file by its content: a SHA-256 to check, an MD5 to cache under, and where it is", () => {
    const dir = exportOf({ "assets/logo": "hello" }, {});
    const asset = describeAsset(dir, "assets/logo", "png", "image/png");

    // The digests of the bytes "hello", from outside this code.
    expect(asset).toEqual({
      hash: "LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ",
      key: "5d41402abc4b2a76b9719d911017c592",
      contentType: "image/png",
      fileExtension: ".png",
      url: "/native/assets/logo",
    });
    expect(describeAsset(dir, "assets/logo", null, "application/javascript")).not.toHaveProperty("fileExtension");
  });

  it("builds a manifest per platform, for the app's SDK", () => {
    const dir = exportOf(
      { "_expo/ios.js": "ios", "_expo/android.js": "android", "assets/a": "a", "assets/b": "b" },
      {
        fileMetadata: {
          ios: { bundle: "_expo/ios.js", assets: [{ path: "assets/a", ext: "png" }] },
          android: { bundle: "_expo/android.js", assets: [{ path: "assets/b", ext: "weird" }] },
        },
      },
    );
    let n = 0;
    const manifests = buildManifests({ exported: dir, config: { sdkVersion: "58.0.0" }, now: new Date("2026-01-02T03:04:05Z"), newId: () => `id-${++n}` });

    expect(Object.keys(manifests)).toEqual(["ios", "android"]);
    expect(manifests.ios).toMatchObject({
      id: "id-1",
      createdAt: "2026-01-02T03:04:05.000Z",
      runtimeVersion: "exposdk:58.0.0",
      launchAsset: { contentType: "application/javascript", url: "/native/_expo/ios.js" },
      assets: [{ contentType: "image/png", fileExtension: ".png", url: "/native/assets/a" }],
      extra: { scopeKey: "@mismo/notes-demo", expoClient: { sdkVersion: "58.0.0" } },
    });
    expect(manifests.android?.assets[0]).toMatchObject({ contentType: "application/octet-stream", fileExtension: ".weird" });
    expect(manifests.android?.id).toBe("id-2");
  });
});

describe("the Worker", () => {
  const manifests: Manifests = {
    ios: {
      id: "1",
      createdAt: "2026-01-01T00:00:00.000Z",
      runtimeVersion: "exposdk:58.0.0",
      launchAsset: { hash: "h", key: "k", contentType: "application/javascript", url: "/native/_expo/ios.js" },
      assets: [{ hash: "h2", key: "k2", contentType: "image/png", fileExtension: ".png", url: "/native/assets/a" }],
      metadata: {},
      extra: { scopeKey: "@mismo/notes-demo", eas: {}, expoClient: {} },
    },
  };
  const page = () => new Response("<html></html>", { headers: { "content-type": "text/html" } });
  /** The site's static files: what `ASSETS` returns for a path, and which paths were asked for. */
  const site = (answer: (path: string) => Response = page) => {
    const asked: string[] = [];
    const env: Env = {
      ASSETS: {
        async fetch(request) {
          asked.push(new URL(request.url).pathname);
          return answer(new URL(request.url).pathname);
        },
      },
    };
    return { env, asked };
  };
  const handler = createHandler(manifests);
  // Node's Request, as the handler's parameter type: another package in this project brings in the DOM's.
  const ask = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers }) as unknown as Parameters<typeof handler>[0];

  it("sends Expo Go its manifest, with every file's address in full", async () => {
    const { env, asked } = site();
    const response = await handler(ask("https://demo.mismo.dev/", { "expo-platform": "ios" }), env);
    const body = (await response.json()) as typeof manifests.ios;

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/expo+json");
    expect(response.headers.get("expo-protocol-version")).toBe("1");
    expect(response.headers.get("cache-control")).toBe("private, max-age=0");
    expect(body?.launchAsset.url).toBe("https://demo.mismo.dev/native/_expo/ios.js");
    expect(body?.assets[0]?.url).toBe("https://demo.mismo.dev/native/assets/a");
    expect(asked).toEqual([]);
    // The manifest is not changed for the next request.
    expect(manifests.ios?.launchAsset.url).toBe("/native/_expo/ios.js");
  });

  it("answers in the multipart form when Expo Go asks for it", async () => {
    const response = await handler(ask("http://127.0.0.1:8799/", { "expo-platform": "ios", accept: "multipart/mixed, application/expo+json" }), site().env);
    const text = await response.text();

    expect(response.headers.get("content-type")).toBe("multipart/mixed; boundary=mismo-demo-boundary");
    expect(text.startsWith('--mismo-demo-boundary\r\ncontent-disposition: form-data; name="manifest"')).toBe(true);
    expect(text.endsWith("--mismo-demo-boundary--\r\n")).toBe(true);
    expect(text).toContain('"url":"http://127.0.0.1:8799/native/_expo/ios.js"');
  });

  it("leaves everyone else to the web app, whatever header they send", async () => {
    for (const platform of [undefined, "web", "android", "constructor", "__proto__", "toString"]) {
      const { env, asked } = site();
      const response = await handler(ask("https://demo.mismo.dev/", platform ? { "expo-platform": platform } : {}), env);

      expect(response.status, String(platform)).toBe(200);
      expect(response.headers.get("content-type"), String(platform)).toBe("text/html");
      expect(asked, String(platform)).toEqual(["/"]);
    }
  });

  it("says a native file is missing when the web app answers with its own page", async () => {
    const files = (pathname: string) =>
      pathname === "/native/assets/a" ? new Response("png", { headers: { "content-type": "image/png" } }) : page();
    const { env } = site(files);

    expect((await handler(ask("https://demo.mismo.dev/native/assets/a"), env)).status).toBe(200);
    expect((await handler(ask("https://demo.mismo.dev/native/assets/missing"), env)).status).toBe(404);
    // The web app's own routes still get its page.
    expect((await handler(ask("https://demo.mismo.dev/notes/1"), env)).status).toBe(200);
  });
});
