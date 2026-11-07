// Native's bundler setup: Uniwind compiles the app's global CSS to a stylesheet at build time.
const fs = require("node:fs");
const path = require("node:path");
const { withUniwindConfig } = require("uniwind/metro");

const UNIWIND = path.dirname(require.resolve("uniwind/package.json"));
const INTERNAL = "uniwind/internal/";
// The published package has it built, in `dist`; in this repo it's the source.
const BUILT = path.join(__dirname, "../dist/safe-areas.native.js");
const SAFE_AREAS = fs.existsSync(BUILT) ? BUILT : path.join(__dirname, "../src/safe-areas.native.ts");

/**
 * Wrap your whole Metro config with this, as Uniwind has to go last.
 * @param {{ cssEntryFile: string, dtsFile?: string }} options `cssEntryFile` is relative to the app.
 */
function withUI(config, options) {
  return withUniwindConfig(
    {
      ...config,
      serializer: {
        ...config.serializer,
        // Before the app starts, as it sets what wraps the app. It's in the bundle through `html`.
        getModulesRunBeforeMainModule: (entry) => [
          ...(config.serializer?.getModulesRunBeforeMainModule?.(entry) ?? []),
          SAFE_AREAS,
        ],
      },
      resolver: {
        ...config.resolver,
        // Uniwind looks itself up from the app, which only depends on this package.
        extraNodeModules: { ...config.resolver?.extraNodeModules, uniwind: UNIWIND },
        // Uniwind's exports don't include what `src/index.native.ts` needs. These are the same files
        // Uniwind loads itself, so they share its one stylesheet.
        resolveRequest(context, moduleName, platform) {
          const resolve = config.resolver?.resolveRequest ?? context.resolveRequest;
          const target = moduleName.startsWith(INTERNAL)
            ? path.join(UNIWIND, "src", moduleName.slice(INTERNAL.length))
            : moduleName;
          return resolve(context, target, platform);
        },
      },
    },
    options,
  );
}

module.exports = { withUI };
