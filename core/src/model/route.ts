/**
 * Who a route tree is for: an app's platform, or `shared`, the routes every platform has, for the
 * shared package's types.
 */
export type Target = "web" | "native" | "shared";

/**
 * A route in the shared model: React Router's `RouteConfigEntry` (`@react-router/dev/routes`), plus
 * what it has no place for. An input builds the tree for one target; an output reads it.
 *
 * Segments are spelled the same whatever the input: `orgs` (static), `:id` (a param), `(app)` (a
 * group: not in the URL), and `index` (a page's own name, for the index of its folder).
 */
export interface SharedRoute {
  /** Unique: the route's file in the routes folder, without extension, such as `(app)/orgs/[id]`. */
  id: string;
  /** The URL pattern below the parent route, in `:param` syntax, groups left out. None for a group's layout. */
  path?: string;
  /** The page at its parent's own URL. */
  index?: boolean;
  /** A layout: it renders the routes below it. */
  layout?: boolean;
  /**
   * The module the target imports, absolute. Without an extension when the bundler picks the
   * platform file itself, with one (`.web`, `.native`) when it would not (`model/platforms.ts`).
   */
  file: string;
  /**
   * The route's folders and name below its parent's folder, for outputs that rebuild the folder:
   * `["orgs", ":id"]`, or `["(app)"]` for the layout of `(app)`.
   */
  segments: string[];
  children?: SharedRoute[];
}
