# create-mismo

Start a [mismo](https://mismo.dev) app: a native app and a web app that share their screens and routes, each on its own router.

```sh
pnpm create mismo my-app
```

It asks which apps to keep, then sets up the starter: a small notes app with the same routes and screens on Expo Router, and on Next.js or TanStack Start.

## Options

Anything you pass is not asked.

| Option | |
| --- | --- |
| `--web <apps>` | The web apps to keep: `next`, `tanstack` or `both`. |
| `--native` / `--no-native` | Keep the Expo native app, or remove it. |
| `--install` / `--no-install` | Install dependencies with pnpm, or skip it. |
| `--git` / `--no-git` | Start a git repository, or skip it. |
| `-y`, `--yes` | Take the defaults for anything not given, and ask nothing. |
| `--template <source>` | The starter: `owner/repo#ref` on GitHub, or a folder. |

```sh
pnpm create mismo my-app --web next --no-native --yes
```

Without a terminal, `create-mismo` asks nothing and takes the defaults: both web apps, the native app, install and git.

## What it does

1. Downloads the [starter](https://github.com/KrakenWagen/mismo-starter), without its git history.
2. Removes the apps you didn't keep, with the code for them: their scripts, dependencies, and route options.
3. Renames the starter's packages to your project's name: `@acme/app` becomes `@my-app/app`.
4. Installs dependencies and starts a git repository, unless you said not to.

It needs Node.js 22.18 or later, and pnpm 10 or later to install. The starter is a pnpm workspace.

See [Getting started](https://mismo.dev/docs/getting-started) to learn how the apps fit together.

## License

MIT
