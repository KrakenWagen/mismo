# @mismo/react-navigation

mismo for React Navigation. [mismo](https://mismo.dev) shares screens, routes and navigation between a React Native app and a web app, each on its own router.

**Docs: [mismo.dev/docs/react-navigation](https://mismo.dev/docs/react-navigation)**

## Install

```sh
pnpm add @mismo/core @mismo/react-navigation @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

## Setup

Wrap Metro's config. It writes the shared routes as navigators into `src/navigation` and runs the shared screens' navigation on React Navigation:

```js
// metro.config.js
const { getDefaultConfig } = require("@react-native/metro-config");
const { withMismo } = require("@mismo/react-navigation/metro");

module.exports = withMismo(getDefaultConfig(__dirname), {
  config: "../../packages/app/routes.config.ts",
  outDir: "src/navigation",
  types: "src/routes.gen.ts",
  cwd: __dirname,
});
```

Then mount the navigation where the app mounts its own, with the URL schemes it opens at:

```tsx
// src/App.tsx
import { Navigation } from "./navigation/routes";

export default function App() {
  return <Navigation linking={{ prefixes: ["acme://"] }} />;
}
```

Each shared layout becomes a navigator: a native stack, unless the layout says otherwise with a `reactNavigation` export:

```tsx
// routes/(tabs)/_layout.tsx
export const reactNavigation = { navigator: "tabs" } satisfies ReactNavigationLayoutOptions;
```

Supports React Navigation `>=7.5 <8`, on React Native 0.79 or later.

See [Getting started](https://mismo.dev/docs/getting-started) for the whole setup: the shared routes package, and each app.

## License

MIT
