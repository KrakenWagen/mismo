import { ChevronLeft, ChevronRight, House, Lock, Settings as SettingsIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// The hero's mockups: one example app, drawn twice. The browser is the web app, the phone the
// native one. Both render the same screen from the same state, and both navigate it, the way the
// shared screens do in a real pair of apps.

export type ScreenId = "layout" | "index" | "org" | "person" | "settings" | "signin";
export type DemoState = { file: ScreenId; org: number; person: number };

export const orgs = [
  { id: "acme", name: "Acme", members: [0, 1, 2, 3] },
  { id: "globex", name: "Globex", members: [4, 1, 5] },
  { id: "initech", name: "Initech", members: [2, 5, 0] },
];

export const people = [
  { id: "ana", name: "Ana Ruiz", role: "Owner", tone: "bg-orange-400" },
  { id: "kenji", name: "Kenji Sato", role: "Admin", tone: "bg-sky-400" },
  { id: "lea", name: "Lea Novak", role: "Member", tone: "bg-emerald-400" },
  { id: "omar", name: "Omar Haddad", role: "Member", tone: "bg-violet-400" },
  { id: "mia", name: "Mia Chen", role: "Owner", tone: "bg-rose-400" },
  { id: "tom", name: "Tom Berg", role: "Member", tone: "bg-amber-400" },
];

/** What each screen is called, where it lives, and where Back goes. */
export function describe(state: DemoState) {
  const org = orgs[state.org]!;
  const person = people[state.person]!;
  const view = state.file === "layout" ? "index" : state.file;

  switch (view) {
    case "index":
      return { view, title: "Organizations", url: "/", back: undefined };
    case "org":
      return { view, title: org.name, url: `/orgs/${org.id}`, back: { label: "Orgs", to: "index" as const } };
    case "person":
      return { view, title: person.name, url: `/people/${person.id}`, back: { label: org.name, to: "org" as const } };
    case "settings":
      return { view, title: "Settings", url: "/settings", back: undefined };
    case "signin":
      return { view, title: "Sign in", url: "/sign-in", back: undefined };
  }
}

export type Navigate = (to: Partial<DemoState> & { file: ScreenId }) => void;

function Avatar({ person, className }: { person: (typeof people)[number]; className?: string }) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-full font-medium text-white", person.tone, className)}
      aria-hidden
    >
      {person.name[0]}
    </span>
  );
}

/** iOS's glass, drawn: a translucent fill, a bright top edge, and a soft shadow. No blur. */
const glass =
  "rounded-full border border-white/70 bg-white/75 shadow-[0_6px_18px_-6px_rgb(0_0_0/0.25),inset_0_1px_0_rgb(255_255_255/0.9)] dark:border-white/10 dark:bg-white/[0.09] dark:shadow-[0_6px_18px_-6px_rgb(0_0_0/0.6),inset_0_1px_0_rgb(255_255_255/0.12)]";

/** Marks what the layout file draws: an outline with its own rounded corners, inside the shape. */
function Outline({ className }: { className?: string }) {
  return <span className={cn("pointer-events-none absolute border-2 border-brand", className)} aria-hidden />;
}

/** A switch, drawn: on is the brand color. */
function Switch({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 rounded-full transition", on ? "bg-brand" : "bg-foreground/15", className)}
      aria-hidden
    >
      <span className={cn("absolute top-[2px] aspect-square h-[calc(100%-4px)] rounded-full bg-white shadow-sm transition-all", on ? "right-[2px]" : "left-[2px]")} />
    </span>
  );
}

/* ─── Browser ───────────────────────────────────────────────────────────────── */

export function BrowserMock({
  state,
  navigate,
  className,
  contentClassName,
}: {
  state: DemoState;
  navigate: Navigate;
  className?: string;
  /** For the page area, such as room on the right where something covers it. */
  contentClassName?: string;
}) {
  const screen = describe(state);
  const chrome = screen.view !== "signin";
  const highlight = state.file === "layout";

  return (
    <div className={cn("@container/browser flex flex-col overflow-hidden rounded-xl border bg-card shadow-[0_24px_60px_-30px_rgb(0_0_0/0.35)]", className)}>
      <div className="flex items-center gap-3 border-b bg-muted/50 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="hidden items-center gap-1 text-muted-foreground/60 sm:flex" aria-hidden>
          <ChevronLeft className="size-3.5" />
          <ChevronRight className="size-3.5" />
        </span>
        <span className="mx-auto flex w-full max-w-56 items-center justify-center gap-1.5 truncate rounded-md bg-background px-3 py-1 text-[11px] text-muted-foreground shadow-xs">
          <Lock className="size-2.5 shrink-0" />
          acme.app{screen.url === "/" ? "" : screen.url}
        </span>
        <span className="hidden w-14 sm:block" aria-hidden />
      </div>

      <div className="flex min-h-0 flex-1 text-left text-xs">
        {chrome && (
          <nav
            className={cn(
              // A sidebar where the browser is wide, a rail of icons where it isn't.
              "relative flex w-11 shrink-0 flex-col items-center gap-0.5 border-r p-1.5 transition @[26rem]/browser:w-32 @[26rem]/browser:items-stretch @[26rem]/browser:p-2.5",
              highlight && "bg-brand-soft",
            )}
          >
            {highlight && <Outline className="inset-1 rounded-lg" />}
            <p className="mb-2 px-2 pt-1 text-sm font-semibold tracking-tight">
              <span className="@[26rem]/browser:hidden">a</span>
              <span className="hidden @[26rem]/browser:inline">acme</span>
            </p>
            {(
              [
                ["Home", "index", House],
                ["Settings", "settings", SettingsIcon],
              ] as const
            ).map(([label, file, Icon]) => {
              const active = file === "settings" ? screen.view === "settings" : screen.view !== "settings";
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => navigate({ file })}
                  className={cn(
                    "flex items-center gap-2 rounded-md p-1.5 text-left transition @[26rem]/browser:px-2",
                    active ? "bg-foreground/[0.06] font-medium" : "text-muted-foreground hover:bg-foreground/[0.04]",
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="sr-only @[26rem]/browser:not-sr-only">{label}</span>
                </button>
              );
            })}
          </nav>
        )}
        <div className={cn("@container min-w-0 flex-1 overflow-hidden p-4 sm:p-5", contentClassName)}>
          <WebScreen state={state} navigate={navigate} />
        </div>
      </div>
    </div>
  );
}

function WebRow({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-muted/60"
    >
      {children}
      <ChevronRight className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
    </button>
  );
}

function WebScreen({ state, navigate }: { state: DemoState; navigate: Navigate }) {
  const screen = describe(state);
  const org = orgs[state.org]!;
  const person = people[state.person]!;

  if (screen.view === "signin") {
    return (
      <div className="mx-auto flex max-w-56 flex-col gap-2.5 pt-6">
        <p className="text-base font-semibold tracking-tight">Sign in</p>
        <span className="rounded-md border bg-background px-2.5 py-1.5 text-muted-foreground">ana@acme.co</span>
        <button
          type="button"
          onClick={() => navigate({ file: "index" })}
          className="rounded-md bg-foreground px-2.5 py-1.5 font-medium text-background transition hover:opacity-90"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <>
      {screen.back && (
        <button
          type="button"
          onClick={() => navigate({ file: screen.back!.to })}
          className="mb-1 flex items-center gap-0.5 text-[11px] text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="size-3" /> {screen.back.label}
        </button>
      )}
      <p className="text-base font-semibold tracking-tight">{screen.title}</p>

      {screen.view === "index" && (
        <div className="mt-3 divide-y overflow-hidden rounded-lg border">
          {orgs.map((o, i) => (
            <WebRow key={o.id} onClick={() => navigate({ file: "org", org: i })}>
              <span className="flex size-6 items-center justify-center rounded-md bg-muted font-semibold">{o.name[0]}</span>
              <span className="truncate font-medium">{o.name}</span>
              <span className="ml-auto hidden shrink-0 text-muted-foreground @[13rem]:inline">{o.members.length} people</span>
            </WebRow>
          ))}
        </div>
      )}

      {screen.view === "org" && (
        <div className="mt-3 divide-y overflow-hidden rounded-lg border">
          {org.members.map((i) => (
            <WebRow key={i} onClick={() => navigate({ file: "person", person: i })}>
              <Avatar person={people[i]!} className="size-6 text-[10px]" />
              <span className="truncate font-medium whitespace-nowrap">{people[i]!.name}</span>
              <span className="ml-auto hidden shrink-0 text-muted-foreground @[14rem]:inline">{people[i]!.role}</span>
            </WebRow>
          ))}
        </div>
      )}

      {screen.view === "person" && (
        <div className="mt-3 rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <Avatar person={person} className="size-10 text-sm" />
            <div className="min-w-0">
              <p className="truncate font-medium">{person.role} at {org.name}</p>
              <p className="truncate text-muted-foreground">
                {person.id}@{org.id}.co
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate({ file: "org" })}
            className="mt-3 rounded-md border px-2.5 py-1 transition hover:bg-muted"
          >
            Back to the team
          </button>
        </div>
      )}

      {screen.view === "settings" && (
        <div className="mt-3 divide-y overflow-hidden rounded-lg border">
          {(
            [
              ["Notifications", true],
              ["Weekly digest", false],
            ] as const
          ).map(([label, on]) => (
            <div key={label} className="flex items-center px-3 py-2.5">
              {label}
              <Switch on={on} className="ml-auto h-4 w-7" />
            </div>
          ))}
          <button
            type="button"
            onClick={() => navigate({ file: "signin" })}
            className="w-full px-3 py-2.5 text-left font-medium text-destructive transition hover:bg-muted/60"
          >
            Sign out
          </button>
        </div>
      )}
    </>
  );
}

/* ─── Phone ─────────────────────────────────────────────────────────────────── */

export function PhoneMock({ state, navigate, className }: { state: DemoState; navigate: Navigate; className?: string }) {
  const screen = describe(state);
  const chrome = screen.view !== "signin";
  const highlight = state.file === "layout";

  return (
    <div className={cn("relative aspect-[9/19.2] rounded-[2.6rem] bg-[oklch(0.2_0.005_60)] p-[5px] shadow-[0_30px_70px_-25px_rgb(0_0_0/0.55),inset_0_0_0_1px_rgb(255_255_255/0.08)] dark:bg-[oklch(0.3_0.005_60)]", className)}>
      {/* Side buttons. */}
      <span className="absolute top-[22%] -left-[2px] h-[6%] w-[3px] rounded-l bg-[oklch(0.2_0.005_60)] dark:bg-[oklch(0.3_0.005_60)]" aria-hidden />
      <span className="absolute top-[30%] -left-[2px] h-[9%] w-[3px] rounded-l bg-[oklch(0.2_0.005_60)] dark:bg-[oklch(0.3_0.005_60)]" aria-hidden />
      <span className="absolute top-[26%] -right-[2px] h-[12%] w-[3px] rounded-r bg-[oklch(0.2_0.005_60)] dark:bg-[oklch(0.3_0.005_60)]" aria-hidden />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[2.25rem] bg-[oklch(0.965_0.004_85)] text-left text-[10px] dark:bg-[oklch(0.13_0.004_60)]">
        {/* Status bar and the dynamic island. */}
        <div className="relative flex h-[30px] shrink-0 items-center justify-between px-[18px] pt-[3px] text-[9.5px] font-semibold" aria-hidden>
          <span>9:41</span>
          <span className="absolute top-[7px] left-1/2 h-[17px] w-[32%] -translate-x-1/2 rounded-full bg-black" />
          <span className="flex items-center gap-[3px]">
            <span className="flex items-end gap-px">
              {[3, 4.5, 6, 7.5].map((h) => (
                <span key={h} className="w-[2px] rounded-[1px] bg-current" style={{ height: h }} />
              ))}
            </span>
            <span className="ml-0.5 h-[7px] w-[14px] rounded-[2.5px] border border-current/60 p-px">
              <span className="block h-full w-3/4 rounded-[1px] bg-current" />
            </span>
          </span>
        </div>

        {/* Navigation bar, then the large title. */}
        <div className="flex h-[22px] shrink-0 items-center px-2">
          {screen.back && (
            <button
              type="button"
              onClick={() => navigate({ file: screen.back!.to })}
              className="-ml-0.5 flex items-center rounded-md pr-1 text-[10px] text-brand transition hover:bg-brand-soft"
            >
              <ChevronLeft className="size-3.5" />
              {screen.back.label}
            </button>
          )}
        </div>
        <p className="shrink-0 truncate px-[14px] pb-2 text-[19px] leading-tight font-bold tracking-tight">{screen.title}</p>

        <div className={cn("min-h-0 flex-1 overflow-hidden px-[10px]", chrome && "pb-[64px]")}>
          <PhoneScreen state={state} navigate={navigate} />
        </div>

        {chrome && (
          <div className="absolute inset-x-[10px] bottom-[18px] flex">
            {highlight && <Outline className="-inset-[4px] rounded-full" />}
            <div className={cn(glass, "flex flex-1 p-[3px]")}>
              {(
                [
                  ["Home", "index", House],
                  ["Settings", "settings", SettingsIcon],
                ] as const
              ).map(([label, file, Icon]) => {
                const active = file === "settings" ? screen.view === "settings" : screen.view !== "settings";
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigate({ file })}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-[1px] rounded-full py-[4px] text-[7.5px] font-medium transition",
                      active ? "bg-foreground/[0.07] text-brand" : "text-foreground/60 hover:bg-foreground/[0.05] hover:text-foreground",
                    )}
                  >
                    <Icon className="size-[14px]" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <span className="absolute bottom-[6px] left-1/2 h-[4px] w-[34%] -translate-x-1/2 rounded-full bg-foreground/80" aria-hidden />
      </div>
    </div>
  );
}

/** An iOS grouped list: rows on a rounded card, with inset separators. */
function Group({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-[10px] bg-card [&>*+*]:border-t [&>*+*]:border-foreground/8">{children}</div>;
}

function PhoneRow({ onClick, children, chevron = true }: { onClick?: () => void; children: ReactNode; chevron?: boolean }) {
  const className = "flex min-h-[32px] w-full items-center gap-2 px-[10px] py-[6px] text-left";
  if (!onClick) return <div className={className}>{children}</div>;

  return (
    <button type="button" onClick={onClick} className={cn(className, "transition hover:bg-foreground/[0.04] active:bg-foreground/[0.08]")}>
      {children}
      {chevron && <ChevronRight className="ml-auto size-3 shrink-0 text-foreground/25" />}
    </button>
  );
}

function PhoneScreen({ state, navigate }: { state: DemoState; navigate: Navigate }) {
  const screen = describe(state);
  const org = orgs[state.org]!;
  const person = people[state.person]!;

  switch (screen.view) {
    case "index":
      return (
        <Group>
          {orgs.map((o, i) => (
            <PhoneRow key={o.id} onClick={() => navigate({ file: "org", org: i })}>
              <span className="flex size-[22px] items-center justify-center rounded-[6px] bg-muted font-semibold">{o.name[0]}</span>
              <span className="font-medium">{o.name}</span>
              <span className="ml-auto text-foreground/40">{o.members.length}</span>
            </PhoneRow>
          ))}
        </Group>
      );
    case "org":
      return (
        <>
          <p className="px-[10px] pb-1 text-[8.5px] font-medium uppercase tracking-wide text-foreground/45">Members</p>
          <Group>
            {org.members.map((i) => (
              <PhoneRow key={i} onClick={() => navigate({ file: "person", person: i })}>
                <Avatar person={people[i]!} className="size-[22px] text-[9px]" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{people[i]!.name}</span>
                  <span className="block text-[8.5px] text-foreground/45">{people[i]!.role}</span>
                </span>
              </PhoneRow>
            ))}
          </Group>
        </>
      );
    case "person":
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center gap-1.5 pt-1">
            <Avatar person={person} className="size-12 text-lg" />
            <p className="text-foreground/50">
              {person.role} · {org.name}
            </p>
          </div>
          <Group>
            <PhoneRow chevron={false}>
              <span className="text-foreground/50">Email</span>
              <span className="ml-auto">
                {person.id}@{org.id}.co
              </span>
            </PhoneRow>
          </Group>
          <button
            type="button"
            onClick={() => navigate({ file: "org" })}
            className="rounded-[10px] bg-brand py-[7px] font-semibold text-white transition hover:brightness-110 active:brightness-95"
          >
            Back to the team
          </button>
        </div>
      );
    case "settings":
      return (
        <Group>
          {(
            [
              ["Notifications", true],
              ["Weekly digest", false],
            ] as const
          ).map(([label, on]) => (
            <PhoneRow key={label} chevron={false}>
              {label}
              <Switch on={on} className="ml-auto h-[16px] w-[28px]" />
            </PhoneRow>
          ))}
          <PhoneRow chevron={false} onClick={() => navigate({ file: "signin" })}>
            <span className="text-destructive">Sign out</span>
          </PhoneRow>
        </Group>
      );
    case "signin":
      return (
        <div className="flex flex-col gap-2 pt-2">
          <Group>
            <PhoneRow chevron={false}>
              <span className="text-foreground/40">ana@acme.co</span>
            </PhoneRow>
          </Group>
          <button
            type="button"
            onClick={() => navigate({ file: "index" })}
            className="rounded-[10px] bg-brand py-[7px] font-semibold text-white transition hover:brightness-110 active:brightness-95"
          >
            Continue
          </button>
        </div>
      );
  }
}
