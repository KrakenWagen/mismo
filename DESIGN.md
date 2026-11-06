# mismo: design

`mismo` is Spanish for "the same": the same routes, links, and navigation in every app, each on its own router. The packages are `@mismo/core` and one `@mismo/*` per router on npm, and the site is mismo.dev. The unscoped `mismo` on npm is held by someone else, with no versions; if npm grants it, the core moves there before 1.0.

One routes folder for a web app and a native app, each on its own router. The routers parse route files themselves; this library is the glue between them. Published as a beta: `@mismo/core` with `@mismo/expo`, `@mismo/tanstack`, `@mismo/next` and `@mismo/react-router` read an Expo Router folder with Expo Router's own parser (or a React Router config) and write each router's routes, with per-router options from the shared route (see [Packages](#packages), [Route options](#route-options) and [Stages](#stages)).

## Packages

A small core, and one package per router, so each is installed only where it is used and released on its router's schedule:

| Package | What it has | Depends on |
|---|---|---|
| `@mismo/core` | the shared model, the config (`@mismo/core/config`), the generator (`@mismo/core/generate`), the CLI (`mismo`), the Vite plugin (`@mismo/core/vite`), the runtime contract (`@mismo/core`, `@mismo/core/contract`), and what adapters are written with (`@mismo/core/adapter`) | React; Vite, optionally |
| `@mismo/expo` | the Expo input (Expo Router's parser), the Expo Router output and rules, its runtime (`@mismo/expo/runtime`), and Metro's wrapper (`@mismo/expo/metro`) | `@mismo/core`, Expo Router `>=58 <59` |
| `@mismo/tanstack` | the TanStack output and rules, its runtime (`@mismo/tanstack/runtime`), and `TanstackRouteOptions` | `@mismo/core`, TanStack Router |
| `@mismo/next` | the Next.js output (an `app/` folder: a server `page.tsx` and `layout.tsx` carrying the route's Next.js options, each rendering a client `mismo-page.tsx` in a Suspense boundary or `mismo-layout.tsx` that hands Next.js's `children` to `Slot`), its options type (`NextServerOptions`) and rules (one page per URL; no `_`, `@`, or `(.` names, which Next.js reads as private, slot, or intercepting folders), its runtime (`@mismo/next/runtime`), and `withMismo` for `next.config.ts` (Turbopack and webpack) | `@mismo/core`, Next.js `>=16 <17` |
| `@mismo/react-router` | the React Router input (a `routes.ts`), its output (a `routes.ts` the app spreads into its own, with stable route ids) and rules, its options types (`ReactRouterRouteOptions`, `ReactRouterServerOptions`), and its runtime (`@mismo/react-router/runtime`) | `@mismo/core`, React Router `>=8 <9` |

Each adapter exports one object: `expo.input()`, `expo.output({ … })`, `expo.rules`. Screens import `Link`, `useNav`, and the rest from `@mismo/core`, which declares them; each app's build points `@mismo/core` at its router's runtime (the Vite plugin's alias, `withMismo`'s Metro resolver), so a second web router needs no change to the screens.

## Why

A React Native and web codebase can share screens, components, and navigation, but the routes are where the sharing stops: each app defines every screen's route in its own router's format, and links with its own router's API.

This library shares the routes too: defined once, and each platform on the router it is best served by. A route file is written in one router's convention. That router's own parser reads it, and the library generates the route files every other target needs, with typed links that only name routes every target has.

## Architecture

```
 input dialect          read by                 shared model             outputs
 ─────────────          ───────                 ────────────             ───────
 Expo Router folder ─▶  Expo's parser      ─┐                       ┌─▶ Expo Router app/
 React Router config ─▶ React Router        ─┼─▶  SharedRoute[]     ─┼─▶ TanStack Start routes
 TanStack folder    ─▶  TanStack's parser  ─┤    + typed routes     ├─▶ Next.js app/
 your own           ─▶  your RouteInput    ─┘                       └─▶ your RouteOutput
```

1. **An input** reads the routes folder with its router's own parser and returns the shared model. It translates; it does not parse.
2. **The shared model** is a route tree: URL patterns, the files behind them, which platforms have a file, and options per output.
3. **An output** turns the model into the files its router reads: re-exports, route wrappers, a route config.
4. **The runtime** is one API for screens (`Link`, `useNav`, `Redirect`, `Slot`, `usePathname`, `useParams`, `useSearchParams`), with one implementation per router, picked by the bundler's conditions (`react-native`, `default`).
5. **The typed routes** come from the model, so they are the same whatever the input: the URL patterns and their params, for every target or for one.

When the input dialect is also an output (Expo routes, Expo app), that output can read the folder as it is, with nothing generated for it.

## The shared model

Based on React Router's route config, `RouteConfigEntry` from `@react-router/dev/routes` ([reference](https://api.reactrouter.com/v7/interfaces/_react_router_dev.routes.RouteConfigEntry.html)): public, documented, stable, and a tree of URL patterns pointing at files, with no router in it. Tools already produce it, such as `@react-router/fs-routes`.

```ts
interface RouteConfigEntry {
  id?: string;            // unique; defaults to the file path without its extension
  path?: string;          // ":id", ":lang?", "*"; none for a pathless layout
  index?: boolean;        // an index route: no children
  caseSensitive?: boolean;
  file: string;           // the route's module
  children?: RouteConfigEntry[];
}
```

Extended with what it has no place for:

```ts
type Platform = "web" | "native" | "ios" | "android";

type SharedRoute = RouteConfigEntry & {
  /** A route group, such as "(tabs)": not in the URL, kept so folder-based outputs rebuild it. */
  group?: string;
  /** Files that replace `file` on a platform. A platform with no file and no `file` lacks the route. */
  platforms?: Partial<Record<Platform, string>>;
  /** Options for one output, read by that output alone, such as TanStack's `{ ssr: false }`. */
  options?: Record<string, unknown>;
  children?: SharedRoute[];
};
```

- **Paths** use React Router's syntax, which is path-to-regexp's: `:param`, `:param?`, `*`. Each output translates: `[id]` for Expo and Next, `$id` for TanStack.
- **Layouts** are entries with children. A group with a layout is a pathless layout entry with its `group` name. A group without a layout adds nothing to the tree; its name is kept on the children's `group`, for outputs that place files in group folders.
- **A plain React Router config is a valid model.** React Router tooling reads ours and ignores the extra fields.

## Interfaces

Built-in inputs and outputs implement the same interfaces a custom one does. A config has one input; each app's build runs one output.

```ts
interface RouteInput {
  name: string;
  /** The routes one target has in `source`, read with this dialect's own parser. */
  read(source: string, target: "web" | "native" | "shared"): SharedRoute[];
  /** A param as this dialect writes it, for the typed routes: `[id]` for Expo Router. */
  param(name: string): string;
}

interface RouteOutput {
  name: string;
  /** The routes it takes: those its platform has. */
  target: "web" | "native";
  /** The router's routes folder, and the app's types file, relative to the app. */
  outDir: string;
  types: string;
  /** What its router cannot express (see "Rules"). */
  rules: RouteRules;
  /** The files to write, by path relative to `outDir`. Unchanged files are not rewritten. */
  emit(routes: SharedRoute[], context: { outDir: string }): Map<string, string>;
}

interface RouteRules {
  router: string;                       // "TanStack Start", for messages
  target: "web" | "native";             // checked on the routes this platform has
  check(routes: SharedRoute[]): string[];  // one message per problem, naming the route
}
```

Synchronous: Metro reads its config without waiting, and the reading is a walk over file names. An input reads the tree one target has, so an output never sees another platform's files. Each output factory also carries its rules (`tanstack.rules`), so a config can name a router without an app's options.

```ts
```

The routes are defined once, in the package that holds them. Each app runs its own output, in its own build: an app generates, watches, and builds only its routes, and the shared package knows nothing of the apps.

```ts
// packages/app/routes.config.ts: the routes, once
import { expo } from "@mismo/expo";
import { tanstack } from "@mismo/tanstack";
import { defineRoutes } from "@mismo/core/config";

export default defineRoutes({
  source: "./routes",
  input: expo.input(),
  // The routers the routes must stay valid for: every app's build checks all of their rules.
  validFor: [tanstack, expo],
  // This package's own types: `shared` for its plain files, a platform's for its platform files.
  types: { shared: "./src/routes.gen.ts", web: "./src/routes.web.gen.ts", native: "./src/routes.native.gen.ts" },
});
```

```ts
// apps/web/vite.config.ts: one output, this app's
import { tanstack } from "@mismo/tanstack";
import { mismo } from "@mismo/core/vite";

plugins: [mismo({ config: "../../packages/app/routes.config.ts", output: tanstack.output({ outDir: "src/routes", types: "src/routes.gen.ts" }) })];
```

```sh
# apps/native: withMismo(getDefaultConfig(__dirname), { config, outDir, types, cwd }) from @mismo/expo/metro;
# scripts use the CLI, with the adapter's package
mismo generate --config ../../packages/app/routes.config.ts --adapter @mismo/expo --out src/app --types src/routes.gen.ts
mismo types --config routes.config.ts   # the shared package's own types
```

The shared types need no outputs: the input reads the tree for `shared` (the routes every platform has) as it does for an app. Each app also gets its own types, written by its output next to its routes: the shared routes plus its platform's own. A new app, on any router, adds an output in its own build, and the shared config does not change.

The runtime is a contract per router, not part of these interfaces: an output names the module that implements it (`runtime: "@mismo/tanstack/runtime"`), the app's build points `@mismo/core` at that module, and a custom output can bring its own.

## Inputs

| Input | Read by | Status of that parser |
|---|---|---|
| Expo Router folder | `getRoutes` in `expo-router/build/getRoutesCore` | Internal: reachable through the package's `build/*` export, not documented, expects Metro's `require.context` (given a stand-in from the file list) |
| React Router config | `routes.ts`, or `flatRoutes()` from `@react-router/fs-routes` | Public, and already the model's shape |
| TanStack folder | `physicalGetRouteNodes` from `@tanstack/router-generator` | Exported, but needs `createTokenRegex`, which is not |
| Next.js `app/` | none: Next.js parses inside its build | Would need our own parser for its rules; later, if asked for |

Each input sits behind its adapter, pins the router versions it was tested with (the Expo input: `expo-router` `>=58 <59`, a range widened as each SDK's parser passes its tests), and keeps fixture tests: a folder in, the model out. A router release that changes its parser breaks one adapter's tests, not the library.

**Expo first.** It is the only dialect with platform files, it is what native developers already write, and its parser gave the right tree for the routes of the app it was built for: layouts, groups, the index, and `[id]` as a param.

## Outputs

- **Expo Router:** a file per route that re-exports the shared module (`export { default } from "…"`), in the model's folders and groups. With the Expo input, the app can read the folder directly instead (Expo's `root` option), as long as the folder follows Expo's rules (see "Platforms").
- **TanStack Start:** a file per route, `export const Route = createFileRoute("<id>")({ ...options, component })`. TanStack's generator then builds its route tree from them, as it does today. Route modules cannot export `Route` themselves: native would import TanStack.
- **React Router:** a `routes.ts` with the model as it is.
- **Next.js App Router:** `page.tsx` and `layout.tsx` re-exports in `app/`. Its runtime needs a `Slot` that renders the layout's `children`, where the other routers render an outlet.

## Route options

A router's per-route options are an export of the shared route under the router's name, typed by its adapter: `export const tanstack = { ssr: false }`. Options that run in the browser go in the route's module; options that run on the server go in its server file, `orgs/[id].server.ts`, which only the web apps' generated files import. Native bundles the module and never the server file, so server code (loaders, metadata, secrets) stays off the phone. The inputs skip server files, so they are never routes.

| Router | Module | Server file |
| --- | --- | --- |
| TanStack Start | `tanstack`: `ssr`, `head` …, spread into `createFileRoute` | `tanstack`: `loader`, `beforeLoad`, spread in too |
| React Router | `reactRouter`: `meta`, `links`, `handle`, client loaders, `ErrorBoundary` … | `reactRouter`: `loader`, `action`, `headers`, `middleware` |
| Next.js | `next`: plain values (metadata, segment config), copied into the generated server page as text | `next`: `generateMetadata`, `generateStaticParams`, any value that needs code |
| Expo Router | its own exports, passed through by `export *` | — |

Outputs read options from the source without running it (`exportedOptions` in `@mismo/core/adapter`), so the object must be written out; a misplaced or unknown option is an error. Next.js can't read a client module from the server, even for one export (the whole module loads, hooks included, and its build refuses it; marked `"use client"`, the export arrives as a client reference and is silently lost), so its plain values are copied as text (`isPlainValue`) and code comes from the server file. Expo Router 58 has server loaders and strips them from client bundles with its own Babel plugin, but only inside its `app/` folder, and only for apps that deploy Expo's server; mismo's native app does neither, so Expo takes no server options yet. TanStack runs a loader in the browser on client-side navigation, so its generated route imports the server file into the client bundle too: the server-only work goes in a `createServerFn` there, which Start's compiler replaces with a call to the server (checked by `examples/tanstack`, where the client bundle has no trace of the function's body). Start's import protection refuses `*.server.*` files in the client, so the app lets the shared routes' through (`importProtection.client.excludeFiles`). Next.js's generated `page.tsx` and `layout.tsx` are server components carrying the route's options, each rendering a client component (`mismo-page.tsx`, `mismo-layout.tsx`) that renders the shared screen, which stays a client component because native runs it too.

## Platforms

Platform files are the library's own rule, the same for every input: `name.web.tsx`, `name.native.tsx`, `name.ios.tsx`, `name.android.tsx`.

- An output takes the most specific file for its platform (`ios` → `native` → plain) and drops the others before its router sees them.
- A route with no file for a platform does not exist there. The typed routes say which routes every platform has.
- Expo Router requires a plain fallback beside a platform file. A folder read by Expo directly (no generated native output) follows that rule; a generated output does not need to, since it only ever sees its own files.

## Rules

The routers do not share every feature:

| Feature | Expo Router | TanStack | Next.js | React Router |
|---|---|---|---|---|
| Static, param, layout, index, group | ✓ | ✓ | ✓ | ✓ (groups as pathless layouts) |
| Two pages at one URL in different groups | ✓ (shared routes) | – | – | – |
| `.` or `$` in a name | ✓ | read as a path separator or a param, without an error | ✓ | ✓ |
| Catch-all (`*`) | ✓ | ✓ | ✓ | ✓ |
| Optional segment (`:x?`) | – | ✓ | `[[...x]]` only | ✓ |
| Not-found, API routes, parallel or intercepting routes | own conventions | own | own | own |

Each output declares what its router cannot express, as `RouteRules`, checked on the routes its platform has. The config names the routers the routes must stay valid for (`validFor`), and **every app's build checks all of their rules**, not only its own output's. Each app runs one output, so a rule checked only by its own router would surface late, in one app: a native developer adding `(a)/about` beside `(b)/about` would see Expo accept it, and only a web build would fail. With the rules shared, the native build fails too, with the route, the URL, and the router that cannot take it:

```
The routes do not fit every router they are for:
  (b)/about: /about is also (a)/about, and TanStack Start allows one page per URL.
```

A project that does not list a router does not get its restrictions: routes only for Expo Router may use its shared routes. Problems are collected across every router and reported at once, before anything is written.

What the input does not read yet (catch-alls, `+` routes, a root layout) is the input's own check, since the model cannot hold it. Router-only conventions (`+not-found`, `@slot`, `(..)`) stay in that router's app folder, next to the generated routes, not in the shared folder.

## Typed routes

From the model, one types file per audience:

- **shared**: routes every platform has. What shared screens may link to.
- **per platform**: those plus the platform's own. What an app's screens may link to.

`Routes` maps each URL pattern to its params, in the pattern syntax of the input dialect, so `Link` and `useParams` read the way the routes folder is written.

## Testing

- **Inputs:** fixture folders in, the model out, per supported router version.
- **Outputs:** a model in, the files out, compared with stored files; then that router's own generator or typecheck run on them, so an output is checked by the router it targets.
- **Round trips:** for each input and output pair used here, the generated routes match today's, file for file.

## Stages

1. ✅ **Today's library on this design.** The Expo input (Expo's parser, with platform files on top), the shared model, the TanStack and Expo outputs, the typed routes, the two interfaces, and a config per routes package with one output per app. Checked against the previous generator on the routes of the app it was built for and on a fixture with params, platform-only routes, and route options: the same files, byte for byte.
2. ✅ **React Router:** input, output, rules, and runtime, checked by an example app React Router builds itself (`examples/react-router`).
3. ✅ **Next.js:** output, rules, runtime, and `withMismo`, checked by an example app Next.js builds and serves itself (`examples/next`): the shared layout renders around the page, with its params.
4. ✅ **Route options:** each router's per-route options from the shared route, with server code in a server file the native app never bundles (see [Route options](#route-options)), checked by the example apps' builds.
5. ✅ **Publishing:** the packages on npm as a beta, a README per package, and the site at mismo.dev.
6. **React Navigation:** an output (navigators and a linking config) and a runtime.
7. **More inputs** (TanStack, Next.js) when someone asks for one. Most teams pick one dialect, so each input mostly costs upkeep.

## Open questions

- **The root layout.** Each app owns its root today, outside the shared folder. Reading the folder directly on native (no generated output) needs the root inside it.
- **Generated files** are written by each build and typecheck, and not committed: the routes folder gets a `.gitignore` listing them, and the typed routes files are the project's to ignore (this repository's does). A typecheck generates first, so it needs no earlier build.
