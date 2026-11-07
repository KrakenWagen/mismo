import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { contentOf } from "@/docs/content";
import { mdxComponents } from "@/docs/mdx-components";
import { neighborsOf, pageOf, sections } from "@/docs/nav";

import { ogImage } from "@/lib/og";
import { site } from "@/lib/site";

export const Route = createFileRoute("/docs/$slug")({
  loader: ({ params }) => {
    const page = pageOf(params.slug);
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const title = `${loaderData.title} · mismo`;
    const url = `${site}/docs/${loaderData.slug}/`;
    const image = ogImage(`docs/${loaderData.slug}`);
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description },
        { property: "og:type", content: "article" },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "og:image:alt", content: `${loaderData.title}: ${loaderData.description}` },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: loaderData.description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: DocPage,
  notFoundComponent: () => (
    <main className="min-w-0 flex-1 py-16 lg:pl-12">
      <h1 className="font-display text-4xl">Not found</h1>
      <p className="mt-3 text-muted-foreground">There's no docs page here.</p>
    </main>
  ),
});

function DocPage() {
  const page = Route.useLoaderData();
  const content = contentOf(page.slug);
  if (!content) throw new Error(`The docs list ${page.slug}, but src/content/docs has no ${page.slug}.mdx.`);

  const { default: Content, toc } = content;
  const { previous, next } = neighborsOf(page.slug);
  // By slug: in the browser, `page` is a copy from the loader, not the object in `sections`.
  const section = sections.find((s) => s.pages.some((p) => p.slug === page.slug));

  return (
    <>
      <main className="min-w-0 flex-1 py-10 lg:px-12 lg:py-12">
        <article className="mx-auto max-w-3xl">
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.16em] text-brand">{section?.title}</p>
          <h1 className="font-display text-5xl leading-none tracking-tight">{page.title}</h1>
          <p className="mt-4 text-lg text-pretty text-muted-foreground">{page.description}</p>
          <div className="mt-10">
            <Content components={mdxComponents} />
          </div>

          <nav className="mt-16 grid gap-3 border-t pt-8 sm:grid-cols-2">
            {previous && (
              <Link
                to="/docs/$slug"
                params={{ slug: previous.slug }}
                className="group rounded-xl border p-4 transition hover:border-foreground/25"
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowLeft className="size-3.5" /> Previous
                </span>
                <span className="mt-1 block font-medium">{previous.title}</span>
              </Link>
            )}
            {next && (
              <Link
                to="/docs/$slug"
                params={{ slug: next.slug }}
                className="group rounded-xl border p-4 text-right transition hover:border-foreground/25 sm:col-start-2"
              >
                <span className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                  Next <ArrowRight className="size-3.5" />
                </span>
                <span className="mt-1 block font-medium">{next.title}</span>
              </Link>
            )}
          </nav>
        </article>
      </main>

      {toc.length > 0 && (
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 overflow-y-auto py-12 xl:block">
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            On this page
          </p>
          <ul className="space-y-2 text-sm">
            {toc.map((entry) => (
              <li key={entry.id} className={entry.depth === 3 ? "pl-3" : undefined}>
                <a href={`#${entry.id}`} className="text-muted-foreground transition hover:text-foreground">
                  {entry.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </>
  );
}
