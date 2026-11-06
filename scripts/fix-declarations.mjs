// TypeScript rewrites the source's relative `.ts` imports to `.js` in the JavaScript it emits, but
// not in the declarations. Published declarations must point at files that exist in dist, so this
// rewrites them too: `from "./output.ts"` becomes `from "./output.js"`, and `import("./x.tsx")`
// becomes `import("./x.js")`.
//
//   node ../../scripts/fix-declarations.mjs dist
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir) throw new Error("usage: fix-declarations.mjs <dist folder>");

const relativeTs = /((?:from|import)\s*\(?\s*["'])(\.{1,2}\/[^"']+?)\.tsx?(["'])/g;
let changed = 0;

for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".d.ts")) continue;
  const file = path.join(entry.parentPath, entry.name);
  const source = readFileSync(file, "utf8");
  const fixed = source.replace(relativeTs, "$1$2.js$3");
  if (fixed !== source) {
    writeFileSync(file, fixed);
    changed++;
  }
}

console.log(`fix-declarations: ${changed} file(s) in ${dir}`);
