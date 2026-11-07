import fs from "node:fs";
import Module, { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const require = createRequire(new URL("../../../packages/ui/package.json", import.meta.url));
const ui = path.dirname(require.resolve("./package.json"));
const uniwind = path.dirname(require.resolve("uniwind/package.json"));
const rnTypes = path.join(path.dirname(require.resolve("react-native/package.json")), "Libraries/StyleSheet");

/** The names of the styles React Native has, read from its types. */
function reactNativeStyles() {
  const names = new Set(["translateX", "translateY", "rotate", "rotateX", "rotateY", "rotateZ", "scale", "scaleX", "scaleY", "skewX", "skewY", "perspective"]);
  const files = [path.join(rnTypes, "StyleSheetTypes.js"), ...fs.readdirSync(path.join(rnTypes, "private")).map((f) => path.join(rnTypes, "private", f))];
  for (const file of files) for (const m of fs.readFileSync(file, "utf8").matchAll(/^\s{2}(\w+)\??:/gm)) names.add(m[1]);
  return names;
}

/** Values React Native's types name but don't accept: the property exists, this value doesn't. */
const rejected = {
  position: (value) => value === "fixed" || value === "sticky",
  display: (value) => typeof value === "string" && !["none", "flex", "contents"].includes(value),
};

/**
 * Uniwind keeps its compiler to itself, so this loads the one Metro uses from its bundle, to compile
 * classes as an iOS app does. Returns, for each class, whether it works and the styles it compiled to.
 */
export async function compileForNative(classes, platform = "ios") {
  const file = path.join(uniwind, "dist/metro/transformer.cjs");
  const source = fs.readFileSync(file, "utf8") + "\nmodule.exports.__compile = { compileCSS, config };";
  const loaded = new Module(file, null);
  loaded.filename = file;
  loaded.paths = Module._nodeModulePaths(path.dirname(file));
  loaded._compile(source, file);
  const { compileCSS, config } = loaded.exports.__compile;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mismo-ui-classes-"));
  const cwd = process.cwd();
  try {
    fs.writeFileSync(path.join(dir, "global.css"), `@import ${JSON.stringify(path.join(ui, "css/tailwind.css"))};`);
    fs.writeFileSync(path.join(dir, "classes.html"), `<div class="${classes.join(" ")}"></div>`);
    process.chdir(dir);
    const bundler = config.UniwindBundlerConfig.fromMetroConfig({ cssEntryFile: "./global.css" }, platform);
    const compiled = await compileCSS(bundler);
    const { stylesheet } = new Function("rt", `return ${compiled}`)({ colorScheme: "light" });

    const known = reactNativeStyles();
    return Object.fromEntries(
      classes.map((name) => {
        const used = (stylesheet[name] ?? [])
          .flatMap((rule) => rule.entries)
          .filter(([property]) => !property.startsWith("--"))
          .map(([property, value]) => {
            let resolved;
            try { resolved = typeof value === "function" ? value({}) : value; } catch {}
            return [property, resolved, known.has(property) && !rejected[property]?.(resolved)];
          });
        return [name, { works: used.length > 0 && used.some(([, , valid]) => valid), styles: used }];
      }),
    );
  } finally {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
