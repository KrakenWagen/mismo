import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { highlightedSnippets } from "./highlight.plugin.ts";
import { mdxOptions } from "./mdx.config.ts";

export default defineConfig({
  server: { port: 3010 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    highlightedSnippets(),
    // Before React's plugin, which then treats the compiled MDX as any other component.
    { enforce: "pre", ...mdx(mdxOptions) },
    // The site is static: every page is rendered at build time, found by following links.
    tanstackStart({ prerender: { enabled: true, crawlLinks: true } }),
    // React's plugin has to come after Start's.
    viteReact({ include: /\.(mdx|tsx?)$/ }),
  ],
});
