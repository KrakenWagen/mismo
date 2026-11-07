# @mismo/ui

[React Strict DOM](https://facebook.github.io/react-strict-dom/) with Tailwind's `className`. Import everything from here, on every platform:

```tsx
import { css, html } from "@mismo/ui";

<html.div className="flex gap-2 p-4 dark:bg-zinc-800">
  <html.span style={styles.title}>Hello</html.span>
</html.div>;
```

## How it works

**On the web, nothing from this package ships.** `@mismo/ui/babel` compiles imports straight to React Strict DOM and adds each `className` to the classes it already merges, and real Tailwind generates the CSS.

**On native, Uniwind compiles Tailwind's CSS to a stylesheet at build time.** No CSS is parsed on the device, but each element does look up its classes when it renders, in `src/index.native.ts`. Results are cached per class string. The result goes through React Strict DOM's `style`, so `flex`, inherited text styles and the rest behave as they do on the web. React Strict DOM's own `css.create` also runs on the device: only the web compiles it away.

## Rules

- **`className` beats `style`** when both set the same property, on every platform.
- **Write elements as `<html.div />`.** Spreads work, and the last `className` or `style` wins, as usual in JSX. But the web compiler only sees JSX, so `className` is lost on the web with `const Tag = html.div` or `createElement(html.div)`, and React Strict DOM logs an error in development.
- **`display: flex` is needed for `gap`, `flex-*` and so on**, as on the web. Unlike on React Native, `flex` means a row by default.
- **Every element is `border-box`**, which Tailwind expects.
- **A `flex-col` taller than its parent shrinks its children on native.** Browsers won't shrink them below their content, so add `shrink-0` or scroll.

## States

`active:`, `focus:` and `disabled:` work on every platform. The web uses CSS. On native, each element's classes become React Strict DOM's `{ default, ":active", ":focus" }` shape, which it already tracks for `css.create`. Only elements with those classes listen for presses or focus, and a press re-renders only that element. `hover:` isn't supported on native: for iPad pointers and Android mice, use `css.create` with `":hover"`.

This relies on three of Uniwind's internals, listed in `src/uniwind-internals.d.ts`, which is why Uniwind is pinned to an exact version. `pnpm test` fails if an upgrade changes them, or if React Strict DOM's `merge()` stops taking compiled classes. It doesn't render on a device, so check `active:` and `focus:` there too after an upgrade.

## Which classes work

All of Tailwind's, on the web. On native, most do, and [CLASSES.md](https://github.com/KrakenWagen/mismo/blob/main/packages/ui/CLASSES.md) lists the ones that don't, by Tailwind's own groups. The biggest gaps are `hover:`, `group-*:` and `peer-*:`, grid, `space-*` and `divide-*` (use `gap-*`), and `truncate` and `line-clamp-*`. A class that Uniwind doesn't support does nothing, without an error.

## Safe areas

`pt-safe`, `pb-safe` and the rest work on every platform.

**On native there's nothing to set up.** `withUI` wraps your app to follow the device's insets, using React Native's `AppRegistry.setWrapperComponentProvider`. If your app also calls that, it replaces this wrapper, so call `Uniwind.updateInsets()` yourself.

**On the web they're 0 until you ask for edge-to-edge.** The browser keeps your page inside the safe area by default, so that's correct. To draw under the notch, which affects the whole page, add `viewport-fit=cover`:

```ts
// Next.js: app/layout.tsx
export const viewport = { viewportFit: "cover" };

// TanStack Start: head() in your root route
meta: [{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" }]
```

## Uniwind on the web

Web apps use Uniwind's CSS for its variants (`ios:`, `web:`, `dark:` and so on) and safe-area utilities. None of its code reaches the bundle, and Tailwind only outputs the classes you use.

Installing this package does install Uniwind and React Native, on the web too. React Strict DOM already requires React Native as a peer.

## Setup

Each app has a global CSS file. Import it once, in your root layout. Use `@source` for code outside the app, like a shared package.

```css
@import "@mismo/ui/tailwind.css";
@source "../../../packages/app";
```

Keep your own resets in `@layer base` there, as rules outside a layer beat every utility.

Then add what your stack needs:

**Vite** (TanStack Start and others), which needs `vite-plugin-babel` too

```ts
import { ui } from "@mismo/ui/vite";

export default defineConfig({
  plugins: [ui(), tanstackStart(), react()],
});
```

**Next.js**, which needs its two config files to turn on Babel and PostCSS

```ts
// next.config.ts
import { withUI } from "@mismo/ui/next";
export default withUI(config);

// babel.config.js
module.exports = { presets: ["next/babel", "@mismo/ui/babel"] };

// postcss.config.js
module.exports = { plugins: { "@mismo/ui/postcss": {} } };
```

**Expo**, which also needs `react-native-safe-area-context`

```js
// metro.config.js, as the outermost wrapper
const { withUI } = require("@mismo/ui/metro");
module.exports = withUI(config, { cssEntryFile: "./src/global.css" });
```

## Files

```
CLASSES.md            # Which Tailwind classes work on native
src/index.ts          # Web entry, and the types for every platform (published built, in dist/)
src/index.native.ts   # Native entry: `className` through Uniwind
src/safe-areas.native.ts  # Native: keeps safe-area utilities in step with the device
src/states.ts         # Native: `active:` and `focus:` in React Strict DOM's shape
src/uniwind-internals.d.ts  # The Uniwind internals it relies on
strict-dom/           # What compiled imports point to, so apps don't depend on React Strict DOM
css/tailwind.css      # Tailwind, Uniwind's CSS, and the order of the CSS layers
integrations/babel.cjs  # Web compiler
integrations/postcss.cjs  # Web CSS
integrations/vite.cjs  # Vite setup
integrations/next.cjs  # Next.js setup
integrations/metro.cjs  # Native setup
```
