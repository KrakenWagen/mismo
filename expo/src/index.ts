// `@mismo/expo`: mismo for Expo Router. Routes written as an Expo Router folder (`input`, read by
// Expo Router's own parser), routes written out for an Expo app (`output`), and what Expo Router
// cannot express (`rules`, none beyond what the input reads). The runtime is `@mismo/expo/runtime`,
// pointed at by `withMismo` (`@mismo/expo/metro`).
import type { RouterAdapter } from "@mismo/core/adapter";

import { input } from "./input.ts";
import { output, rules } from "./output.ts";

export const expo = {
  name: "Expo Router",
  rules,
  input,
  output,
} satisfies RouterAdapter;
