import type { ComponentType } from "react";
import type {
  ActionFunction,
  ClientActionFunction,
  ClientLoaderFunction,
  HeadersFunction,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
  MiddlewareFunction,
  ShouldRevalidateFunction,
} from "react-router";

/** The loader in a route's server options, for typing what reads its data. */
type LoaderOf<Server> = Server extends { loader: infer Loader extends LoaderFunction } ? Loader : unknown;

/**
 * React Router's options for a shared route that run in the browser, exported from the route's
 * module as `reactRouter`. The generated route module passes each on as the route export of its
 * name. The native app ignores the export.
 *
 * Give it the type of the route's server options, with a type-only import, and what reads the
 * loader's data is typed from it: `meta` gets the loader's return as `loaderData`. A type-only
 * import disappears from the built code, so the native app still never bundles the server file.
 *
 *     import type { reactRouter as server } from "./[id].server";
 *
 *     export const reactRouter = {
 *       meta: ({ loaderData }) => [{ title: loaderData?.title }],
 *     } satisfies ReactRouterRouteOptions<typeof server>;
 */
export type ReactRouterRouteOptions<Server extends ReactRouterServerOptions = ReactRouterServerOptions> = {
  meta?: MetaFunction<LoaderOf<Server>>;
  links?: LinksFunction;
  handle?: unknown;
  clientLoader?: ClientLoaderFunction;
  clientAction?: ClientActionFunction;
  ErrorBoundary?: ComponentType;
  HydrateFallback?: ComponentType;
  shouldRevalidate?: ShouldRevalidateFunction;
};

/**
 * React Router's options for a shared route that run on the server, exported as `reactRouter`
 * from the route's server file (`orgs/[id].server.ts`), which the native app never bundles.
 *
 *     export const reactRouter = { loader: async ({ params }) => getOrg(params.id) } satisfies ReactRouterServerOptions;
 */
export type ReactRouterServerOptions = {
  loader?: LoaderFunction;
  action?: ActionFunction;
  headers?: HeadersFunction;
  middleware?: MiddlewareFunction[];
};
