import { existsSync, readFileSync } from "node:fs";

import { platformOf } from "../model/platforms.ts";

// A router's options for one route: what a shared route exports under that router's name, such
// as `export const tanstack = { ssr: false }`. Each adapter picks its name, types the object, and
// reads it here, so the routes folder stays the same for every router and a new router brings its
// own options without changes to this library.
//
// Options that need the server (a loader, metadata) go in the route's server file, beside it:
// `orgs/[id].server.ts` for `orgs/[id].tsx`. Only a web app's generated files import it; the
// inputs skip it, so it is never a route, and native never bundles it.

const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

/** A route's module file, from its path without extension: `…/orgs/[id]` is `…/orgs/[id].tsx`. */
function fileOf(module: string): string | undefined {
  return EXTENSIONS.map((ext) => module + ext).find((file) => existsSync(file));
}

/**
 * The route's server file, without extension, or none. Platform files share it: `pricing.web`
 * and `pricing` both have `pricing.server.ts`.
 */
export function serverModule(module: string): string | undefined {
  const { base } = platformOf(module);
  const stem = `${base}.server`;
  return fileOf(stem) ? stem : undefined;
}

/** Whether a route's module (or server file) exports `name`, read from its source. */
export function exportsName(module: string, name: string): boolean {
  const file = fileOf(module);
  if (!file) return false;
  return declaration(readFileSync(file, "utf8"), name) !== undefined;
}

/**
 * The properties of `export const <name> = { … }` in a route's module (or server file), by name,
 * each with its value's source text: what an output needs to pass them on one by one. None when
 * the module doesn't export `name`.
 *
 * The object must be written out, so its properties can be read without running it: a spread, or
 * a value computed elsewhere (`export const next = makeOptions()`), is an error that says so.
 */
export function exportedOptions(module: string, name: string): Map<string, string> | undefined {
  const file = fileOf(module);
  if (!file) return undefined;
  const source = readFileSync(file, "utf8");
  const start = declaration(source, name);
  if (start === undefined) return undefined;

  const open = source.indexOf("{", start);
  const between = source.slice(start, open);
  if (open === -1 || /\S/.test(between.replace(/^\s*(:[^=]*)?=\s*/, ""))) {
    throw new Error(`${file}: \`${name}\` should be an object written out, \`export const ${name} = { … }\`, so its options can be read.`);
  }

  const properties = new Map<string, string>();
  for (const entry of topLevelEntries(source, open)) {
    const property = parseEntry(entry);
    if (!property) {
      throw new Error(`${file}: \`${name}\` has \`${entry.trim().slice(0, 40)}\`, which can't be read without running it. Write each option out.`);
    }
    properties.set(property.key, property.value);
  }
  return properties;
}

/**
 * Where `export const <name>`'s initializer starts (just after its name), for both
 * `export const name = …` and `const name = …; export { name }`.
 */
function declaration(source: string, name: string): number | undefined {
  const code = stripComments(source);
  const direct = new RegExp(`export\\s+(?:const|let|var)\\s+${name}\\b`).exec(code);
  if (direct) return direct.index + direct[0].length;

  if (new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(code)) {
    const local = new RegExp(`(?:const|let|var)\\s+${name}\\b`).exec(code);
    if (local) return local.index + local[0].length;
  }
  return undefined;
}

/** The source with comments blanked out, at the same offsets, so a commented-out export isn't one. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (comment) => comment.replace(/[^\n]/g, " "));
}

/** The comma-separated entries of the object starting at `open`, at its top level. */
function topLevelEntries(source: string, open: number): string[] {
  const entries: string[] = [];
  let depth = 0;
  let current = "";

  for (let i = open; i < source.length; i++) {
    const char = source[i]!;

    // Strings and comments are copied whole, so their brackets and commas don't count.
    if (char === '"' || char === "'" || char === "`") {
      const end = closingQuote(source, i);
      current += source.slice(i, end + 1);
      i = end;
      continue;
    }
    if (char === "/" && (source[i + 1] === "/" || source[i + 1] === "*")) {
      const end = source[i + 1] === "/" ? source.indexOf("\n", i) : source.indexOf("*/", i) + 1;
      i = end === -1 || end === 0 ? source.length : end;
      continue;
    }

    if (char === "{" || char === "(" || char === "[") {
      depth++;
      if (depth === 1) continue;
    } else if (char === "}" || char === ")" || char === "]") {
      depth--;
      if (depth === 0) {
        if (current.trim()) entries.push(current);
        return entries;
      }
    } else if (char === "," && depth === 1) {
      if (current.trim()) entries.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  return entries;
}

function closingQuote(source: string, start: number): number {
  const quote = source[start];
  for (let i = start + 1; i < source.length; i++) {
    if (source[i] === "\\") i++;
    else if (source[i] === quote) return i;
  }
  return source.length;
}

/** An entry's name and value: `key: value`, `key` (shorthand), or a method, `key() { … }`. */
function parseEntry(entry: string): { key: string; value: string } | undefined {
  const text = entry.trim();
  if (text.startsWith("...") || text.startsWith("[")) return undefined;

  const key = /^(?:async\s+)?(?:get\s+|set\s+)?\*?\s*(?:([A-Za-z_$][\w$]*)|"([^"]+)"|'([^']+)')/.exec(text);
  if (!key) return undefined;
  const name = key[1] ?? key[2] ?? key[3]!;
  const rest = text.slice(key[0].length).trimStart();

  if (rest.startsWith(":")) return { key: name, value: rest.slice(1).trim() };
  if (rest === "") return { key: name, value: name };
  if (rest.startsWith("(") || rest.startsWith("<")) return { key: name, value: text };
  return undefined;
}

/**
 * Whether a value's source text is plain data that stands on its own: strings, numbers, booleans,
 * `null`, and arrays and objects of them, such as `{ title: "Settings", robots: { index: false } }`.
 * Such a value can be copied as text into a generated file, so it never has to be imported from
 * the module it was written in. A name, a call, a function, or a template with `${}` is not.
 */
export function isPlainValue(text: string): boolean {
  const source = text.trim().replace(/\s+as\s+const$/, "");
  let i = 0;

  while (i < source.length) {
    const char = source[i]!;

    if (char === '"' || char === "'") {
      i = closingQuote(source, i) + 1;
      continue;
    }
    if (char === "`") {
      const end = closingQuote(source, i);
      if (source.slice(i, end).includes("${")) return false;
      i = end + 1;
      continue;
    }

    const word = /^[A-Za-z_$][\w$]*/.exec(source.slice(i));
    if (word) {
      const after = source.slice(i + word[0].length).trimStart();
      // An object's key (`title:`), or one of the values that are words.
      if (!after.startsWith(":") && !["true", "false", "null"].includes(word[0])) return false;
      i += word[0].length;
      continue;
    }

    // Numbers, brackets, commas, colons, and minus signs; anything else (`=>`, `(`, `...`) isn't data.
    if (!/[\d.\-+eE\s{}[\],:]/.test(char) || source.startsWith("...", i)) return false;
    i++;
  }
  return true;
}
