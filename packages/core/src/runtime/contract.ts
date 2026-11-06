import type { ReactNode } from "react";

/**
 * Every route and its params, by URL pattern in Expo Router's syntax: `"/orgs/[id]": { id: string }`.
 * Empty here; the generated types file of each package merges its routes in. A shared package
 * sees the routes both platforms have, an app sees those plus its own.
 */
export interface Routes {}

export type Href = keyof Routes & string;

/** A route and its params, or the route alone when it takes none. */
export type To<H extends Href = Href> = H extends Href
  ? keyof Routes[H] extends never
    ? H | { href: H; params?: Routes[H] }
    : { href: H; params: Routes[H] }
  : never;

/** The path to navigate to: `{ href: "/orgs/[id]", params: { id: "1" } }` gives `/orgs/1`, as does `/orgs/:id`. */
export function pathOf(to: To): string {
  // Loosened: with no routes registered, as in this lib, `To` is `never`.
  const target = to as string | { href: string; params?: Record<string, string> };
  if (typeof target === "string") return target;
  const params = target.params ?? {};

  // `[id]` from an Expo Router folder, `:id` from a React Router config.
  return target.href.replace(/\[([^\]]+)\]|(?<=\/):([^/]+)/g, (_, bracket: string | undefined, colon: string | undefined) => {
    const name = (bracket ?? colon)!;
    const value = params[name];
    if (value === undefined) throw new Error(`${target.href} needs the param ${name}.`);
    return encodeURIComponent(value);
  });
}

export type LinkProps = {
  to: To;
  /**
   * Replaces the current screen instead of adding one, for a sibling such as sign-in from sign-up:
   * the history does not grow, and back still leaves to what was before.
   */
  replace?: boolean;
  /** The link's accessible name, when its content does not say where it goes. */
  label?: string;
  /** Any content: text, a row, a picture. On native it is a pressable, so it can hold views. */
  children: ReactNode;
};

export type BackLinkProps = {
  /** Where to go when there is nothing to go back to, such as a page opened directly. */
  fallback: To;
  label?: string;
  children: ReactNode;
};

export type Nav = {
  go: (to: To) => void;
  replace: (to: To) => void;
  back: () => void;
  canGoBack: () => boolean;
  /** Loads a page's code ahead, so navigating to it later shows it at once. Native has every page already. */
  preload: (to: To) => Promise<void>;
};

/** The current URL's query, such as `?token=…` on a link from an email. */
export type SearchParams = Record<string, string | undefined>;
