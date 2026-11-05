// Modules made by the site's Vite plugins.

declare module "virtual:highlighted-snippets" {
  import type { SnippetName } from "./content/snippets";

  /** Each landing page snippet as highlighted HTML, made at build time (see highlight.plugin.ts). */
  const highlighted: Record<SnippetName, string>;
  export default highlighted;
}
