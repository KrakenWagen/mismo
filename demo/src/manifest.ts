// What the Worker sends Expo Go: one manifest per platform, from the files `expo export` wrote.
// The Expo Updates protocol: https://docs.expo.dev/technical-specs/expo-updates-1/
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

/** A file Expo Go downloads: the bundle, or an image or font in it. `url` is below the site's origin. */
export interface Asset {
  /** SHA-256 of the file, base64url: Expo Go checks the download against it. */
  hash: string;
  /** MD5 of the file, hex: what Expo Go caches it under. */
  key: string;
  contentType: string;
  fileExtension?: string;
  url: string;
}

export interface Manifest {
  id: string;
  createdAt: string;
  runtimeVersion: string;
  launchAsset: Asset;
  assets: Asset[];
  metadata: Record<string, never>;
  extra: { scopeKey: string; eas: Record<string, never>; expoClient: unknown };
}

/** By the platform Expo Go names in its `expo-platform` header: `ios` and `android`. */
export type Manifests = Record<string, Manifest>;

/** What `expo export` writes in `metadata.json` for each platform. */
export interface ExportMetadata {
  fileMetadata: Record<string, { bundle: string; assets: { path: string; ext: string }[] }>;
}

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  ttf: "font/ttf",
  otf: "font/otf",
  svg: "image/svg+xml",
  json: "application/json",
};

/** A file in the export, as the manifest lists it. Files are served from `/native/`. */
export function describeAsset(exported: string, file: string, extension: string | null, contentType: string): Asset {
  const data = readFileSync(path.join(exported, file));

  return {
    hash: createHash("sha256").update(data).digest("base64url"),
    key: createHash("md5").update(data).digest("hex"),
    contentType,
    ...(extension ? { fileExtension: `.${extension}` } : {}),
    url: `/native/${file}`,
  };
}

/**
 * The manifests for an export. Expo Go only opens an app whose runtime version is its own SDK's, so
 * that comes from the app's config (`expo config`), and `scopeKey` keeps this app's storage apart
 * from every other project's.
 */
export function buildManifests({
  exported,
  config,
  now = new Date(),
  newId = randomUUID,
}: {
  exported: string;
  config: { sdkVersion: string };
  now?: Date;
  newId?: () => string;
}): Manifests {
  const metadata = JSON.parse(readFileSync(path.join(exported, "metadata.json"), "utf8")) as ExportMetadata;

  return Object.fromEntries(
    Object.entries(metadata.fileMetadata).map(([platform, files]) => [
      platform,
      {
        id: newId(),
        createdAt: now.toISOString(),
        runtimeVersion: `exposdk:${config.sdkVersion}`,
        launchAsset: describeAsset(exported, files.bundle, null, "application/javascript"),
        assets: files.assets.map((asset) => describeAsset(exported, asset.path, asset.ext, CONTENT_TYPES[asset.ext] ?? "application/octet-stream")),
        metadata: {},
        extra: { scopeKey: "@mismo/notes-demo", eas: {}, expoClient: config },
      } satisfies Manifest,
    ]),
  );
}
