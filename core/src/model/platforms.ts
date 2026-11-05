import type { Target } from "./route.ts";

/** The platform suffixes a route file can have: `name.web.tsx`, `name.native.tsx`, `name.ios.tsx`. */
export const PLATFORMS = ["web", "native", "ios", "android"] as const;
export type Platform = (typeof PLATFORMS)[number];

/** A file's platform, from its name without the extension: `"pricing.web"` gives `web`; a plain file `""`. */
export function platformOf(stem: string): { base: string; platform: Platform | "" } {
  const dot = stem.lastIndexOf(".");
  const suffix = dot === -1 ? "" : stem.slice(dot + 1);

  return (PLATFORMS as readonly string[]).includes(suffix)
    ? { base: stem.slice(0, dot), platform: suffix as Platform }
    : { base: stem, platform: "" };
}

/**
 * The module a target imports for a route, or null when the route is not on that target. `stem`
 * is the route's path without extension or platform; `platforms` the files it has.
 *
 * A route with a plain file is imported without the extension: Metro then picks `.ios`,
 * `.android`, or `.native`, and Vite the plain file. A route with only a platform file is imported
 * by that name, which TypeScript resolves too: Vite does not know `.web`, and TypeScript does not
 * know `.native`.
 */
export function moduleFor(stem: string, platforms: ReadonlySet<Platform | "">, target: Target): string | null {
  const plain = platforms.has("");
  const native = platforms.has("native") || (platforms.has("ios") && platforms.has("android"));

  switch (target) {
    case "web":
      if (platforms.has("web")) return `${stem}.web`;
      return plain ? stem : null;
    case "native":
      if (!plain && platforms.has("native")) return `${stem}.native`;
      return plain || native ? stem : null;
    case "shared":
      // On every platform. Shared screens import nothing through it, so the module is only a label.
      return (plain || platforms.has("web")) && (plain || native) ? stem : null;
  }
}
