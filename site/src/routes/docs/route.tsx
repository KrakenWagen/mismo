import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { sections } from "@/docs/nav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // A link in the drawer closes it.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <SiteHeader
        wide
        start={
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 lg:hidden"
            aria-label={open ? "Close the docs menu" : "Open the docs menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        }
      />
      <div className="mx-auto flex w-full max-w-[1440px] px-4 sm:px-6">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r py-8 pr-6 lg:block">
          <Sidebar />
        </aside>
        {open && (
          <div className="fixed inset-0 top-14 z-30 overflow-y-auto bg-background px-6 py-6 lg:hidden">
            <Sidebar />
          </div>
        )}
        <Outlet />
      </div>
    </>
  );
}

function Sidebar() {
  return (
    <nav className="space-y-8 text-sm">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {section.title}
          </p>
          <ul className="space-y-0.5 border-l">
            {section.pages.map((page) => (
              <li key={page.slug}>
                <Link
                  to="/docs/$slug"
                  params={{ slug: page.slug }}
                  className={cn(
                    "-ml-px block border-l border-transparent py-1.5 pl-4 text-muted-foreground transition hover:border-foreground/30 hover:text-foreground",
                  )}
                  activeProps={{ className: "!border-brand font-medium !text-foreground" }}
                >
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
