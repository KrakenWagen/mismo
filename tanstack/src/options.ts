import type { AnyRoute, FileBaseRouteOptions, Register, UpdatableRouteOptions } from "@tanstack/react-router";

/**
 * TanStack Router's options for a shared route, exported from its file as `tanstack`: `ssr`, `head`,
 * `beforeLoad`, `loader`. The web's generated route file spreads them into `createFileRoute`, where
 * the app's typecheck checks them against the route's own types; this type is for writing them.
 * The component is the file's default export, as for Expo Router.
 *
 *     export const tanstack = { ssr: false } satisfies TanstackRouteOptions;
 */
export type TanstackRouteOptions = Omit<
  Partial<
    FileBaseRouteOptions<Register, AnyRoute> &
      UpdatableRouteOptions<AnyRoute, string, string, Record<string, string>, undefined, undefined, {}, {}, {}, {}>
  >,
  "component"
>;
