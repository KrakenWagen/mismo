import {
  Redirect as RouterRedirect,
  Link as RouterLink,
  Slot as RouterSlot,
  type Href as ExpoHref,
  useLocalSearchParams,
  usePathname as useRouterPathname,
  useRouter,
} from "expo-router";
import { useMemo } from "react";
import { Pressable } from "react-native";

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
  return <RouterSlot />;
}

/**
 * A pressable around the content. Expo Router's own link is text, and text cannot hold views, so
 * it gives its press to this child instead (`asChild`).
 */
export function Link({ to, replace = false, label, children }: LinkProps) {
  return (
    <RouterLink href={pathOf(to) as ExpoHref} replace={replace} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={label}>
        {children}
      </Pressable>
    </RouterLink>
  );
}

/** Goes back when there is somewhere to go back to, and to `fallback` otherwise. */
export function BackLink({ fallback, label, children }: BackLinkProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => (router.canGoBack() ? router.back() : router.replace(pathOf(fallback) as ExpoHref))}
    >
      {children}
    </Pressable>
  );
}

/** Navigates as soon as it renders, replacing the current screen. */
export function Redirect({ to }: { to: To }) {
  return <RouterRedirect href={pathOf(to) as ExpoHref} />;
}

export function useNav(): Nav {
  const router = useRouter();

  return useMemo(
    () => ({
      go: (to) => router.push(pathOf(to) as ExpoHref),
      replace: (to) => router.replace(pathOf(to) as ExpoHref),
      back: () => router.back(),
      canGoBack: () => router.canGoBack(),
      // Expo Router bundles every screen with the app: there is nothing to load.
      preload: async () => {},
    }),
    [router],
  );
}

/** The current path, such as `/orgs/acme`. */
export function usePathname(): string {
  return useRouterPathname();
}

/** The current route's params. `href` is the route the screen is for, which types them. */
export function useParams<H extends Href>(_href: H): Routes[H] {
  return useLocalSearchParams() as Routes[H];
}

/** The query of the current URL. A param repeated in the URL keeps its first value, as on the web. */
export function useSearchParams(): SearchParams {
  const params = useLocalSearchParams();
  return Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
}
