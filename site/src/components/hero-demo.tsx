import { ChevronDown, FileCode2, Folder, MousePointerClick } from "lucide-react";
import { useState } from "react";

import { CopyButton } from "@/components/code-block";
import { Badge } from "@/components/ui/badge";
import { BrowserMock, type DemoState, type Navigate, PhoneMock, type ScreenId } from "@/components/devices";
import { type SnippetName, snippets } from "@/content/snippets";
import { cn } from "@/lib/utils";

// The hero's picture: the example app's routes folder in an editor, and the screen open in it,
// running in a browser and on a phone. Clicking a file opens it in all three; tapping around
// either mockup navigates both, and the editor follows.

const files: { id: ScreenId; name: string; depth: number; snippet: SnippetName }[] = [
  { id: "layout", name: "_layout.tsx", depth: 2, snippet: "heroLayout" },
  { id: "index", name: "index.tsx", depth: 2, snippet: "heroIndex" },
  { id: "org", name: "[id].tsx", depth: 3, snippet: "heroOrg" },
  { id: "person", name: "[id].tsx", depth: 3, snippet: "heroPerson" },
  { id: "settings", name: "settings.tsx", depth: 2, snippet: "heroSettings" },
  { id: "signin", name: "sign-in.tsx", depth: 1, snippet: "heroSignIn" },
];

/** The tree, in order: folders between the files they hold. */
const tree: ({ folder: string; depth: number } | { file: ScreenId })[] = [
  { folder: "routes", depth: 0 },
  { folder: "(app)", depth: 1 },
  { file: "layout" },
  { file: "index" },
  { folder: "orgs", depth: 2 },
  { file: "org" },
  { folder: "people", depth: 2 },
  { file: "person" },
  { file: "settings" },
  { file: "signin" },
];

const fileOf = (id: ScreenId) => files.find((f) => f.id === id)!;

export function HeroDemo({ html }: { html: Record<SnippetName, string> }) {
  const [state, setState] = useState<DemoState>({ file: "org", org: 0, person: 0 });
  const navigate: Navigate = (to) => setState((current) => ({ ...current, ...to }));
  const open = fileOf(state.file);

  return (
    // The editor, then the two apps: the browser, with the phone lying across its lower-right
    // corner. The browser's page is laid out as a real one would be, and the phone simply covers
    // part of it.
    <div>
      <div className="grid grid-cols-1 items-start gap-y-10 lg:grid-cols-[minmax(0,11fr)_minmax(0,12fr)] lg:gap-x-10">
        <div className="min-w-0">
          <div className="flex h-[440px] min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-[0_24px_60px_-30px_rgb(0_0_0/0.3)] sm:h-[480px]">
            <div className="flex items-center gap-3 border-b bg-muted/50 px-3 py-2">
              <span className="flex gap-1.5" aria-hidden>
                <span className="size-2.5 rounded-full bg-foreground/15" />
                <span className="size-2.5 rounded-full bg-foreground/15" />
                <span className="size-2.5 rounded-full bg-foreground/15" />
              </span>
              <span className="mx-auto font-mono text-[11px] text-muted-foreground">packages/app</span>
              <span className="w-10" aria-hidden />
            </div>

            <div className="flex min-h-0 flex-1">
              <nav aria-label="Example routes" className="hidden w-40 shrink-0 overflow-y-auto border-r bg-muted/30 py-2 font-mono text-[11.5px] sm:block">
                {tree.map((entry) =>
                  "folder" in entry ? (
                    <p
                      key={entry.folder}
                      className="flex items-center gap-1.5 py-1 text-muted-foreground"
                      style={{ paddingLeft: `${entry.depth * 0.75 + 0.5}rem` }}
                    >
                      <ChevronDown className="size-3 shrink-0" />
                      <Folder className="size-3.5 shrink-0 text-brand" />
                      {entry.folder}
                    </p>
                  ) : (
                    <FileButton key={entry.file} id={entry.file} active={state.file === entry.file} onOpen={() => navigate({ file: entry.file })} />
                  ),
                )}
              </nav>

              <div className="flex min-w-0 flex-1 flex-col">
                {/* On small screens, the files as a row of tabs instead of a tree. */}
                <div className="flex gap-1 overflow-x-auto border-b px-2 py-1.5 sm:hidden">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => navigate({ file: file.id })}
                      className={cn(
                        "shrink-0 rounded-md px-2 py-1 font-mono text-[11px] transition",
                        state.file === file.id ? "bg-brand-soft text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {snippets[file.snippet].file.replace("routes/", "").replace("(app)/", "")}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
                  <span className="truncate font-mono text-[11px] text-muted-foreground">{snippets[open.snippet].file}</span>
                  <CopyButton text={snippets[open.snippet].code} />
                </div>
                <div
                  key={open.snippet}
                  className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[11.5px] leading-relaxed animate-in fade-in duration-300"
                  // Shiki's output, made at build time from the snippets.
                  dangerouslySetInnerHTML={{ __html: html[open.snippet] }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {/* As tall as the editor: the browser lines up with its top, the phone with its bottom. */}
          <div className="relative h-[400px] sm:h-[480px]">
            <BrowserMock
              state={state}
              navigate={navigate}
              className="absolute top-0 left-0 h-[280px] w-[calc(100%-64px)] sm:h-[360px] sm:w-[calc(100%-96px)]"
            />
            <PhoneMock state={state} navigate={navigate} className="absolute right-0 bottom-0 z-10 w-[150px] sm:w-[200px]" />
          </div>
        </div>
      </div>

      {/* The hint that it's all live, in a pill like the announcement above the headline. */}
      <div className="mt-10 flex justify-center">
        <Badge variant="outline" className="gap-2 rounded-full bg-card px-3 py-1 font-normal text-muted-foreground">
          <MousePointerClick className="size-3.5 text-foreground" />
          Try it: open a file, or tap around either app
        </Badge>
      </div>
    </div>
  );
}

function FileButton({ id, active, onOpen }: { id: ScreenId; active: boolean; onOpen: () => void }) {
  const file = fileOf(id);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-1.5 py-1 pr-2 text-left transition",
        active ? "bg-brand-soft text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
      )}
      style={{ paddingLeft: `${file.depth * 0.75 + 1.25}rem` }}
    >
      <FileCode2 className={cn("size-3.5 shrink-0", active ? "text-brand" : "")} />
      {file.name}
    </button>
  );
}
