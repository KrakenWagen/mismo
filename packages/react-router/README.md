# @mismo/react-router

mismo for React Router (framework mode). [mismo](https://mismo.dev) shares screens, routes and navigation between a React Native app and a web app, each on its own router.

**Docs: [mismo.dev/docs/react-router](https://mismo.dev/docs/react-router)**

## Install

```sh
npm i @mismo/core @mismo/react-router
```

## Setup

Add mismo's Vite plugin before React Router's. It writes the shared routes into `app/mismo` and runs the shared screens' navigation on React Router:

```ts
// vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import { reactRouter as mismoReactRouter } from "@mismo/react-router";
import { mismo } from "@mismo/core/vite";

export default defineConfig({
  plugins: [
    mismo({
      config: "../../packages/app/routes.config.ts",
      output: mismoReactRouter.output({ outDir: "app/mismo", types: "app/routes.gen.ts" }),
    }),
    reactRouter(),
  ],
});
```

Then spread them into `app/routes.ts`: `export default [...routes]`, with `routes` from `./mismo/routes`. Supports React Router `>=8 <9`.

## Route options

Browser options go beside the screen, and server code in the route's server file, which the native app never bundles. A type-only import types `meta` from the loader:

```ts
// routes/orgs/[id].tsx
import type { reactRouter as server } from "./[id].server";

export const reactRouter = {
  meta: ({ loaderData }) => [{ title: loaderData?.title }],
} satisfies ReactRouterRouteOptions<typeof server>;

// routes/orgs/[id].server.ts
export const reactRouter = {
  async loader({ params }) {
    return { title: `Organization ${params.id}` };
  },
} satisfies ReactRouterServerOptions;
```

See [route options](https://mismo.dev/docs/route-options).

See [Getting started](https://mismo.dev/docs/getting-started) for the whole setup: the shared routes package, and each app.

## License

MIT
