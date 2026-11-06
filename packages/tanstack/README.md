# @mismo/tanstack

mismo for TanStack Start and TanStack Router. [mismo](https://mismo.dev) shares screens, routes and navigation between a React Native app and a web app, each on its own router.

**Docs: [mismo.dev/docs/tanstack-start](https://mismo.dev/docs/tanstack-start)**

## Install

```sh
pnpm add @mismo/core @mismo/tanstack
```

## Setup

Add mismo's Vite plugin before TanStack Start's. It writes the shared routes into `src/routes` and runs the shared screens' navigation on TanStack Router:

```ts
// vite.config.ts
import { tanstack } from "@mismo/tanstack";
import { mismo } from "@mismo/core/vite";

export default defineConfig({
  plugins: [
    mismo({
      config: "../../packages/app/routes.config.ts",
      output: tanstack.output({ outDir: "src/routes", types: "src/routes.gen.ts" }),
    }),
    tanstackStart(),
    react(),
  ],
});
```

## Route options

Options like `ssr` and `head` come from a shared route's `tanstack` export, typed with `TanstackRouteOptions`. The options that hold server code, `loader` and `beforeLoad`, go in the route's server file, which the native app never bundles:

```ts
// routes/orgs/[id].tsx
export const tanstack = { ssr: false } satisfies TanstackRouteOptions;

// routes/orgs/[id].server.ts
export const tanstack = {
  loader: ({ params }) => getOrg({ data: params.id }),
} satisfies TanstackServerOptions;
```

TanStack runs a loader in the browser too, so keep its server-only work in a `createServerFn`, which TanStack's compiler replaces with a call to the server. TanStack Start refuses `*.server.*` files in the browser's bundle, so let the shared routes' through in `vite.config.ts`:

```ts
tanstackStart({ importProtection: { client: { excludeFiles: ["**/app/routes/**/*.server.*"] } } }),
```

See [route options](https://mismo.dev/docs/route-options).

See [Getting started](https://mismo.dev/docs/getting-started) for the whole setup: the shared routes package, and each app.

## License

MIT
