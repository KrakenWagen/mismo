import { CopyButton } from "@/components/code-block";
import { installCommand, packageManagers, setPackageManager, usePackageManager } from "@/lib/package-manager";
import { cn } from "@/lib/utils";

// An install command, for whichever package manager the reader uses. The choice is shared by every
// install command on the site (see lib/package-manager.ts).

export function InstallCommand({
  packages = "@mismo/core @mismo/expo @mismo/next",
  title,
  className,
}: {
  /** The packages to add, space-separated. Defaults to the common pair of apps: Expo and Next.js. */
  packages?: string;
  /** Where to run it, such as `apps/web`, shown beside the tabs. */
  title?: string;
  className?: string;
}) {
  const manager = usePackageManager();
  const command = installCommand(manager, packages);

  return (
    <div className={cn("w-full max-w-xl overflow-hidden rounded-xl border bg-card text-left shadow-xs", className)}>
      <div className="flex items-end justify-between gap-3 border-b px-2 pt-1.5">
        <div role="tablist" aria-label="Package manager" className="flex gap-1">
          {packageManagers.map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={manager === option}
              onClick={() => setPackageManager(option)}
              className={cn(
                "-mb-px border-b-2 px-2 pb-1.5 font-mono text-xs transition",
                manager === option ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        {title && <span className="truncate pr-2 pb-1.5 font-mono text-[11px] text-muted-foreground">{title}</span>}
      </div>
      <div className="flex items-center gap-3 py-1.5 pr-1.5 pl-4 font-mono text-[13px]">
        <span className="text-brand select-none">$</span>
        <span className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap py-1">{command}</span>
        <CopyButton text={command} />
      </div>
    </div>
  );
}
