// Everything a Vite app needs: the compiler and the CSS, with no config files.
const babel = require("vite-plugin-babel").default;
const uiPostcss = require("./postcss.cjs");

// Your code, in any package of the workspace, and React Strict DOM, whose defaults need compiling.
const isCompiled = (id) => !id.includes("node_modules") || /node_modules[\\/]react-strict-dom[\\/]/.test(id);

/** Put this before your framework's plugin. */
function ui() {
  return [
    {
      name: "mismo-ui",
      config: () => ({
        css: { postcss: { plugins: [uiPostcss()] } },
        ssr: { noExternal: ["@mismo/ui", "react-strict-dom"] },
      }),
    },
    babel({
      babelConfig: { babelrc: false, configFile: false, presets: [require.resolve("./babel.cjs")] },
      include: /\.[jt]sx?(\?|$)/,
      filter: isCompiled,
      optimizeOnSSR: true,
    }),
  ];
}

module.exports = { ui };
