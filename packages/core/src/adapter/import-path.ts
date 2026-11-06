import path from "node:path";

/** Import specifier for `module` from a file at `from`, both absolute. */
export function importPath(from: string, module: string): string {
  const relative = path.relative(path.dirname(from), module).split(path.sep).join("/");
  return relative.startsWith(".") ? relative : `./${relative}`;
}
