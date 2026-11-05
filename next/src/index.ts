// `@mismo/next`: mismo for Next.js's App Router. Routes written out for a Next.js app (`output`),
// and what the App Router cannot express (`rules`). The runtime is `@mismo/next/runtime`, pointed
// at by `withMismo` (`@mismo/next/config`).
import type { RouterAdapter } from "@mismo/core/adapter";

import { output, rules } from "./output.ts";

export const next = {
  name: "Next.js",
  rules,
  output,
} satisfies RouterAdapter;

export type { NextRouteOptions, NextServerOptions } from "./options.ts";
