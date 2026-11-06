import { type MouseEvent, useMemo } from "react";
import {
  Navigate,
  Outlet,
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from "react-router";
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

/** Where a layout renders its child route. */
export function Slot() {
  return <Outlet />;
}

/**
 * A real link, so it can be opened in a new tab. It loads the page's code when hovered or focused
 * (`prefetch="intent"`), as React Router offers no way to do that from code.
 */
export function Link({ to, replace = false, label, children }: LinkProps) {
  return (
    <RouterLink to={pathOf(to)} replace={replace} aria-label={label} prefetch="intent">
      {children}
    </RouterLink>
  );
}

/**
 * Whether there is an earlier entry in this app to go back to. React Router keys the first entry
 * of a session `"default"`: the page was opened directly, or the user came from another site.
 */
function useCanGoBack(): boolean {
  return useLocation().key !== "default";
}

/**
 * Goes back when there is somewhere to go back to in this app, and to `fallback` otherwise. A real
 * link to `fallback`, so a modified click still opens it in a new tab.
 */
export function BackLink({ fallback, label, children }: BackLinkProps) {
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  const onClick = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || !canGoBack) return;
    event.preventDefault();
    void navigate(-1);
  };

  return (
    <RouterLink to={pathOf(fallback)} aria-label={label} onClick={onClick}>
      {children}
    </RouterLink>
  );
}

/** Navigates as soon as it renders, replacing the current entry. */
export function Redirect({ to }: { to: To }) {
  return <Navigate to={pathOf(to)} replace />;
}

export function useNav(): Nav {
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  return useMemo(
    () => ({
      go: (to) => void navigate(pathOf(to)),
      replace: (to) => void navigate(pathOf(to), { replace: true }),
      back: () => void navigate(-1),
      canGoBack: () => canGoBack,
      // React Router has no call to load a page ahead: `Link` does it on intent instead.
      preload: async () => {},
    }),
    [navigate, canGoBack],
  );
}

/** The current path, such as `/orgs/acme`. */
export function usePathname(): string {
  return useLocation().pathname;
}

/** The current route's params. `href` is the route the screen is for, which types them. */
export function useParams<H extends Href>(_href: H): Routes[H] {
  return useRouterParams() as Routes[H];
}

/** The query of the current URL. A key given twice is its first value, as on native. */
export function useSearchParams(): SearchParams {
  const [search] = useRouterSearchParams();
  return useMemo(() => Object.fromEntries([...search.keys()].map((key) => [key, search.get(key) ?? undefined])), [search]);
}
