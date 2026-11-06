# mismo

Write your screens once. Run them on any stack.

mismo shares screens, routes and navigation between a React Native app and a web app, while each app keeps its own router: Expo Router on native, and Next.js, TanStack Start or React Router on the web.

**Docs: [mismo.dev](https://mismo.dev)**

> mismo is in beta. APIs can still change before 1.0.

## The problem

Teams with a React Native app and a web app already share components, hooks, data fetching and design tokens. What they can't share is the screen itself: each app defines the screen's route in its own router's format, links to it with its own `Link`, and wires navigation into shared code by hand.

mismo shares that too. A screen, the route it lives at, its layout and every link in it are written once. Each app adds them to its own router, next to the routes it already has.

## What it looks like

The routes live in one shared package. Each app has a line or two of config and its own root layout, and nothing else:

```text
packages/app/  # every screen and route, once
├── routes.config.ts
└── routes/
    ├── index.tsx            # /
    └── (app)/
        ├── _layout.tsx          # a layout shared by the routes below it
        ├── settings.tsx         # /settings
        └── orgs/
            ├── [id].tsx             # /orgs/:id
            └── [id].server.ts       # that route's server code, for the web app only

apps/web/      # Next.js
├── next.config.ts       # adds the shared routes to the build (withMismo)
└── app/layout.tsx       # the app's own root layout

apps/native/   # Expo Router
├── metro.config.js      # adds the shared routes to the build (withMismo)
└── src/app/_layout.tsx  # the app's own root layout
```

When either app builds, its router gets the route files it needs, written next to the app's own. They are generated and not committed. Each app can still have routes of its own beside them.

## A screen

A route is a file in the shared package. Its default export is the screen:

```tsx
// packages/app/routes/orgs/[id].tsx
import { Link, useParams } from "@mismo/core";

export default function Org() {
  const { id } = useParams("/orgs/[id]");

  return (
    <main>
      <h1>Organization {id}</h1>
      <Link to="/">All organizations</Link>
    </main>
  );
}
```

That file is the screen and its route (`/orgs/:id`). The native app and the web app both have it.

## One navigation API

Screens import `Link`, `useNav`, `useParams`, `Redirect`, `BackLink`, `Slot`, `usePathname` and `useSearchParams` from `@mismo/core`. They are the same in every app, and each app runs them on its own router: a `Link` in a shared screen is a Next.js link on the web and an Expo Router link on the phone.

They are typed from your routes. A link to a route that doesn't exist, or one missing its params, is a type error:

```tsx
<Link to={{ href: "/orgs/[id]", params: { id } }}>Acme</Link>  // ok
<Link to={{ href: "/orgs/[id]" }}>Acme</Link>                  // error: missing params
<Link to="/nope">Acme</Link>                                   // error: not a route
```

A shared screen can only link to routes every app has, so a link can't point at a page that exists on one platform only.

## Different screens per platform

When the web and the phone need different screens, add a file for one platform. Each app takes the most specific file for its platform:

```text
routes/
├── pricing.tsx         # every app
├── pricing.web.tsx     # replaces pricing.tsx on the web
├── billing.web.tsx     # /billing exists on the web only
└── scan.native.tsx     # /scan exists on native only
```

## Setting it up

In the package that holds your screens, install the core and the adapter of each router your apps use:

```sh
pnpm add @mismo/core @mismo/expo @mismo/next
```

One config says how the routes are written and which routers they have to work on:

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

Each app then adds one call to its build config, and the shared routes appear in its router: `withMismo` for Next.js and Metro, or mismo's Vite plugin for TanStack Start and React Router. [Getting started](https://mismo.dev/docs/getting-started) sets up a shared package, a web app and an Expo app, with the setup for each web router.

Requires Node.js 22.18 or later and React 19.

## What you keep

- **Your frameworks.** The web app is a normal Next.js, TanStack Start or React Router app, with its own rendering, data loading and deploy. The native app is a normal Expo Router app.
- **Your routers' features.** A shared route can set metadata, loaders and caching for each router by name, and keep server code in a file the native app never bundles.
- **Platform differences.** A screen can have a `.web.tsx` or `.native.tsx` version, or exist on one platform only.
- **Your own routes.** Each app's own routes sit next to the shared ones, so you can adopt mismo one screen at a time.

## Packages

| Package | Router |
| --- | --- |
| [`@mismo/core`](packages/core) | The shared API, config, Vite plugin and CLI |
| [`@mismo/expo`](packages/expo) | Expo Router (iOS and Android) |
| [`@mismo/next`](packages/next) | Next.js (App Router) |
| [`@mismo/tanstack`](packages/tanstack) | TanStack Start |
| [`@mismo/react-router`](packages/react-router) | React Router (framework mode) |

## Learn more

- [mismo.dev/docs](https://mismo.dev/docs): setup and reference for every package.
- [Rules and limits](https://mismo.dev/docs/rules#limits): what mismo doesn't do yet, and what to do instead.
- [How it works](docs/how-it-works.md): the ideas behind mismo, and how a route becomes a screen in each app.
- [Contributing](CONTRIBUTING.md): working on this repository.

## License

MIT
