// `@mismo/tanstack`: mismo for TanStack Router and TanStack Start. Routes written out for a
// TanStack app (`output`), and what TanStack Router cannot express (`rules`). The runtime is
// `@mismo/tanstack/runtime`, pointed at by mismo's Vite plugin. A route's TanStack options are
// its `tanstack` export, typed with `TanstackRouteOptions`.
import type { RouterAdapter } from "@mismo/core/adapter";

import { output, rules } from "./output.ts";

export const tanstack = {
  name: "TanStack Start",
  rules,
  output,
} satisfies RouterAdapter;

export type { TanstackRouteOptions } from "./options.ts";
