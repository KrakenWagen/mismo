#!/usr/bin/env node
// `pnpm create mismo`: sets up a native app and a web app that share their screens and routes, from
// the starter, with the apps you pick.
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

import { cancel, confirm, intro, isCancel, log, outro, select, spinner, text } from "@clack/prompts";

import { type Args, parseArguments, USAGE, WEB_APPS } from "./args.ts";
import { customize, packageName, type Web } from "./customize.ts";
import { fetchStarter, isFree, STARTER } from "./template.ts";

/** What each web app is called, and where it opens in dev. */
const WEB_NAMES: Record<Web, string> = { next: "Next.js", tanstack: "TanStack Start" };
const WEB_PORTS: Record<Web, number> = { next: 3000, tanstack: 3001 };

const DEFAULT_NAME = "my-mismo-app";

/** Stops when the person cancels a prompt. */
function answer<T>(value: T): Exclude<T, symbol> {
  if (isCancel(value)) {
    cancel("Cancelled. Nothing was created.");
    process.exit(1);
  }
  return value as Exclude<T, symbol>;
}

function fail(message: string): never {
  cancel(message);
  process.exit(1);
}

/** Runs a command, and says whether it succeeded. */
const run = (command: string, args: string[], cwd: string, quiet = false) =>
  spawnSync(command, args, { cwd, stdio: quiet ? "ignore" : "inherit" }).status === 0;

async function chooseWeb(): Promise<Web[]> {
  const picked = answer(
    await select<"both" | Web>({
      message: "Which web app?",
      options: [
        { value: "both", label: "Both", hint: "side by side; remove one whenever you like" },
        { value: "next", label: WEB_NAMES.next },
        { value: "tanstack", label: WEB_NAMES.tanstack },
      ],
    }),
  );
  return picked === "both" ? [...WEB_APPS] : [picked];
}

async function main() {
  let args: Args;
  try {
    args = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(`${(error as Error).message}\n\n${USAGE}`);
    process.exit(1);
  }

  if (args.help) {
    console.log(USAGE);
    return;
  }

  // Without a terminal, or with --yes, nothing is asked: what wasn't given takes its default.
  const ask = process.stdin.isTTY === true && !args.yes;
  // Looked up now: it takes a moment, and a pause between two questions looks like a hang.
  const hasPnpm = run("pnpm", ["--version"], process.cwd(), true);
  intro("mismo");

  const name =
    args.name ??
    (ask
      ? answer(
          await text({
            message: "Where should the project go?",
            placeholder: DEFAULT_NAME,
            defaultValue: DEFAULT_NAME,
            validate: (value) => (packageName(value || DEFAULT_NAME) ? undefined : "Use letters, digits and dashes."),
          }),
        )
      : DEFAULT_NAME);
  const dir = path.resolve(process.cwd(), name);
  if (!packageName(path.basename(dir))) fail(`"${name}" has no letters or digits to name a project with.`);
  if (!isFree(dir)) fail(`${dir} already exists and isn't empty.`);

  const web = args.web ?? (ask ? await chooseWeb() : [...WEB_APPS]);
  if (web.length === 0) fail("Keep at least one web app: --web next, tanstack or both.");
  const native = args.native ?? (ask ? answer(await confirm({ message: "Include the Expo native app?", initialValue: true })) : true);

  const install = (args.install ?? (ask ? answer(await confirm({ message: "Install dependencies now?", initialValue: true })) : true)) && hasPnpm;
  const git = args.git ?? (ask ? answer(await confirm({ message: "Start a git repository?", initialValue: true })) : true);

  const progress = spinner();
  progress.start("Getting the starter");
  try {
    await fetchStarter(args.template ?? STARTER, dir);
    progress.message("Setting it up");
    customize(dir, { name: path.basename(dir), web, native });
    progress.stop("The project is ready");
  } catch (error) {
    progress.error("Couldn't set up the project");
    rmSync(dir, { recursive: true, force: true });
    fail((error as Error).message);
  }

  if (git) {
    // Not inside a repository already: a project in a monorepo or a workspace joins that one.
    const inside = run("git", ["rev-parse", "--is-inside-work-tree"], path.dirname(dir), true);
    if (!inside && !run("git", ["init"], dir, true)) log.warn("Couldn't start a git repository. Run `git init` yourself.");
  }

  if (install && !run("pnpm", ["install"], dir)) log.warn("Installing failed. Run `pnpm install` in the project when you can.");
  if (!hasPnpm && args.install !== false) log.warn("pnpm isn't installed, so dependencies weren't. Install pnpm 10 (https://pnpm.io/installation), then run `pnpm install`.");

  const steps = [`cd ${path.relative(process.cwd(), dir) || "."}`, ...(install ? [] : ["pnpm install"]), "pnpm dev"];
  const opens = [...web.map((app) => `${WEB_NAMES[app]}: http://localhost:${WEB_PORTS[app]}`), ...(native ? ["Expo: `pnpm native` opens the native app"] : [])];
  outro(`Done. Next:\n\n  ${steps.join("\n  ")}\n\nThen open:\n\n  ${opens.join("\n  ")}`);
}

void main();
