import type { ComponentType } from "react";
import type { MDXComponents } from "mdx/types";

import type { TocEntry } from "../../mdx.config.ts";

type DocModule = {
  default: ComponentType<{ components?: MDXComponents }>;
  toc: TocEntry[];
};

// Every page, compiled at build time. Only the docs route imports this, so the landing page's
// bundle has none of it.
const modules = import.meta.glob<DocModule>("../content/docs/*.mdx", { eager: true });

export function contentOf(slug: string): DocModule | undefined {
  return modules[`../content/docs/${slug}.mdx`];
}
