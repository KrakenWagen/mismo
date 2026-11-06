# @mismo/expo

mismo for Expo Router. [mismo](https://mismo.dev) shares screens, routes and navigation between a React Native app and a web app, each on its own router.

**Docs: [mismo.dev/docs/expo-router](https://mismo.dev/docs/expo-router)**

## Install

```sh
npm i @mismo/core @mismo/expo
```

## Setup

Wrap Metro's config. It writes the shared routes into Expo Router's folder and runs the shared screens' navigation on Expo Router:

```js
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withMismo } = require("@mismo/expo/metro");

module.exports = withMismo(getDefaultConfig(__dirname), {
  config: "../../packages/app/routes.config.ts",
  outDir: "src/app",
  types: "src/routes.gen.ts",
  cwd: __dirname,
});
```

You can also write your shared routes as a folder in Expo Router's format, whichever routers run them: `expo.input()` in `routes.config.ts`. Supports Expo Router `>=58 <59`.

A shared route's exports pass through to Expo Router, so `unstable_settings` and `ErrorBoundary` work as usual. A route's server file (`orgs/[id].server.ts`) is for the web routers and never reaches the native app.

See [Getting started](https://mismo.dev/docs/getting-started) for the whole setup: the shared routes package, and each app.

## License

MIT
