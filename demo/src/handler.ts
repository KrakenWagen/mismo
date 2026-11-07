// Phones ask for the native app at the root, with an `expo-platform` header. Everyone else gets the
// web app. This is the Expo Updates protocol, as far as Expo Go needs it:
// https://docs.expo.dev/technical-specs/expo-updates-1/
import type { Manifest, Manifests } from "./manifest.ts";

/** What the Worker can reach: the site's static files. */
export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const BOUNDARY = "mismo-demo-boundary";

/** Where the manifest says the files are, in full: Expo Go downloads them from the origin it asked. */
function withOrigin(manifest: Manifest, origin: string): Manifest {
  const absolute = <T extends { url: string }>(asset: T): T => ({ ...asset, url: origin + asset.url });
  return { ...manifest, launchAsset: absolute(manifest.launchAsset), assets: manifest.assets.map(absolute) };
}

function manifestResponse(manifest: Manifest, request: Request): Response {
  const body = JSON.stringify(withOrigin(manifest, new URL(request.url).origin));
  const headers = { "expo-protocol-version": "1", "expo-sfv-version": "0", "cache-control": "private, max-age=0" };

  if (request.headers.get("accept")?.includes("multipart/mixed")) {
    const part = `--${BOUNDARY}\r\ncontent-disposition: form-data; name="manifest"\r\ncontent-type: application/json; charset=utf-8\r\n\r\n${body}\r\n--${BOUNDARY}--\r\n`;
    return new Response(part, { headers: { ...headers, "content-type": `multipart/mixed; boundary=${BOUNDARY}` } });
  }
  return new Response(body, { headers: { ...headers, "content-type": "application/expo+json" } });
}

export function createHandler(manifests: Manifests) {
  return async function fetch(request: Request, env: Env): Promise<Response> {
    const platform = request.headers.get("expo-platform");
    // Its own platforms only: a header such as `constructor` is not one.
    if (platform && Object.hasOwn(manifests, platform)) return manifestResponse(manifests[platform]!, request);

    const response = await env.ASSETS.fetch(request);

    // The web app answers any path it doesn't have with its own page, and a 200. For the native
    // app's files that hides a missing file as a page Expo Go can't read: say it's missing.
    if (new URL(request.url).pathname.startsWith("/native/") && response.headers.get("content-type")?.startsWith("text/html")) {
      return new Response("Not found", { status: 404 });
    }
    return response;
  };
}
