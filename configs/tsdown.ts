import { defineConfig } from "tsdown";

/**
 * The published build of a package: one JavaScript file and one declaration file per source file,
 * in `dist`, shaped like `src`, with the source's `.ts` imports rewritten to `.js`. Dependencies
 * and peer dependencies stay imports. `entry` is the source file of each of the package's exports.
 */
export const packageConfig = (entry: string[]) =>
  defineConfig({
    entry,
    format: "esm",
    dts: true,
    unbundle: true,
    // The packages are `"type": "module"`: plain `.js` and `.d.ts`.
    fixedExtension: false,
    outDir: "dist",
    clean: true,
  });
