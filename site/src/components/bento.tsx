import { ArrowDown, Compass, FileCode2, Folder, type LucideIcon, Route, ShieldCheck, Split } from "lucide-react";
import type { ReactNode } from "react";
import { type SimpleIcon, siExpo, siNextdotjs, siReactrouter, siTanstack } from "simple-icons";

import { cn } from "@/lib/utils";

// What mismo shares, as one grid. The tall cell is the core: one routes folder, and each platform
// on the stack you pick. Beside it, navigation (wide), then type-safe links and platform versions.

function Cell({
  className,
  title,
  icon: Icon,
  children,
  visual,
}: {
  className?: string;
  title: string;
  /** A light icon in the corner, hinting at the message. */
  icon: LucideIcon;
  children: ReactNode;
  visual?: ReactNode;
}) {
  return (
    <div className={cn("reveal-on-scroll relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6", className)}>
      <span className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand" aria-hidden>
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <p className="pr-10 font-medium">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{children}</p>
      {visual && <div className="mt-6 flex flex-1 flex-col justify-end">{visual}</div>}
    </div>
  );
}

function Logo({ icon, className }: { icon: SimpleIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4 shrink-0 fill-current", className)} aria-hidden>
      <path d={icon.path} />
    </svg>
  );
}

const Tag = ({ children }: { children: ReactNode }) => <span className="text-sky-700 dark:text-sky-300">{children}</span>;
const Attr = ({ children }: { children: ReactNode }) => <span className="text-violet-700 dark:text-violet-300">{children}</span>;
const Str = ({ children }: { children: ReactNode }) => <span className="text-emerald-700 dark:text-emerald-300">{children}</span>;
const Fn = ({ children }: { children: ReactNode }) => <span className="text-brand">{children}</span>;
const Kw = ({ children }: { children: ReactNode }) => <span className="text-rose-700 dark:text-rose-300">{children}</span>;

/* ─── Routes, on the stack you pick ─────────────────────────────────────────── */

const routes = [
  { name: "_layout.tsx", depth: 1, url: "layout" },
  { name: "index.tsx", depth: 1, url: "/" },
  { name: "orgs", depth: 1 },
  { name: "[id].tsx", depth: 2, url: "/orgs/:id", active: true },
  { name: "settings.tsx", depth: 1, url: "/settings" },
];

const platforms = [
  { url: "acme://orgs/acme", stacks: [{ name: "Expo Router", icon: siExpo }] },
  {
    url: "acme.app/orgs/acme",
    stacks: [
      { name: "Next.js", icon: siNextdotjs },
      { name: "TanStack Start", icon: siTanstack },
      { name: "React Router", icon: siReactrouter },
    ],
  },
];

function RoutesStackVisual() {
  return (
    <div className="flex flex-1 flex-col gap-2 text-xs">
      <ul className="rounded-xl border bg-muted/40 py-2 font-mono">
        <li className="flex items-center gap-1.5 px-3 py-1 text-muted-foreground">
          <Folder className="size-3.5 text-brand" /> routes
        </li>
        {routes.map((route) => (
          <li
            key={route.name + route.depth}
            className={cn("flex items-center gap-1.5 py-1 pr-3", route.active && "bg-brand-soft")}
            style={{ paddingLeft: `${route.depth * 0.9 + 0.75}rem` }}
          >
            {route.url ? (
              <>
                <FileCode2 className={cn("size-3.5", route.active ? "text-brand" : "text-muted-foreground")} />
                {route.name}
                <span className="ml-auto text-muted-foreground">{route.url}</span>
              </>
            ) : (
              <>
                <Folder className="size-3.5 text-brand" />
                <span className="text-muted-foreground">{route.name}</span>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* From the file to each platform's app. */}
      <div className="flex min-h-6 flex-1 flex-col items-center" aria-hidden>
        <span className="w-px flex-1 border-l border-dashed border-brand/50" />
        <ArrowDown className="size-3.5 text-brand" />
      </div>

      <ul className="space-y-2">
        {platforms.map((platform) => (
          <li key={platform.url} className="space-y-2 rounded-lg border bg-background p-3">
            <span className="flex flex-wrap gap-1.5">
              {platform.stacks.map((stack) => (
                <span key={stack.name} className="inline-flex h-6 items-center gap-1.5 rounded-md border bg-muted/40 px-2">
                  <Logo icon={stack.icon} className="size-3" />
                  {stack.name}
                </span>
              ))}
            </span>
            <span className="block truncate font-mono">{platform.url}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Shared navigation ─────────────────────────────────────────────────────── */

function NavigationVisual() {
  const go: ReactNode[] = [
    <>
      <Tag>{"<Link"}</Tag> <Attr>to</Attr>=<Str>"/settings"</Str>
      <Tag>{">"}</Tag>Settings<Tag>{"</Link>"}</Tag>
    </>,
    <>
      <Tag>{"<Link"}</Tag> <Attr>to</Attr>={"{{ "}href: <Str>"/orgs/[id]"</Str>, params {"}}"}
      <Tag>{" />"}</Tag>
    </>,
    <>
      nav.<Fn>go</Fn>(<Str>"/settings"</Str>)
    </>,
    <>
      nav.<Fn>back</Fn>()
    </>,
  ];
  const read: ReactNode[] = [
    <>
      <Kw>const</Kw> {"{ id }"} = <Fn>useParams</Fn>(<Str>"/orgs/[id]"</Str>)
    </>,
    <>
      <Kw>const</Kw> {"{ token }"} = <Fn>useSearchParams</Fn>()
    </>,
    <>
      <Kw>const</Kw> path = <Fn>usePathname</Fn>()
    </>,
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {[
        ["Navigate", go],
        ["Read the route", read],
      ].map(([label, lines]) => (
        <div key={label as string} className="rounded-xl border bg-muted/40 px-4 py-3">
          <p className="mb-2 text-[11px] text-muted-foreground">{label as string}</p>
          <div className="space-y-1.5 overflow-x-auto font-mono text-xs whitespace-nowrap">
            {(lines as ReactNode[]).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Type safety ───────────────────────────────────────────────────────────── */

function TypedVisual() {
  return (
    <div className="rounded-xl border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
      <p className="text-muted-foreground">// in a shared screen</p>
      <p className="mt-1">
        <Tag>{"<Link"}</Tag> <Attr>to</Attr>=
        <span className="underline decoration-destructive decoration-wavy underline-offset-4">
          <Str>"/billing"</Str>
        </span>
        <Tag>{" />"}</Tag>
      </p>
      <p className="mt-2 font-sans text-destructive">/billing only exists on the web.</p>
    </div>
  );
}

/* ─── Platform versions ─────────────────────────────────────────────────────── */

function PlatformVisual() {
  const files = [
    { stem: "checkout", suffix: "", note: "Both", tone: "" },
    { stem: "checkout", suffix: ".web", note: "Web", tone: "text-sky-600 dark:text-sky-400" },
    { stem: "scan", suffix: ".native", note: "Native", tone: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <ul className="divide-y rounded-xl border bg-muted/40 font-mono text-xs">
      {files.map((file) => (
        <li key={file.stem + file.suffix} className="flex items-center gap-2 px-3 py-2">
          <FileCode2 className="size-3.5 shrink-0 text-muted-foreground" />
          <span>
            {file.stem}
            <span className={file.tone}>{file.suffix}</span>.tsx
          </span>
          <span className="ml-auto font-sans text-muted-foreground">{file.note}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── The grid ──────────────────────────────────────────────────────────────── */

export function Bento() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Cell className="md:col-span-2 lg:col-span-1 lg:row-span-2" title="Shared routes, any stack" icon={Route} visual={<RoutesStackVisual />}>
        One file becomes a route in every app. Switch frameworks anytime.
      </Cell>
      <Cell className="md:col-span-2" title="One way to navigate" icon={Compass} visual={<NavigationVisual />}>
        A single API in every screen. Real links on the web, native transitions on the phone.
      </Cell>
      <Cell title="Typed links, per platform" icon={ShieldCheck} visual={<TypedVisual />}>
        Links and params are typed from your routes, and know which platforms have each one.
      </Cell>
      <Cell title="Different where it matters" icon={Split} visual={<PlatformVisual />}>
        Give a screen a .web or .native version, or keep it on one platform, no Platform.OS.
      </Cell>
    </div>
  );
}
