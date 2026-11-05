// How the docs' MDX is compiled: GitHub's tables, heading ids, a table of contents per page, and
// code highlighted at build time, so Shiki never reaches the browser.
import type { Options } from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import type { ShikiTransformer } from "shiki";
import { valueToEstree } from "estree-util-value-to-estree";
import type { Element, ElementContent, Root } from "hast";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";

export type TocEntry = { depth: 2 | 3; id: string; title: string };

function textOf(node: ElementContent | Element): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(textOf).join("");
  return "";
}

/** Adds `export const toc`, the page's h2 and h3 headings, for the "On this page" list. */
function rehypeToc() {
  return (tree: Root) => {
    const toc: TocEntry[] = [];
    visit(tree, "element", (node) => {
      if ((node.tagName === "h2" || node.tagName === "h3") && typeof node.properties.id === "string") {
        toc.push({ depth: node.tagName === "h2" ? 2 : 3, id: node.properties.id, title: textOf(node) });
      }
    });

    tree.children.unshift({
      type: "mdxjsEsm",
      value: "",
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [
            {
              type: "ExportNamedDeclaration",
              specifiers: [],
              attributes: [],
              declaration: {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  { type: "VariableDeclarator", id: { type: "Identifier", name: "toc" }, init: valueToEstree(toc) },
                ],
              },
            },
          ],
        },
      },
    } as unknown as Root["children"][number]);
  };
}

/** `title="routes.config.ts"` after a code fence's language becomes the block's file name. */
function titleOf(meta: string | undefined): string | undefined {
  return meta?.match(/title="([^"]+)"/)?.[1];
}

export const mdxOptions: Options = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [
    rehypeSlug,
    rehypeToc,
    [
      rehypeShiki,
      {
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: "light",
        transformers: [
          {
            pre(node) {
              const title = titleOf(this.options.meta?.__raw);
              if (title) node.properties["data-title"] = title;
            },
          } satisfies ShikiTransformer,
        ],
      },
    ],
  ],
};
