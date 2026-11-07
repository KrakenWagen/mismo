import { createRequire } from "node:module";

const require = createRequire(new URL("../../../packages/ui/package.json", import.meta.url));
const babel = require("@babel/core");

/** Compiles a screen as a web app would, without JSX being turned into calls. */
export function compile(source, filename = "/app/screen.tsx") {
  return babel.transformSync(source, {
    babelrc: false,
    configFile: false,
    filename,
    presets: [require.resolve("./integrations/babel.cjs")],
  });
}
