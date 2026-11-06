/**
 * The params of every route from the root down to a screen, merged. React Navigation gives a route
 * only the params its own path segment names, so in `/orgs/acme/members` the `id` belongs to the
 * layout of `orgs/[id]` and not to the `members` screen below it; a shared screen reads the whole
 * URL's params, as on every other router.
 */
type MinimalState = { routes: readonly { params?: object | undefined; state?: MinimalState | undefined }[] };

/** Keys React Navigation uses to open a screen inside a navigator, which are not the URL's params. */
const NAVIGATION_KEYS = new Set(["screen", "params", "state", "initial", "path", "merge", "pop"]);

export function paramsAlong(state: MinimalState | undefined, own: object | undefined): Record<string, unknown> {
  const merged: Record<string, unknown> = {};

  for (let route = state?.routes[0]; route; route = route.state?.routes[0]) {
    Object.assign(merged, route.params);
  }
  Object.assign(merged, own);

  for (const key of NAVIGATION_KEYS) delete merged[key];
  return merged;
}
