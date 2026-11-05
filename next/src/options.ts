import type { Metadata, ResolvingMetadata, ResolvingViewport, Viewport } from "next";

/** What Next.js passes `generateMetadata` and `generateViewport`: the route's params and query. */
type RouteProps = {
  params: Promise<Record<string, string | string[] | undefined>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Route segment config: written as literals, since Next.js reads it without running the file. */
type SegmentConfig = {
  dynamic?: "auto" | "force-dynamic" | "error" | "force-static";
  dynamicParams?: boolean;
  revalidate?: number | false;
  fetchCache?: "auto" | "default-cache" | "only-cache" | "force-cache" | "force-no-store" | "default-no-store" | "only-no-store";
  runtime?: "nodejs" | "edge";
  preferredRegion?: "auto" | "global" | "home" | string | string[];
  maxDuration?: number;
};

/**
 * Next.js's options for a shared route that are plain values, exported as `next` from the route's
 * own module: metadata and segment config. The module is a client component, which Next.js can't
 * read from the server, so mismo copies each value into the generated server page as written. Each
 * must stand on its own: no names, calls or functions. Anything that needs code goes in the route's
 * server file (`NextServerOptions`).
 *
 *     export const next = { metadata: { title: "Settings" }, revalidate: 60 } satisfies NextRouteOptions;
 */
export type NextRouteOptions = SegmentConfig & {
  metadata?: Metadata;
  viewport?: Viewport;
};

/**
 * Next.js's options for a shared route that run on the server, exported as `next` from the route's
 * server file (`orgs/[id].server.ts`), which only the web app's generated server components import:
 * functions such as `generateMetadata` and `generateStaticParams`, and any value that needs code.
 *
 *     export const next = {
 *       async generateMetadata({ params }) {
 *         const { id } = await params;
 *         return { title: `Organization ${id}` };
 *       },
 *     } satisfies NextServerOptions;
 */
export type NextServerOptions = SegmentConfig & {
  metadata?: Metadata;
  generateMetadata?: (props: RouteProps, parent: ResolvingMetadata) => Metadata | Promise<Metadata>;
  viewport?: Viewport;
  generateViewport?: (props: RouteProps, parent: ResolvingViewport) => Viewport | Promise<Viewport>;
  generateStaticParams?: () => Record<string, string | string[]>[] | Promise<Record<string, string | string[]>[]>;
};
