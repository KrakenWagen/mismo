# @mismo/tanstack

mismo for TanStack Start and TanStack Router. [mismo](https://mismo.dev) shares screens, routes and navigation between a React Native app and a web app, each on its own router.

**Docs: [mismo.dev/docs/tanstack-start](https://mismo.dev/docs/tanstack-start)**

## Install

```sh
npm i @mismo/core @mismo/tanstack
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

Route options (`ssr`, `head`) come from a shared route's `tanstack` export, typed with `TanstackRouteOptions`. Options that hold server code (`loader`, `beforeLoad`) go in the route's server file, `orgs/[id].server.ts`, typed with `TanstackServerOptions`, which the native app never bundles. TanStack also runs a loader in the browser on client-side navigation, so keep its server-only work in a `createServerFn`. Start refuses `*.server.*` files in the browser's bundle, so let the shared routes' through in `vite.config.ts`: `tanstackStart({ importProtection: { client: { excludeFiles: ["**/shared/routes/**/*.server.*"] } } })`.

See [Getting started](https://mismo.dev/docs/getting-started) for the whole setup: the shared routes package, and each app.

## License

MIT
