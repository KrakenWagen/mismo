// `@mismo/core/adapter`: what an adapter package is written with, the built-in ones and yours. An input
// reads a routes folder into `SharedRoute`s; an output writes them for its router.
export {
  GENERATED,
  type Files,
  type OutputContext,
  type RouteInput,
  type RouteOutput,
  type RouteRules,
  type RouterAdapter,
} from "../config/interfaces.ts";
export type { SharedRoute, Target } from "../model/route.ts";
export { isGroup, isParam, pagesOf, pathOf, placesOf, urlSegments, type Page, type Placed } from "../model/path.ts";
export { moduleFor, platformOf, PLATFORMS, type Platform } from "../model/platforms.ts";
export { routeFiles } from "./route-files.ts";
export { exportedOptions, exportsName, isPlainValue, serverModule } from "./options.ts";
export { oneUrlPerPage } from "./rules.ts";
export { importPath } from "./import-path.ts";
