import {
  StackActions,
  useLinkBuilder,
  useLinkTo,
  useNavigation,
  useRoute,
  useRoutePath,
  useStateForPath,
} from "@react-navigation/native";
import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";
import { Pressable } from "react-native";

import { type BackLinkProps, type Href, type LinkProps, type Nav, pathOf, type Routes, type SearchParams, type To } from "@mismo/core/contract";

import { paramsAlong } from "./params.ts";

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
 * The routes below a shared layout. React Navigation gives a navigator's `layout` the navigator as
 * `children`, where other routers render an outlet: the generated navigator provides it, and
 * `Slot` renders it, so a shared layout is the same on every router.
 */
const Children = createContext<ReactNode>(null);

/** For the generated navigators: the routes below the shared layout they render. */
export function SlotChildren({ value, children }: { value: ReactNode; children: ReactNode }) {
  return <Children.Provider value={value}>{children}</Children.Provider>;
}

/** Where a layout renders its child route. */
export function Slot() {
  return <>{useContext(Children)}</>;
}

/** A pressable around the content, so it can hold views. */
export function Link({ to, replace = false, label, children }: LinkProps) {
  const nav = useNav();

  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} onPress={() => (replace ? nav.replace(to) : nav.go(to))}>
      {children}
    </Pressable>
  );
}

/** Goes back when there is somewhere to go back to, and to `fallback` otherwise. */
export function BackLink({ fallback, label, children }: BackLinkProps) {
  const nav = useNav();

  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} onPress={() => (nav.canGoBack() ? nav.back() : nav.replace(fallback))}>
      {children}
    </Pressable>
  );
}

/** Navigates as soon as it renders, replacing the current screen. */
export function Redirect({ to }: { to: To }) {
  const nav = useNav();

  useEffect(() => {
    nav.replace(to);
    // Once, when it renders: a redirect that runs again on every render would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/**
 * Navigates by URL: the path of a `To` is turned into screens by the app's linking config, which the
 * generated `Navigation` turns on.
 */
export function useNav(): Nav {
  const navigation = useNavigation();
  const linkTo = useLinkTo();
  const { buildAction } = useLinkBuilder();

  return useMemo(
    () => ({
      go: (to) => linkTo(pathOf(to)),
      replace: (to) => {
        const action = buildAction(pathOf(to));
        // A link opens its screen as a navigate action; replacing is the same screen with replace.
        if (action.type === "NAVIGATE") {
          const { name, params } = action.payload;
          navigation.dispatch({ ...StackActions.replace(name, params as object | undefined), ...(action.target ? { target: action.target } : {}) });
        } else {
          navigation.dispatch(action as Parameters<typeof navigation.dispatch>[0]);
        }
      },
      back: () => navigation.goBack(),
      canGoBack: () => navigation.canGoBack(),
      // Every screen is bundled with the app: there is nothing to load.
      preload: async () => {},
    }),
    [navigation, linkTo, buildAction],
  );
}

/** The current path, such as `/orgs/acme`. */
export function usePathname(): string {
  return useRoutePath()?.split("?")[0] ?? "/";
}

/** The params of the whole URL: this route's, and those of the layouts around it. */
function useAllParams(): Record<string, unknown> {
  return paramsAlong(useStateForPath(), useRoute().params);
}

/** The current route's params. `href` is the route the screen is for, which types them. */
export function useParams<H extends Href>(_href: H): Routes[H] {
  return useAllParams() as Routes[H];
}

/** The query of the current URL. A param repeated in the URL keeps its first value, as on the web. */
export function useSearchParams(): SearchParams {
  return Object.fromEntries(
    Object.entries(useAllParams()).map(([key, value]) => {
      const first = Array.isArray(value) ? value[0] : value;
      return [key, first === undefined || first === null ? undefined : String(first)];
    }),
  );
}
