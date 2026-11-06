import { cpSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/** The starter, on GitHub. */
export const STARTER = "gh:KrakenWagen/mismo-starter";

/** What a folder copy leaves behind: the starter's history, and anything installed or built in it. */
const LEFT_BEHIND = new Set([".git", "node_modules", ".next", ".expo", ".tanstack", ".output", ".nitro", "dist"]);

/** Whether a folder can be created in: it's new, or empty. */
export function isFree(dir: string): boolean {
  return !existsSync(dir) || (statSync(dir).isDirectory() && readdirSync(dir).length === 0);
}

/**
 * Puts the starter in `dir`: a folder on this machine is copied, and anything else is a GitHub repo
 * (`owner/repo`, `owner/repo#tag`) that is downloaded without its git history.
 */
export async function fetchStarter(source: string, dir: string): Promise<void> {
  if (existsSync(source) && statSync(source).isDirectory()) {
    cpSync(source, dir, { recursive: true, filter: (file) => !LEFT_BEHIND.has(path.basename(file)) });
    return;
  }

  const { downloadTemplate } = await import("giget");
  await downloadTemplate(source.includes(":") ? source : `gh:${source}`, { dir, force: false });
}
