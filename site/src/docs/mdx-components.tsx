import { Link } from "@tanstack/react-router";
import { Info, TriangleAlert } from "lucide-react";
import type { MDXComponents } from "mdx/types";
import { Children, type ComponentProps, isValidElement, type ReactElement, type ReactNode, useRef, useState } from "react";

import { CopyButton } from "@/components/code-block";
import { InstallCommand } from "@/components/install-command";
import { cn } from "@/lib/utils";

/** A code block from Shiki, with its file name when the fence gave one, and a copy button. */
function Pre({ className, children, ...props }: ComponentProps<"pre"> & { "data-title"?: string }) {
  const ref = useRef<HTMLPreElement>(null);
  const title = props["data-title"];

  return (
    <figure className="group relative my-6 overflow-hidden rounded-xl border bg-code">
      {title && (
        <figcaption className="border-b px-4 py-2.5 font-mono text-xs text-muted-foreground">{title}</figcaption>
      )}
      <pre
        ref={ref}
        {...props}
        className={cn(className, "overflow-x-auto p-4 font-mono text-[13px] leading-relaxed outline-none")}
      >
        {children}
      </pre>
      <CopyButton
        text={() => ref.current?.innerText ?? ""}
        className={cn(
          "absolute right-2 bg-code opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100",
          title ? "top-1.5" : "top-2.5",
        )}
      />
    </figure>
  );
}

/** Internal links go through the router, so moving between pages doesn't reload. */
function A({ href = "", children, ...props }: ComponentProps<"a">) {
  if (href.startsWith("/")) {
    return (
      <Link to={href} className="font-medium text-foreground underline decoration-brand/50 underline-offset-4 hover:decoration-brand">
        {children}
      </Link>
    );
  }
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      {...props}
      className="font-medium text-foreground underline decoration-brand/50 underline-offset-4 hover:decoration-brand"
    >
      {children}
    </a>
  );
}

/**
 * Alternatives side by side, such as one per framework:
 *
 *     <Tabs>
 *       <Tab label="Next.js">…</Tab>
 *       <Tab label="TanStack Start">…</Tab>
 *     </Tabs>
 */
export function Tabs({ children }: { children: ReactNode }) {
  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<{ label: string; children: ReactNode }> => isValidElement(child) && "label" in (child.props as object),
  );
  const [open, setOpen] = useState(0);

  return (
    <div className="my-6">
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab, i) => (
          <button
            key={tab.props.label}
            type="button"
            role="tab"
            aria-selected={open === i}
            onClick={() => setOpen(i)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 pb-2 text-sm transition",
              open === i ? "border-brand font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      {/* Every tab is rendered, so the prerendered page holds all of them; only the open one shows. */}
      {tabs.map((tab, i) => (
        <div key={tab.props.label} role="tabpanel" hidden={open !== i} className="[&>*:first-child]:mt-4">
          {tab.props.children}
        </div>
      ))}
    </div>
  );
}

/** One tab of `<Tabs>`. */
export function Tab({ children }: { label: string; children: ReactNode }) {
  return <>{children}</>;
}

/** A note beside the text: `<Callout>` for a tip, `<Callout kind="warning">` for a limit. */
export function Callout({ kind = "note", children }: { kind?: "note" | "warning"; children: ReactNode }) {
  const Icon = kind === "warning" ? TriangleAlert : Info;
  return (
    <div
      className={cn(
        "my-6 flex gap-3 rounded-xl border px-4 py-3.5 text-[15px] [&_p]:my-0",
        kind === "warning" ? "border-amber-500/30 bg-amber-500/8" : "border-brand/30 bg-brand-soft",
      )}
    >
      <Icon className={cn("mt-1 size-4 shrink-0", kind === "warning" ? "text-amber-600 dark:text-amber-400" : "text-brand")} />
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function heading(Tag: "h2" | "h3", className: string) {
  return ({ id, children }: ComponentProps<"h2">) => (
    <Tag id={id} className={cn("group scroll-mt-24", className)}>
      {children}
      {id && (
        <a href={`#${id}`} aria-label="Link to this section" className="ml-2 text-muted-foreground/50 opacity-0 transition group-hover:opacity-100">
          #
        </a>
      )}
    </Tag>
  );
}

export const mdxComponents: MDXComponents = {
  h2: heading("h2", "mt-14 mb-4 border-t pt-10 font-display text-3xl tracking-tight first:mt-0 first:border-0 first:pt-0"),
  h3: heading("h3", "mt-10 mb-3 text-lg font-semibold tracking-tight"),
  p: (props) => <p className="my-4 leading-7 text-foreground/85" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-2 pl-6 leading-7 text-foreground/85 marker:text-brand" {...props} />,
  ol: (props) => <ol className="my-4 list-decimal space-y-2 pl-6 leading-7 text-foreground/85 marker:text-muted-foreground" {...props} />,
  li: (props) => <li className="pl-1" {...props} />,
  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
  a: A,
  // Inline code only: a code block's <code> sits inside <pre>, which resets these.
  code: (props) => (
    <code
      className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] [pre_&]:border-0 [pre_&]:bg-transparent [pre_&]:p-0 [pre_&]:text-[1em]"
      {...props}
    />
  ),
  pre: Pre,
  table: (props) => (
    <div className="my-6 overflow-x-auto rounded-xl border">
      <table className="w-full text-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-muted/50" {...props} />,
  th: (props) => <th className="border-b px-4 py-2.5 text-left font-medium" {...props} />,
  td: (props) => <td className="border-b px-4 py-2.5 align-top text-foreground/85 [tr:last-child_&]:border-0" {...props} />,
  hr: () => <hr className="my-10" />,
  Callout,
  Tabs,
  Tab,
  // `<Install packages="@mismo/core @mismo/next" title="apps/web" />`: in the reader's package manager.
  Install: (props: { packages: string; title?: string }) => <InstallCommand {...props} className="my-6 max-w-none" />,
};
