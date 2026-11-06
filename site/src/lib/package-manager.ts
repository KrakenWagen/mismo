import { useSyncExternalStore } from "react";

// The reader's package manager, shared by every install command: picking one switches them all,
// on this page and on the next, and in other tabs. Kept in localStorage, so it outlasts a reload.
// A plain store rather than a context: the docs' pages are separate MDX modules, and this needs no
// provider around them.

export const packageManagers = ["npm", "pnpm", "yarn", "bun"] as const;
export type PackageManager = (typeof packageManagers)[number];

const key = "mismo:package-manager";
const fallback: PackageManager = "npm";
const listeners = new Set<() => void>();

function read(): PackageManager {
  try {
    const stored = localStorage.getItem(key);
    return packageManagers.includes(stored as PackageManager) ? (stored as PackageManager) : fallback;
  } catch {
    return fallback;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed it.
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setPackageManager(manager: PackageManager) {
  try {
    localStorage.setItem(key, manager);
  } catch {
    // Storage is off (a private window, blocked site data): the choice lasts until the page closes.
    memory = manager;
  }
  for (const listener of listeners) listener();
}

// Where the choice lives when localStorage can't hold it.
let memory: PackageManager | undefined;

/** The reader's package manager. The server renders the fallback; the browser then shows the stored one. */
export function usePackageManager(): PackageManager {
  return useSyncExternalStore(
    subscribe,
    () => memory ?? read(),
    () => fallback,
  );
}

/**
 * The command that starts a project with `manager`: `pnpm create mismo my-app`. npm asks for
 * `@latest`, so it doesn't run an older copy it cached.
 */
export function createCommand(manager: PackageManager, name = "my-app"): string {
  return manager === "npm" ? `npm create mismo@latest ${name}` : `${manager} create mismo ${name}`;
}

/** The command that adds `packages` with `manager`. */
export function installCommand(manager: PackageManager, packages: string): string {
  return manager === "npm" ? `npm i ${packages}` : `${manager} add ${packages}`;
}
