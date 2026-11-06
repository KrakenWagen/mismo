import {
  Navigate,
  Outlet,
  Link as RouterLink,
  useCanGoBack,
  useLocation,
  useNavigate,
  useRouter,
  useParams as useRouterParams,
  useSearch as useRouterSearch,
} from "@tanstack/react-router";
import { type MouseEvent, useMemo } from "react";

import { type BackLinkProps, type Href, type LinkProps, type Nav, pathOf, type Routes, type SearchParams, type To } from "@mismo/core/contract";

export {
  pathOf,
  type BackLinkProps,
  type Href,
  type LinkProps,
  type Nav,
  type Routes,
  type SearchParams,
  type To,
} from "@mismo/core/contract";

// TanStack Router types `to` against its own route tree, which this lib does not know. The path is
// already built, so it is passed as a plain string.
type AnyTo = never;

/** Where a layout renders its child route. */
export function Slot() {
  return <Outlet />;
}

/** A real link, so it can be opened in a new tab. */
export function Link({ to, replace = false, label, children }: LinkProps) {
  return (
    <RouterLink to={pathOf(to) as AnyTo} replace={replace} aria-label={label}>
      {children}
    </RouterLink>
  );
}

/**
 * Goes back when there is somewhere to go back to in this app, and to `fallback` otherwise. A real
 * link to `fallback`, so a modified click still opens it in a new tab.
 */
export function BackLink({ fallback, label, children }: BackLinkProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const onClick = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || !canGoBack) return;
    event.preventDefault();
    router.history.back();
  };

  return (
    <RouterLink to={pathOf(fallback) as AnyTo} aria-label={label} onClick={onClick}>
      {children}
    </RouterLink>
  );
}

/** Navigates as soon as it renders, replacing the current entry. */
export function Redirect({ to }: { to: To }) {
  return <Navigate to={pathOf(to) as AnyTo} replace />;
}

export function useNav(): Nav {
  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return useMemo(
    () => ({
      go: (to) => void navigate({ to: pathOf(to) as AnyTo }),
      replace: (to) => void navigate({ to: pathOf(to) as AnyTo, replace: true }),
      back: () => router.history.back(),
      canGoBack: () => canGoBack,
      preload: async (to) => {
        await router.preloadRoute({ to: pathOf(to) as AnyTo });
      },
    }),
    [navigate, router, canGoBack],
  );
}

/** The current path, such as `/orgs/acme`. */
export function usePathname(): string {
  return useLocation({ select: (location) => location.pathname });
}

/** The current route's params. `href` is the route the screen is for, which types them. */
export function useParams<H extends Href>(_href: H): Routes[H] {
  // Loosened like `to`: in an app, TanStack Router types this against the app's route tree.
  return (useRouterParams as (options: { strict: false }) => unknown)({ strict: false }) as Routes[H];
}

/** The query of the current URL. Values are strings, as on native. */
export function useSearchParams(): SearchParams {
  const search = (useRouterSearch as (options: { strict: false }) => Record<string, unknown>)({ strict: false });
  // TanStack Router parses the query as JSON where it can (`?n=1` gives a number).
  return Object.fromEntries(Object.entries(search).map(([key, value]) => [key, value == null ? undefined : String(value)]));
}
