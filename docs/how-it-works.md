# How mismo works

This page explains the ideas behind mismo and what happens between a route file and a running screen. For setup steps and the full reference, see [mismo.dev/docs](https://mismo.dev/docs).

"mismo" is Spanish for "the same": the same routes, links and navigation in every app, each on its own router.

## The idea

A React Native app and a web app can already share components, hooks and data fetching. The routes are where the sharing stops. Every screen has a route, and each app defines it in its own router's format and links to it with its own router's API. So the screen's code is shared, and the screen's place in the app is written twice.

mismo shares the place too. You define a route once, as a file, and each app gets the route files its own router expects. Screens link to each other with one API, and each app runs that API on its router.

mismo is not a router. It is the glue between routers, and a few decisions follow from that.

## Principles

**Every app keeps its own router.** Native stays on Expo Router and the web stays on Next.js, TanStack Start or React Router. You keep their server rendering, data loading, deploy targets and tooling. Swapping one web router for another does not change your screens.

**Use each router's own parser.** mismo does not invent a route format and does not parse files itself. Routes are written in one router's convention, and that router's own parser reads them. mismo translates the result. When a router changes how it parses, one adapter's tests fail, not the whole library.

**Generate ordinary files.** An app's build writes normal route files for its router, next to the routes the app already has. The router's own tooling, such as TanStack's route tree generator or React Router's typegen, works on them as on any other route.

**Check every router's limits, everywhere.** A route that one router can't take should fail where you make it, not later in an app you weren't working on.

**Server code never ships to the phone.** The native app bundles every route's module. So code that must run on the server lives in a separate file the native app never imports.

## The pipeline

```
 routes folder         read by                  shared model            each app's output
 ─────────────         ───────                  ────────────            ─────────────────
 Expo Router folder ─▶ Expo's parser       ─┐                       ┌─▶ Expo Router files
 React Router config ─▶ React Router        ─┼─▶  tree of routes   ──┼─▶ Next.js app/ files
 your own format    ─▶ your input           ─┘    + typed routes      ├─▶ TanStack Start files
                                                                      └─▶ React Router routes.ts
```

1. **An input** reads the routes with its router's own parser and returns the shared model. It translates and does not parse.
2. **The shared model** is a tree of routes. Each has a URL pattern, the file behind it, which platforms have a file for it, and the options each router should get. It is based on React Router's `RouteConfigEntry`, so a plain React Router config is already a valid model.
3. **An output** turns the model into the files one router reads. Each app runs one output, in its own build.
4. **The runtime** is the one navigation API screens use (`Link`, `useNav`, `useParams` and the rest), with one implementation per router.
5. **The typed routes** come from the model, so they are the same whichever format you write the routes in.

The shared package knows nothing about the apps. It holds the screens and a `routes.config.ts`. Each app reads that config and writes its own routes, so adding an app never changes the shared package.

## One route, four apps

Take one shared route, `orgs/[id].tsx`. Each app's build writes the files its router needs. These are simplified, and your build writes the real ones.

| App | What the build writes |
| --- | --- |
| Expo Router | A file that re-exports the shared module: `export { default } from "…/orgs/[id]"`, in the same folders and groups. |
| TanStack Start | A file route: `export const Route = createFileRoute("/orgs/$id")({ component })`. TanStack's own generator then builds its route tree from these. |
| Next.js | A server `page.tsx` that renders a client `mismo-page.tsx` inside a Suspense boundary. Layouts hand Next.js's `children` to `Slot`. |
| React Router | A `routes.ts` the app spreads into its own, with stable route ids. |

The route's module never imports a router. If it did, the native app would import TanStack or Next.js. The generated files do that work on the web side only.

## The runtime

Screens import `Link`, `useNav` and `useParams` from `@mismo/core`. In the shared package that module only declares them. Each app's build points `@mismo/core` at its router's runtime, with a Vite alias, Next.js's `withMismo`, or Metro's resolver. So the same screen file runs on Expo Router in one app and on Next.js in another, and nothing in the screen changes.

Layouts are routes with children. They render their page with `Slot`, which each runtime implements the way its router renders a child: an outlet on most, `children` on Next.js.

## Typed routes

From the model, the build writes types:

- **Shared routes:** the routes every platform has. A shared screen can only link to these.
- **Per platform:** those plus the platform's own. An app's own screens can link to all of them.

`Link`, `useNav`, `useParams` and `Redirect` read these types, so a link to a route that doesn't exist, or a link missing a param, is a type error. A route that exists only on the web can't be linked from a shared screen.

## Platform files

A suffix replaces a route's file on one platform, or makes a route exist on one platform only: `pricing.web.tsx`, `scan.native.tsx`, `home.ios.tsx`. Each app takes the most specific file for its platform and never sees the others. A route with no file for a platform does not exist there.

## Rules: checking every router

The routers don't support the same things. Expo Router allows two pages at one URL in different groups, and the web routers don't. TanStack Start reads `.` in a name as a path separator, and Next.js treats a leading `_` as a private folder. Each of these would quietly change what a route means.

Each adapter declares what its router can't express. The config lists the routers the routes must stay valid for, and every app's build checks all of them:

```text
The routes do not fit every router they are for:
  (b)/about: /about is also (a)/about, and TanStack Start allows one page per URL.
```

A native developer who adds a route the web can't take finds out in the native build. Problems from every router are reported together, before anything is written. A router that isn't listed adds no limits: a project for Expo Router only can use everything Expo Router allows.

## Route options and server files

Each router has settings per route: page titles, loaders, caching, whether to render on the server. A shared route sets them for each router by name, next to the screen. Each app passes on its own router's and ignores the rest.

Where an option goes depends on where it runs, because the native app bundles the route's module:

- **In the route's module:** options that can ship to every platform, such as `ssr: false` or a plain page title.
- **In the route's server file**, `orgs/[id].server.ts`: code that must stay off the phone, such as loaders, `generateMetadata` and database access. Only the web apps' generated files import it. The native app never sees it, and it isn't a route.

The routers differ in how they let code stay on the server, and mismo follows each one:

- **Next.js** reads options only in server files, and can't read a client module from the server. So plain values in the module are copied into the generated server page as text, and anything that needs code comes from the server file. The generated `page.tsx` is a server component, and it renders the shared screen as a client component, because native runs the screen too.
- **React Router** has server-only exports (`loader`, `action`, `headers`, `middleware`). They come from the server file. Browser options like `meta` stay in the module.
- **TanStack Start** runs a loader in the browser as well, on client-side navigation. `loader` and `beforeLoad` come from the server file, so the native app never gets them, but they are in the web app's browser bundle. Work that must stay on the server goes in a `createServerFn` in that file, which TanStack's compiler replaces with a call to the server.

mismo reads options from the source without running it, so each options object has to be written out. A misplaced option stops the build and says where to move it.

## Generated files

Builds write the routes, so they aren't committed. Route files start with a `// Generated by mismo` line and git skips them without setup. When a route is deleted from the shared folder, its generated file goes too. Your own route files in the same folder are never touched: if one sits where a generated file would go, the build stops and names both. In dev, the files are kept up to date as route files come and go.

## Extending mismo

The built-in inputs and outputs use the same interfaces a custom one does. An adapter is one object with a router's rules and an input (how routes are written), an output (how a router runs them), or both, all from `@mismo/core/adapter`. See [adapters](https://mismo.dev/docs/adapters).

## What it doesn't do yet

mismo is in beta. The main gaps are catch-all and `+` routes in a shared folder, a shared root layout, and React Navigation on native. See [limits](https://mismo.dev/docs/rules#limits) for the whole list and what to do instead.
