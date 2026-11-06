# @mismo/core

Write your screens once. Run them on any stack.

mismo shares screens, routes and navigation between a React Native app and a web app, while each app keeps its own router: Expo Router on native, and Next.js, TanStack Start or React Router on the web.

**Docs: [mismo.dev](https://mismo.dev)**

## Install

In the package that holds your screens, install the core and the adapter of every router your apps use:

```sh
pnpm add @mismo/core @mismo/expo @mismo/next
```

## Define the routes once

```ts
// packages/app/routes.config.ts
import { expo } from "@mismo/expo";
import { next } from "@mismo/next";
import { defineRoutes } from "@mismo/core/config";

export default defineRoutes({
  source: "./routes",
  input: expo.input(),
  validFor: [next, expo],
});
```

Here the routes are a folder in Expo Router's format (`index.tsx`, `orgs/[id].tsx`, `_layout.tsx`, `(group)/`), whichever routers run them. A React Router config works too.

## Write screens with one navigation API

```tsx
// packages/app/routes/orgs/[id].tsx
import { Link, useParams } from "@mismo/core";

export default function Org() {
  const { id } = useParams("/orgs/[id]");
  return <Link to="/settings">Settings of {id}</Link>;
}
```

`Link`, `useNav`, `useParams` and the rest are typed from your routes, and each app runs them on its own router.

## Set each router's options

A route can set each router's own options beside the screen, and keep server code in a file beside it that the native app never bundles: `orgs/[id].server.ts`. See [route options](https://mismo.dev/docs/route-options).

## Run them in each app

Each app adds one line to its build: `withMismo` for Metro or Next.js, or mismo's Vite plugin for TanStack Start and React Router. See [Getting started](https://mismo.dev/docs/getting-started).

## Packages

| Package | Router |
| --- | --- |
| `@mismo/core` | The shared API, config, Vite plugin and CLI |
| [`@mismo/expo`](https://www.npmjs.com/package/@mismo/expo) | Expo Router (iOS & Android) |
| [`@mismo/next`](https://www.npmjs.com/package/@mismo/next) | Next.js |
| [`@mismo/tanstack`](https://www.npmjs.com/package/@mismo/tanstack) | TanStack Start |
| [`@mismo/react-router`](https://www.npmjs.com/package/@mismo/react-router) | React Router |

Requires Node.js 22.18 or later and React 19. mismo is pre-1.0: APIs can still change.

## License

MIT
