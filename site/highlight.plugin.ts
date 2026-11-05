// The landing page's code samples, highlighted once while the site builds and served as a module:
// `import highlighted from "virtual:highlighted-snippets"`. The site is static, so nothing may run
// on a server; Shiki stays out of the browser bundle too, since only its output is imported.
import { codeToHtml } from "shiki";
import type { Plugin } from "vite";

import { snippets } from "./src/content/snippets.ts";

const id = "virtual:highlighted-snippets";
const resolved = `\0${id}`;

export function highlightedSnippets(): Plugin {
  return {
    name: "highlighted-snippets",
    resolveId: (source) => (source === id ? resolved : undefined),
    async load(source) {
      if (source !== resolved) return;

      const entries = await Promise.all(
        Object.entries(snippets).map(async ([name, { code, lang }]) => {
          const html = await codeToHtml(code, {
            lang,
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: "light",
          });
          return [name, html] as const;
        }),
      );
      // Rebuilt when the snippets change in dev.
      this.addWatchFile(new URL("./src/content/snippets.ts", import.meta.url).pathname);
      return `export default ${JSON.stringify(Object.fromEntries(entries))};`;
    },
  };
}
