# @mismo/next

mismo for Next.js (App Router). [mismo](https://mismo.dev) shares screens, routes and navigation between a React Native app and a web app, each on its own router.

**Docs: [mismo.dev/docs/nextjs](https://mismo.dev/docs/nextjs)**

## Install

```sh
npm i @mismo/core @mismo/next
```

## Setup

Wrap the app's Next.js config. It writes the shared routes into `app/` and runs the shared screens' navigation on Next.js:

```ts
// next.config.ts
import { withMismo } from "@mismo/next/config";

export default withMismo(
  { transpilePackages: ["@acme/app", "@mismo/core", "@mismo/next"] },
  { config: "../../packages/app/routes.config.ts", outDir: "app", types: "app/routes.gen.ts" },
);
```

`@acme/app` is your shared package, which Next.js compiles along with mismo. Supports Next.js `>=16 <17`.

## Route options

Plain values go beside the screen, and mismo copies them into the generated server page. Code goes in the route's server file, which the native app never bundles:

```ts
// routes/orgs/[id].tsx
export const next = { revalidate: 3600 } satisfies NextRouteOptions;

// routes/orgs/[id].server.ts
export const next = {
  async generateMetadata({ params }) {
    const { id } = await params;
    return { title: `Organization ${id}` };
  },
} satisfies NextServerOptions;
```

Shared screens stay client components, since they also run on native. See [route options](https://mismo.dev/docs/route-options).

See [Getting started](https://mismo.dev/docs/getting-started) for the whole setup: the shared routes package, and each app.

## License

MIT
