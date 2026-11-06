# mismo

Write your screens once. Run them on any stack.

mismo shares screens, routes and navigation between a React Native app and a web app, while each app keeps its own router: Expo Router on native, and Next.js, TanStack Start or React Router on the web.

Docs: [mismo.dev](https://mismo.dev). Design notes: [DESIGN.md](DESIGN.md).

## This repository

| Folder | What it is |
| --- | --- |
| `packages/core` | `@mismo/core`: the shared API, config, Vite plugin and CLI |
| `packages/expo`, `packages/next`, `packages/tanstack`, `packages/react-router` | `@mismo/*`: one package per router |
| `tests` | Tests across the packages |
| `examples` | Shared routes, and apps that build them on Next.js and React Router |
| `site` | mismo.dev: the landing page and docs |
| `scripts` | Build helpers |

## Working on it

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm dev          # the site, at localhost:3010
```

Packages are used from source inside this workspace. Publishing compiles them to `dist` first.

```sh
pnpm release --otp <code>   # publish the packages, tagged beta
pnpm site:deploy            # build the site and deploy it to mismo.dev
```

## License

MIT
