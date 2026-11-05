import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const links = [
  { label: "Docs", to: "/docs/$slug", slug: "introduction" },
  { label: "Getting started", to: "/docs/$slug", slug: "getting-started" },
  { label: "Routers", to: "/docs/$slug", slug: "routers" },
] as const;

/**
 * The bar on every page. `wide` spans the docs' three columns; `start` holds what comes before the
 * logo, such as the docs' menu button on small screens.
 */
export function SiteHeader({ wide = false, start }: { wide?: boolean; start?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className={cn("mx-auto flex h-14 w-full items-center gap-6 px-4 sm:px-6", wide ? "max-w-[1440px]" : "max-w-6xl")}>
        {start}
        <Link to="/" className="font-display text-2xl leading-none tracking-tight">
          mismo
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              params={{ slug: link.slug }}
              className="transition hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="hidden font-mono text-[11px] sm:inline-flex">
            beta
          </Badge>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
