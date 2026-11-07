// The web entry, and the types for every platform. `@mismo/ui/babel` compiles imports of `html` and
// `css` straight to React Strict DOM, so screens never load this file. It's here for tools that
// read the source without that compiler, like TypeScript.
import { css, html as strictHtml } from "react-strict-dom";

import type { Html } from "./types.ts";

export const html = strictHtml as unknown as Html;
export { css };
export type * from "./types.ts";
