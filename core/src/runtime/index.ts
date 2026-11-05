// `@mismo/core`: what screens import. An app's build points this module at its router's runtime
// (`@mismo/tanstack/runtime`, `@mismo/expo/runtime`), so screens shared by every app import one
// API: the Vite plugin (`@mismo/core/vite`) and Metro's wrapper (`@mismo/expo/metro`) do it. What is
// here gives screens their types, and fails clearly in a build that did not.
import type { ReactNode } from "react";

import type { BackLinkProps, Href, LinkProps, Nav, Routes, SearchParams, To } from "./contract.ts";

export {
  pathOf,
  type BackLinkProps,
  type Href,
  type LinkProps,
  type Nav,
  type Routes,
  type SearchParams,
  type To,
} from "./contract.ts";

function unset(name: string): never {
  throw new Error(
    `mismo: ${name} has no router. Point "@mismo/core" at a runtime in the app's build: mismo's Vite plugin, withMismo from @mismo/next/config, or withMismo from @mismo/expo/metro.`,
  );
}

/** Where a layout renders its child route. */
export function Slot(): ReactNode {
  return unset("Slot");
}

/** A link to a route: `<Link to="/orgs/[id]" …>` with its params, typed from the routes. */
export function Link(_props: LinkProps): ReactNode {
  return unset("Link");
}

/** Back to the previous screen, or to `fallback` when there is none. */
export function BackLink(_props: BackLinkProps): ReactNode {
  return unset("BackLink");
}

/** Replaces the current screen with `to` as soon as it renders. */
export function Redirect(_props: { to: To }): ReactNode {
  return unset("Redirect");
}

/** Navigates from code: `go`, `replace`, `back`, `canGoBack`, `preload`. */
export function useNav(): Nav {
  return unset("useNav");
}

/** The current path, such as `/orgs/1`. */
export function usePathname(): string {
  return unset("usePathname");
}

/** The current route's params, typed by its pattern: `useParams("/orgs/[id]").id`. */
export function useParams<H extends Href>(_href: H): Routes[H] {
  return unset("useParams");
}

/** The current URL's query. */
export function useSearchParams(): SearchParams {
  return unset("useSearchParams");
}
