// The web's CSS: Tailwind, and the styles from `css.create()`. Apps only import `tailwind.css` and
// add a `@source`, which also tells this plugin where to look. React Strict DOM's own extractor
// skips any file that doesn't contain its name, which would now be every screen.
const babel = require("@babel/core");
const fs = require("node:fs");
const path = require("node:path");
const postcss = require("postcss");
const tailwind = require("@tailwindcss/postcss");
const { generateStyles } = require("react-strict-dom/babel-preset");

const NAME = "mismo-ui-strict-dom-styles";
const SOURCE_FILES = "**/*.{js,jsx,ts,tsx}";
const STRICT_DOM_FILES = [require.resolve("react-strict-dom"), require.resolve("react-strict-dom/runtime")];

const isSkippedFolder = (name) => name === "node_modules" || name === "dist" || name.startsWith(".");

/** Next.js leaves the `@import` for this plugin to see, and Vite has already replaced it with the file. */
function importsTailwindCss(root) {
  return root.some(
    (node) =>
      node.type === "atrule" &&
      ((node.name === "import" && node.params.includes("@mismo/ui/tailwind.css")) ||
        (node.name === "layer" && node.params.includes("strict-dom"))),
  );
}

/** The app itself, and each folder in a `@source`. */
function sourceFolders(root, cssFile, cwd) {
  const folders = new Set([cwd]);
  root.walkAtRules("source", (rule) => {
    const quoted = rule.params.match(/^["'](.+)["']$/);
    if (quoted) folders.add(path.resolve(path.dirname(cssFile), quoted[1]));
  });
  return [...folders];
}

function strictDomStyles() {
  const cwd = process.cwd();
  // By file: unchanged ones keep their rules between builds in watch mode.
  const cache = new Map();

  async function rulesOf(file) {
    const { mtimeMs } = fs.statSync(file);
    const cached = cache.get(file);
    if (cached?.mtimeMs === mtimeMs) return cached.rules;
    const source = fs.readFileSync(file, "utf8");
    const usesStyles = STRICT_DOM_FILES.includes(file) || source.includes("@mismo/ui");
    const result =
      usesStyles &&
      (await babel.transformAsync(source, {
        babelrc: false,
        configFile: false,
        filename: file,
        presets: [require.resolve("./babel.cjs")],
      }));
    const rules = result?.metadata?.stylex ?? [];
    cache.set(file, { mtimeMs, rules });
    return rules;
  }

  return {
    postcssPlugin: NAME,
    async Once(root, { result }) {
      if (!importsTailwindCss(root)) return;

      const cssFile = path.resolve(cwd, result.opts.from);
      const folders = sourceFolders(root, cssFile, cwd);
      const files = folders.flatMap((folder) =>
        fs
          .globSync(SOURCE_FILES, { cwd: folder, exclude: isSkippedFolder })
          .filter((file) => !file.endsWith(".d.ts"))
          .map((file) => path.resolve(folder, file)),
      );
      const rules = await Promise.all([...STRICT_DOM_FILES, ...new Set(files)].map(rulesOf));

      // Rebuild when a file changes, or when one is added.
      for (const file of files) result.messages.push({ type: "dependency", plugin: NAME, file, parent: cssFile });
      for (const dir of folders) result.messages.push({ type: "dir-dependency", plugin: NAME, dir, glob: SOURCE_FILES, parent: cssFile });

      const css = generateStyles(rules.flat(), { useLayers: true });
      root.append(postcss.parse(`@layer strict-dom {\n${css}\n}`, { from: cssFile }));
    },
  };
}
strictDomStyles.postcss = true;

function uiPlugin() {
  // Tailwind's own plugins, spread: PostCSS doesn't look inside a plugin list within a plugin list.
  return { postcssPlugin: "mismo-ui", plugins: [strictDomStyles(), ...tailwind().plugins] };
}
uiPlugin.postcss = true;

module.exports = uiPlugin;
