# Contributing to mismo

Thanks for helping. This page covers how the repository is laid out and how to work on it. For the ideas behind mismo, read [How it works](docs/how-it-works.md) first.

## The repository

| Folder | What it is |
| --- | --- |
| `packages/core` | `@mismo/core`: the shared API, config, Vite plugin and CLI |
| `packages/expo`, `packages/react-navigation`, `packages/next`, `packages/tanstack`, `packages/react-router` | `@mismo/*`: one package per router |
| `packages/create-mismo` | `pnpm create mismo`: sets up the [starter](https://github.com/KrakenWagen/mismo-starter) with the apps a person picks |
| `examples` | The shared routes, and apps that build them on Next.js, TanStack Start and React Router |
| `tests` | Tests across the packages |
| `site` | [mismo.dev](https://mismo.dev): the landing page and docs |
| `configs` | Shared TypeScript and build configs |
| `docs` | Longer explanations |

The examples are the best test of the idea: one set of routes in `examples/shared`, built by each framework's own build.

## Setup

You need Node.js 22.18 or later and pnpm 10 ([mise](https://mise.jdx.dev) reads `mise.toml` for both).

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm dev          # the site, at localhost:3010
```

Packages are used from source inside this workspace, so there is no build step while you work. To build the packages the way they are published:

```sh
pnpm build        # compiles each package to its dist with tsdown
```

## Making a change

- **A router's behavior** lives in that router's package: its output, its rules and its runtime. Adding a router means adding a package with the same shape.
- **Tests** go in `tests/src`. Outputs are tested by giving a model and comparing the files written. Where a router can check the result itself, the example apps do: they are built and served by Next.js, TanStack Start and React Router, and the React Navigation one is typechecked against the real packages.
- **Docs** live in `site/src/content/docs`. Each package's `README.md` is what npm shows, so keep it short and point to the site.
- **Run `pnpm typecheck` and `pnpm test`** before you open a pull request.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
