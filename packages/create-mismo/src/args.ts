import { parseArgs } from "node:util";

import type { Web } from "./customize.ts";

/** What the command line says. Anything left out is asked, or takes its default without a terminal. */
export interface Args {
  help: boolean;
  /** Take every default, and ask nothing. */
  yes: boolean;
  /** The folder to create, as given. */
  name?: string;
  web?: Web[];
  native?: boolean;
  install?: boolean;
  git?: boolean;
  /** Where the starter comes from: a GitHub repo (`owner/repo#ref`) or a folder on this machine. */
  template?: string;
}

export const USAGE = `Usage: create-mismo [name] [options]

Sets up a native app and a web app that share their screens and routes.

Options:
  --web <apps>      The web apps to keep: next, tanstack or both (default: both)
  --native          Keep the Expo native app (default). --no-native removes it
  --install         Install dependencies (default). --no-install skips it
  --git             Start a git repository (default). --no-git skips it
  -y, --yes         Take the defaults for anything not given, and ask nothing
  --template <src>  The starter: owner/repo#ref, or a folder (default: KrakenWagen/mismo-starter)
  -h, --help        Show this help

Examples:
  pnpm create mismo my-app
  pnpm create mismo my-app --web next --no-native --yes`;

export const WEB_APPS: readonly Web[] = ["next", "tanstack"];

/** `--web next,tanstack`, `--web both`, or the flag repeated, as a list of apps. */
function webApps(values: string[]): Web[] {
  const apps = values.flatMap((value) => value.split(",")).map((value) => value.trim().toLowerCase());
  const chosen = new Set<Web>();

  for (const app of apps) {
    if (app === "both") WEB_APPS.forEach((web) => chosen.add(web));
    else if (app === "next" || app === "tanstack") chosen.add(app);
    else throw new Error(`--web takes next, tanstack or both, not "${app}".`);
  }
  return WEB_APPS.filter((web) => chosen.has(web));
}

export function parseArguments(argv: string[]): Args {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    allowNegative: true,
    options: {
      help: { type: "boolean", short: "h" },
      yes: { type: "boolean", short: "y" },
      web: { type: "string", multiple: true },
      native: { type: "boolean" },
      install: { type: "boolean" },
      git: { type: "boolean" },
      template: { type: "string" },
    },
  });

  if (positionals.length > 1) throw new Error(`Expected one folder name, got ${positionals.length}: ${positionals.join(" ")}.`);

  return {
    help: values.help === true,
    yes: values.yes === true,
    ...(positionals[0] !== undefined ? { name: positionals[0] } : {}),
    ...(values.web !== undefined ? { web: webApps(values.web) } : {}),
    ...(values.native !== undefined ? { native: values.native } : {}),
    ...(values.install !== undefined ? { install: values.install } : {}),
    ...(values.git !== undefined ? { git: values.git } : {}),
    ...(values.template !== undefined ? { template: values.template } : {}),
  };
}
