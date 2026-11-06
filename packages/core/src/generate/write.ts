import { existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

import { type Files, GENERATED } from "../config/interfaces.ts";

/**
 * Writes generated files into a routes folder that also holds hand-written ones. The folder's
 * `.gitignore` lists what was generated: git skips those files, editors dim them, and the next run
 * knows which files it may replace or remove. It lists itself, so none of it is committed.
 *
 * A hand-written file is never touched: one at a generated path is an error, and nothing is written.
 */
export function writeRoutes(dir: string, files: Files) {
  const ignore = path.join(dir, ".gitignore");
  const before = existsSync(ignore) ? listed(readFileSync(ignore, "utf8")) : new Set<string>();

  const taken = [...files.keys()].filter((file) => isHandWritten(path.join(dir, file)));
  if (taken.length > 0) {
    throw new Error(
      `${taken.map((f) => path.join(dir, f)).join(", ")} ${taken.length === 1 ? "is" : "are"} hand-written, ` +
        "and the shared routes folder has the same route. Remove one.",
    );
  }

  for (const [file, content] of files) writeFile(path.join(dir, file), content);

  for (const file of before) {
    if (files.has(file) || isHandWritten(path.join(dir, file))) continue;
    rmSync(path.join(dir, file), { force: true });
    removeEmptyParents(dir, path.dirname(path.join(dir, file)));
  }

  writeFile(
    ignore,
    "# Written by mismo: the routes generated from the shared folder, and this file.\n" +
      ["/.gitignore", ...[...files.keys()].sort().map((f) => `/${escape(f)}`)].join("\n") +
      "\n",
  );
}

/** Writes a file when its content differs, so the bundler's watcher only sees what changed. */
export function writeFile(file: string, content: string) {
  if (existsSync(file) && readFileSync(file, "utf8") === content) return;
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function isHandWritten(file: string): boolean {
  return existsSync(file) && !readFileSync(file, "utf8").startsWith(GENERATED);
}

// Gitignore patterns treat `[` as a character class and `\` as an escape.
const escape = (file: string) => file.replace(/[[\]\\*?]/g, (c) => `\\${c}`);
const unescape = (line: string) => line.replace(/\\(.)/g, "$1");

function listed(gitignore: string): Set<string> {
  return new Set(
    gitignore
      .split("\n")
      .filter((line) => line.startsWith("/") && line !== "/.gitignore")
      .map((line) => unescape(line.slice(1))),
  );
}

function removeEmptyParents(root: string, dir: string) {
  while (dir !== root && dir.startsWith(root) && existsSync(dir) && readdirSync(dir).length === 0) {
    rmdirSync(dir);
    dir = path.dirname(dir);
  }
}
