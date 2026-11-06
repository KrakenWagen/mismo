// `@mismo/react-router`: mismo for React Router (framework mode). Routes written as React Router's
// config (`input`), routes written out for a React Router app (`output`), and what React Router
// cannot express (`rules`). The runtime is `@mismo/react-router/runtime`, pointed at by mismo's
// Vite plugin.
import type { RouterAdapter } from "@mismo/core/adapter";

import { input } from "./input.ts";
import { output, rules } from "./output.ts";

export const reactRouter = {
  name: "React Router",
  rules,
  input,
  output,
} satisfies RouterAdapter;

export type { ReactRouterRouteOptions, ReactRouterServerOptions } from "./options.ts";
