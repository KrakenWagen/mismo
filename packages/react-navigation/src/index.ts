// `@mismo/react-navigation`: mismo for React Navigation. The routes written out for a React Native
// app on React Navigation (`output`), and what React Navigation cannot express (`rules`). The runtime
// is `@mismo/react-navigation/runtime`, pointed at by Metro's wrapper (`@mismo/react-navigation/metro`).
// A route's React Navigation options are its `reactNavigation` export.
import type { RouterAdapter } from "@mismo/core/adapter";

import { output, rules } from "./output.ts";

export const reactNavigation = {
  name: "React Navigation",
  rules,
  output,
} satisfies RouterAdapter;

export type { ReactNavigationLayoutOptions, ReactNavigationScreenOptions } from "./options.ts";
