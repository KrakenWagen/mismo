import type { NavigationProp, ParamListBase, RouteProp, Theme } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

/**
 * The options of one screen in React Navigation, exported from a shared route's module as
 * `reactNavigation`. The generated navigator passes them to the screen as written.
 *
 *     export const reactNavigation = { options: { title: "Settings" } } satisfies ReactNavigationScreenOptions;
 */
export type ReactNavigationScreenOptions = {
  /** The screen's options: its title, header, animation. */
  options?:
    | NativeStackNavigationOptions
    | ((props: { route: RouteProp<ParamListBase>; navigation: NavigationProp<ParamListBase>; theme: Theme }) => NativeStackNavigationOptions);
  /** The screen's event listeners. */
  listeners?: object;
  /** Params the screen has when it opens without any. */
  initialParams?: object;
  /** A screen with the same id is reused instead of pushed again. */
  getId?: (props: { params?: Record<string, string | undefined> }) => string | undefined;
};

/**
 * The options of a shared layout: those of any screen (for the layout itself, in its parent), and
 * the navigator the layout becomes. A layout is a native stack unless it says otherwise. Written
 * out in the layout's module, as `reactNavigation`, with `navigator` a literal.
 *
 *     export const reactNavigation = { navigator: "tabs", screenOptions: { headerShown: false } } satisfies ReactNavigationLayoutOptions;
 */
export type ReactNavigationLayoutOptions = ReactNavigationScreenOptions & {
  /**
   * Which navigator the layout's routes are in: a native stack (`@react-navigation/native-stack`),
   * bottom tabs (`@react-navigation/bottom-tabs`) or a drawer (`@react-navigation/drawer`). The
   * app installs the one it uses.
   */
  navigator?: "stack" | "tabs" | "drawer";
  /** The options of every screen in the navigator. Headers are off unless set: screens bring their own. */
  screenOptions?: NativeStackNavigationOptions & Record<string, unknown>;
  /** The route that opens first, by its file in the routes folder: `(tabs)/home`. */
  initialRouteName?: string;
};
