import { pagesOf, pathOf } from "../model/path.ts";
import type { SharedRoute } from "../model/route.ts";

/**
 * Pages that share a URL with another, such as `(a)/about` and `(b)/about`: a rule for a router
 * that matches by URL alone. Expo Router allows them, as its shared routes.
 */
export function oneUrlPerPage(routes: readonly SharedRoute[], router: string): string[] {
  const seen = new Map<string, string>();
  const problems: string[] = [];

  for (const { route, segments } of pagesOf(routes)) {
    const url = `/${pathOf(segments)}`;
    const other = seen.get(url);
    if (other) problems.push(`${route.id}: ${url} is also ${other}, and ${router} allows one page per URL.`);
    else seen.set(url, route.id);
  }

  return problems;
}
