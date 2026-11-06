"use client";

import NextLink from "next/link";
import {
  usePathname as useNextPathname,
  useParams as useNextParams,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import { createContext, type MouseEvent, type ReactNode, useContext, useEffect, useMemo } from "react";
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

/**
 * The page a Next.js layout was given. Next.js passes it as `children`, where other routers render
 * an outlet: the generated `layout.tsx` provides it, and `Slot` renders it, so a shared layout is
 * the same on every router.
 */
const Children = createContext<ReactNode>(null);

/** For the generated `layout.tsx`: the page below the shared layout it renders. */
export function SlotChildren({ value, children }: { value: ReactNode; children: ReactNode }) {
  return <Children.Provider value={value}>{children}</Children.Provider>;
}

/** Where a layout renders its child route. */
export function Slot() {
  return <>{useContext(Children)}</>;
}

/** A real link, so it can be opened in a new tab. Next.js loads its page ahead as it shows. */
export function Link({ to, replace = false, label, children }: LinkProps) {
  return (
    <NextLink href={pathOf(to)} replace={replace} aria-label={label}>
      {children}
    </NextLink>
  );
}

/**
 * Whether there is an earlier entry in this site's history to go back to. The Navigation API says
 * so exactly; without it, any earlier entry counts.
 */
function canGoBack(): boolean {
  const browser = globalThis as { navigation?: { canGoBack?: boolean }; history?: { length: number } };
  if (!browser.history) return false;
  return browser.navigation?.canGoBack ?? browser.history.length > 1;
}

/**
 * Goes back when there is somewhere to go back to in this app, and to `fallback` otherwise. A real
 * link to `fallback`, so a modified click still opens it in a new tab.
 */
export function BackLink({ fallback, label, children }: BackLinkProps) {
  const router = useRouter();

  const onClick = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || !canGoBack()) return;
    event.preventDefault();
    router.back();
  };

  return (
    <NextLink href={pathOf(fallback)} aria-label={label} onClick={onClick}>
      {children}
    </NextLink>
  );
}

/** Navigates as soon as it renders, replacing the current entry. */
export function Redirect({ to }: { to: To }) {
  const router = useRouter();
  const path = pathOf(to);

  useEffect(() => router.replace(path), [router, path]);
  return null;
}

export function useNav(): Nav {
  const router = useRouter();

  return useMemo(
    () => ({
      go: (to) => router.push(pathOf(to)),
      replace: (to) => router.replace(pathOf(to)),
      back: () => router.back(),
      canGoBack,
      preload: async (to) => router.prefetch(pathOf(to)),
    }),
    [router],
  );
}

/** The current path, such as `/orgs/acme`. */
export function usePathname(): string {
  return useNextPathname();
}

/** The current route's params. `href` is the route the screen is for, which types them. */
export function useParams<H extends Href>(_href: H): Routes[H] {
  return useNextParams() as unknown as Routes[H];
}

/** The query of the current URL. A key given twice is its first value, as on native. */
export function useSearchParams(): SearchParams {
  const search = useNextSearchParams();
  return useMemo(() => Object.fromEntries([...search.keys()].map((key) => [key, search.get(key) ?? undefined])), [search]);
}
