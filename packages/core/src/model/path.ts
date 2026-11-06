import type { SharedRoute } from "./route.ts";

export const isGroup = (segment: string) => segment.startsWith("(") && segment.endsWith(")");
export const isParam = (segment: string) => segment.startsWith(":");

/** The segments that are in the URL: groups and a final `index` left out. */
export function urlSegments(segments: readonly string[]): string[] {
  return segments.filter((s, i) => !isGroup(s) && !(s === "index" && i === segments.length - 1));
}

/** The URL pattern of segments, in `:param` syntax. Empty for none. */
export function pathOf(segments: readonly string[]): string {
  return urlSegments(segments).join("/");
}

/** A page in the tree, with every segment from the root down to it. */
export interface Page {
  route: SharedRoute;
  /** From the root: the layouts' segments, then the page's. */
  segments: string[];
}

/** Every page in the tree, in no particular order. */
export function pagesOf(routes: readonly SharedRoute[], above: readonly string[] = []): Page[] {
  return routes.flatMap((route) => {
    const segments = [...above, ...route.segments];
    return route.layout ? pagesOf(route.children ?? [], segments) : [{ route, segments }];
  });
}

/** A route with every segment from the root down to it, and the parents' folder. */
export interface Placed {
  route: SharedRoute;
  /** The folders above the route: its parents' segments. */
  folder: string[];
}

/** Every route in the tree, layouts included, with the folder it sits in. */
export function placesOf(routes: readonly SharedRoute[], folder: readonly string[] = []): Placed[] {
  return routes.flatMap((route) => [
    { route, folder: [...folder] },
    ...(route.layout ? placesOf(route.children ?? [], [...folder, ...route.segments]) : []),
  ]);
}
