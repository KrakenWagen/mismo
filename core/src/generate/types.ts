import { isParam, pagesOf, urlSegments } from "../model/path.ts";
import type { SharedRoute } from "../model/route.ts";
import { GENERATED } from "../config/interfaces.ts";

/**
 * The pages and their params, merged into `@mismo/core`'s `Routes`. Keys are URL patterns in
 * the input's spelling (`param`, such as `[id]` for Expo Router), so links read the way the routes
 * folder is written.
 */
export function emitTypes(routes: readonly SharedRoute[], param: (name: string) => string): string {
  const lines = pagesOf(routes)
    .sort((a, b) => a.route.id.localeCompare(b.route.id))
    .map(({ segments }) => {
      const parts = urlSegments(segments);
      const href = `/${parts.map((s) => (isParam(s) ? param(s.slice(1)) : s)).join("/")}`;
      const params = parts.filter(isParam).map((s) => s.slice(1));
      const type = params.length ? `{ ${params.map((p) => `${p}: string`).join("; ")} }` : "Record<never, never>";
      return `    "${href}": ${type};`;
    });

  // The import loads the module the augmentation is for: in a program where nothing else imports
  // it (a platform's typecheck with no files for that platform yet), augmenting it would fail.
  return `${GENERATED}import type {} from "@mismo/core";

declare module "@mismo/core" {
  interface Routes {
${lines.join("\n")}
  }
}
`;
}
