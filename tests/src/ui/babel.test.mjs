import assert from "node:assert/strict";
import { test } from "vitest";

import { compile } from "./compile.mjs";

const element = (jsx, setup = "") => compile(`import { html } from "@mismo/ui";\n${setup}\nexport const A = (props) => ${jsx};`).code;
const squash = (code) => code.replace(/\s+/g, " ");

test("html becomes a plain element, with React Strict DOM's defaults", () => {
  assert.match(element(`<html.div />`), /<div [^>]*\{\.\.\._rsdMerge\(_rsdDefaultStyles\.div\)\} \/>/);
});

test("compiled code imports through this package only", () => {
  const code = element(`<html.div />`);
  assert.match(code, /from "@mismo\/ui\/strict-dom\/runtime"/);
  assert.doesNotMatch(code, /from "react-strict-dom/);
});

test("other imports from the package stay", () => {
  const { code } = compile(`import { html, Button, type Styles } from "@mismo/ui"; export const A = () => <html.div><Button /></html.div>;`);
  assert.match(code, /import \{ Button, type Styles \} from "@mismo\/ui";/);
  assert.match(code, /import \{ html \} from "@mismo\/ui\/strict-dom";/);
});

test("html can be renamed", () => {
  const { code } = compile(`import { html as h } from "@mismo/ui"; export const A = () => <h.p className="flex" />;`);
  assert.match(code, /<p /);
});

test("a fixed className is made once per file", () => {
  const code = squash(element(`<><html.div className="flex p-4" /><html.span className="flex p-4" /></>`));
  assert.equal(code.match(/tailwind: "flex p-4"/g).length, 1);
  assert.match(code, /_rsdDefaultStyles\.div, _tailwind\)/);
  assert.match(code, /_rsdDefaultStyles\.span, _tailwind\)/);
  assert.doesNotMatch(code, /className=/);
});

test("a dynamic className can be false or undefined", () => {
  assert.match(squash(element(`<html.div className={props.on && "p-1"} />`)), /tailwind: props\.on && "p-1" \|\| null/);
});

test("className comes after style, so that it wins", () => {
  const code = squash(element(`<html.div className="flex" style={styles.a} />`, `const styles = { a: {} };`));
  assert.match(code, /_rsdDefaultStyles\.div, styles\.a, _tailwind\)/);
});

test("an array style stays flat", () => {
  const code = squash(element(`<html.div className="flex" style={[a, b]} />`));
  assert.match(code, /_rsdDefaultStyles\.div, a, b, _tailwind\)/);
});

test("an element with only a style is left to React Strict DOM", () => {
  assert.match(squash(element(`<html.div style={a} />`)), /<div [^>]*\{\.\.\._rsdMerge\(_rsdDefaultStyles\.div, a\)\} \/>/);
});

test("other components keep their className", () => {
  assert.match(element(`<Card className="flex" />`), /<Card className="flex" \/>/);
});

test("a spread's className and style reach merge()", () => {
  const code = squash(element(`<html.div {...props} />`));
  assert.match(code, /props\?\.style/);
  assert.match(code, /tailwind: props\?\.className \|\| null/);
});

test("a spread's raw className and style don't reach the DOM", () => {
  const code = squash(element(`<html.div {...props} />`));
  assert.match(code, /\{\.\.\.props\} \{\.\.\.\{ className: undefined, style: undefined \}\} \{\.\.\._rsdMerge/);
});

test("the last of a className and a spread wins", () => {
  assert.match(squash(element(`<html.div className="a" {...props} />`)), /tailwind: \(?props\?\.className \?\? "a"\)? \|\| null/);
  const after = squash(element(`<html.div {...props} className="b" />`));
  assert.doesNotMatch(after, /props\?\.className/);
  assert.match(after, /tailwind: "b"/);
});

test("a spread's expression runs once", () => {
  const code = squash(element(`<html.div {...getProps()} />`));
  assert.equal(code.match(/getProps\(\)/g).length, 1);
  assert.match(code, /_spread\?\.className/);
});

test("styles from css.create are extracted", () => {
  const { metadata } = compile(`import { css } from "@mismo/ui"; export const s = css.create({ a: { color: "red" } });`);
  assert.match(JSON.stringify(metadata.stylex), /color:red/);
});
