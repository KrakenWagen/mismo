import type { AnyRoute, FileBaseRouteOptions, Register, UpdatableRouteOptions } from "@tanstack/react-router";

type AllOptions = Partial<
  FileBaseRouteOptions<Register, AnyRoute> &
    UpdatableRouteOptions<AnyRoute, string, string, Record<string, string>, undefined, undefined, {}, {}, {}, {}>
>;

/**
 * TanStack Router's options for a shared route, exported from its file as `tanstack`: `ssr`, `head`
 * and the like. The web's generated route file spreads them into `createFileRoute`, where the app's
 * typecheck checks them against the route's own types; this type is for writing them. The component
 * is the file's default export, as for Expo Router. Options that hold server code (`loader`,
 * `beforeLoad`) go in the route's server file instead (`TanstackServerOptions`).
 *
 *     export const tanstack = { ssr: false } satisfies TanstackRouteOptions;
 */
export type TanstackRouteOptions = Omit<AllOptions, "component" | "loader" | "beforeLoad">;

/**
 * TanStack Router's options that hold server code, exported as `tanstack` from the route's server
 * file (`orgs/[id].server.ts`), which the native app never bundles. TanStack also runs a loader in
 * the browser on client-side navigation, so put its server-only work in a `createServerFn`.
 *
 *     export const tanstack = { loader: () => getOrgs() } satisfies TanstackServerOptions;
 */
export type TanstackServerOptions = Pick<AllOptions, "loader" | "beforeLoad">;
