// The web compiler: React Strict DOM's, plus what lets screens import from `@mismo/ui` and use
// `className`. Native needs none of this, as `react-native` imports get `src/index.native.ts`.
const strictDomPreset = require("react-strict-dom/babel-preset");

const UI = "@mismo/ui";
const STRICT_DOM = "react-strict-dom";
const COMPILED = new Set(["css", "html"]);

/** Reads TypeScript and JSX, for tools that hand this config untranspiled source. */
function parseTypeScript() {
  return {
    name: "mismo-ui-parse-typescript",
    manipulateOptions(opts, parserOpts) {
      const has = (name) => parserOpts.plugins.some((p) => (Array.isArray(p) ? p[0] : p) === name);
      if (!has("typescript")) parserOpts.plugins.push("typescript");
      if (!/\.[cm]?ts$/.test(opts.filename ?? "") && !has("jsx")) parserOpts.plugins.push("jsx");
    },
  };
}

/** React Strict DOM's compiler only acts on imports from its own name, so give it those. */
function importFromStrictDom(t, program) {
  const isCompiled = (s) => t.isImportSpecifier(s) && s.importKind !== "type" && COMPILED.has(s.imported.name);
  for (const node of program.node.body) {
    if (!t.isImportDeclaration(node) || node.source.value !== UI || node.importKind === "type") continue;
    const compiled = node.specifiers.filter(isCompiled);
    if (compiled.length === 0) continue;
    const others = node.specifiers.filter((s) => !isCompiled(s));
    if (others.length > 0) program.unshiftContainer("body", t.importDeclaration(others, t.stringLiteral(UI)));
    node.specifiers = compiled;
    node.source = t.stringLiteral(STRICT_DOM);
  }
}

/** The local names of React Strict DOM's `html`, as in `import { html as h }`. */
function htmlNames(t, program) {
  return new Set(
    program.node.body
      .filter((node) => t.isImportDeclaration(node) && node.source.value === STRICT_DOM)
      .flatMap((node) => node.specifiers)
      .filter((s) => t.isImportSpecifier(s) && s.imported.name === "html")
      .map((s) => s.local.name),
  );
}

/**
 * Moves `className` into `style`, as a compiled style: React Strict DOM's own `merge()` then adds the
 * classes to the element's others. Written as a separate attribute, its result would replace them.
 * It also reads both from spreads, which its compiler doesn't see, following JSX's order: last wins.
 */
function classNamePlugin({ types: t }) {
  const compiledStyle = (value) =>
    t.objectExpression([
      t.objectProperty(t.identifier("$$css"), t.booleanLiteral(true)),
      t.objectProperty(t.identifier("tailwind"), value),
    ]);

  /** The final value of `key`, or null: a spread only wins if it has one. */
  function finalValue(attributes, key, readSpread) {
    let value = null;
    for (const attribute of attributes) {
      if (t.isJSXSpreadAttribute(attribute)) {
        const read = readSpread(attribute, key);
        value = value == null ? read : t.logicalExpression("??", read, value);
      } else if (attribute.name.name === key) {
        value = t.isJSXExpressionContainer(attribute.value) ? attribute.value.expression : attribute.value;
      }
    }
    return value;
  }

  /** Reads props from spreads, keeping each spread's expression evaluated only once. */
  function spreadReader(path) {
    return (attribute, key) => {
      if (!t.isIdentifier(attribute.argument)) {
        const id = path.scope.generateUidIdentifier("spread");
        path.scope.push({ id });
        attribute.argument = t.assignmentExpression("=", id, attribute.argument);
      }
      const target = t.isAssignmentExpression(attribute.argument) ? attribute.argument.left : attribute.argument;
      return t.optionalMemberExpression(t.cloneNode(target), t.identifier(key), false, true);
    };
  }

  return {
    name: "mismo-ui-class-name",
    pre() {
      this.fixedStyles = new Map();
    },
    visitor: {
      Program: {
        // On enter, and with this plugin first, so that the compilers below find the new imports.
        enter(program) {
          importFromStrictDom(t, program);
          this.htmlNames = htmlNames(t, program);
        },
      },
      JSXOpeningElement(path) {
        const { name, attributes } = path.node;
        if (!t.isJSXMemberExpression(name) || !this.htmlNames.has(name.object.name)) return;

        const isNamed = (attribute, key) => t.isJSXAttribute(attribute) && attribute.name.name === key;
        const hasSpread = attributes.some((attribute) => t.isJSXSpreadAttribute(attribute));
        if (!hasSpread && !attributes.some((attribute) => isNamed(attribute, "className"))) return;

        const readSpread = spreadReader(path);
        const className = finalValue(attributes, "className", readSpread);
        const style = finalValue(attributes, "style", readSpread);

        const styles = t.isArrayExpression(style) ? [...style.elements] : style == null ? [] : [style];
        if (t.isStringLiteral(className)) {
          // Made once, so that `merge()` can cache it.
          if (!this.fixedStyles.has(className.value)) {
            const id = path.scope.generateUidIdentifier("tailwind");
            path.scope.getProgramParent().push({ id, init: compiledStyle(className), kind: "const" });
            this.fixedStyles.set(className.value, id);
          }
          styles.push(t.cloneNode(this.fixedStyles.get(className.value)));
        } else if (className != null) {
          // `|| null`: `merge()` only takes strings and null, and a condition can give `false`.
          styles.push(compiledStyle(t.logicalExpression("||", className, t.nullLiteral())));
        }

        path.node.attributes = attributes.filter((a) => !isNamed(a, "className") && !isNamed(a, "style"));
        if (hasSpread) {
          // A spread's raw values would otherwise reach the DOM, as `merge()` doesn't always set them.
          const cleared = ["className", "style"].map((key) => t.objectProperty(t.identifier(key), t.identifier("undefined")));
          path.node.attributes.push(t.jsxSpreadAttribute(t.objectExpression(cleared)));
        }
        if (styles.length > 0) {
          path.node.attributes.push(
            t.jsxAttribute(t.jsxIdentifier("style"), t.jsxExpressionContainer(t.arrayExpression(styles))),
          );
        }
      },
    },
    // After every compiler, so that an app reaches React Strict DOM through this package.
    post(file) {
      for (const node of file.ast.program.body) {
        if (!t.isImportDeclaration(node)) continue;
        if (node.source.value === STRICT_DOM) node.source = t.stringLiteral(`${UI}/strict-dom`);
        if (node.source.value === `${STRICT_DOM}/runtime`) node.source = t.stringLiteral(`${UI}/strict-dom/runtime`);
      }
    },
  };
}

module.exports = function uiPreset(api) {
  const dev = process.env.NODE_ENV !== "production";
  api.cache.using(() => process.env.NODE_ENV ?? "");
  return {
    plugins: [parseTypeScript, classNamePlugin],
    presets: [[strictDomPreset, { debug: dev, dev, platform: "web" }]],
  };
};
