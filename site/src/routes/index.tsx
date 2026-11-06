import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { siExpo, siGithub, siNextdotjs, siReactrouter, siTanstack } from "simple-icons";

import { Bento } from "@/components/bento";
import { BadgeRow, FloatingBadges } from "@/components/framework-badges";
import { HeroDemo } from "@/components/hero-demo";
import { InstallCommand } from "@/components/install-command";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import highlighted from "virtual:highlighted-snippets";

import { navigationArrow } from "@/lib/icons";
import { github, site } from "@/lib/site";

export const Route = createFileRoute("/")({
  head: () => ({ links: [{ rel: "canonical", href: `${site}/` }] }),
  component: Landing,
});


function Landing() {
  return (
    <div className="relative overflow-x-clip">
      <SiteHeader />
      <main>
        <Hero />
        <Solves />
        <GetStarted />
      </main>
      <Footer />
    </div>
  );
}

/* ─── Layout pieces ─────────────────────────────────────────────────────────── */

function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>{children}</div>;
}

function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-20 border-t py-20 sm:py-28", className)}>
      <Container>{children}</Container>
    </section>
  );
}

/** Fades up into place on load, `delay` ms after the page appears. */
function Reveal({ delay = 0, className, children }: { delay?: number; className?: string; children: ReactNode }) {
  return (
    <div className={cn("reveal", className)} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

function Heading({ eyebrow, children, lead }: { eyebrow: string; children: ReactNode; lead?: ReactNode }) {
  return (
    <div className="reveal-on-scroll max-w-3xl">
      <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
      <h2 className="font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">{children}</h2>
      {lead && <p className="mt-5 text-lg text-pretty text-muted-foreground">{lead}</p>}
    </div>
  );
}

/* ─── Hero: the promise, shown ──────────────────────────────────────────────── */

function Hero() {
  const html = highlighted;

  return (
    <section className="relative pt-16 pb-24 sm:pt-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]"
      />
      <Container>
        <div className="relative py-2">
          <Reveal delay={420} className="pointer-events-none absolute inset-0">
            <FloatingBadges />
          </Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <Announcement />
            </Reveal>
            <Reveal delay={70}>
              <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-balance sm:text-7xl">
                Write your screens once. Run them on <em className="text-brand">any</em> stack.
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
                Screens, routes and navigation, shared between native and web. Each platform runs the framework you
                pick.
              </p>
            </Reveal>
            <Reveal delay={210} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-10 w-full sm:w-auto">
                <Link to="/docs/$slug" params={{ slug: "getting-started" }}>
                  Get started <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-10 w-full bg-card sm:w-auto">
                <Link to="/docs/$slug" params={{ slug: "introduction" }}>
                  How it works
                </Link>
              </Button>
            </Reveal>
            <Reveal delay={280}>
              <InstallCommand create className="mx-auto mt-6" />
            </Reveal>
            <Reveal delay={350}>
              <BadgeRow className="mt-8" />
            </Reveal>
          </div>
        </div>

        <Reveal delay={480} className="mt-16 lg:mt-20">
          <HeroDemo html={html} />
        </Reveal>
      </Container>
    </section>
  );
}

/** The version the site announces. Set it to what was published. */
const release = "v0.1 beta";

/** The latest news, above the headline: the launch, for now. Change it with each release worth announcing. */
function Announcement() {
  return (
    <Link
      to="/docs/$slug"
      params={{ slug: "getting-started" }}
      className="group mb-6 inline-flex items-center gap-2 rounded-full border bg-card py-1 pr-3 pl-1 text-sm text-muted-foreground shadow-xs transition hover:border-foreground/20 hover:text-foreground"
    >
      <span className="rounded-full bg-brand-soft px-2 py-0.5 font-mono text-xs font-medium text-brand">{release}</span>
      The first beta is here
      <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ─── What mismo solves ────────────────────────────────────────────────────── */

function Solves() {
  return (
    <Section>
      <Heading
        eyebrow="Why mismo"
        lead="Write a screen once, with its route and its links. Each app owns its framework."
      >
        Share the app. Keep your stack.
      </Heading>
      <div className="mt-12">
        <Bento />
      </div>
    </Section>
  );
}

/* ─── Get started ───────────────────────────────────────────────────────────── */

const guides = [
  { name: "Expo Router", platform: "iOS & Android", icon: siExpo, slug: "expo-router" },
  { name: "React Navigation", platform: "iOS & Android", icon: navigationArrow, slug: "react-navigation" },
  { name: "Next.js", platform: "Web", icon: siNextdotjs, slug: "nextjs" },
  { name: "TanStack Start", platform: "Web", icon: siTanstack, slug: "tanstack-start" },
  { name: "React Router", platform: "Web", icon: siReactrouter, slug: "react-router" },
];

function GetStarted() {
  return (
    <Section id="get-started" className="bg-muted/40">
      <div className="reveal-on-scroll mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-brand">Get started</p>
        <h2 className="font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">Start with one screen.</h2>
        <p className="mt-5 text-lg text-pretty text-muted-foreground">Start a project with one command, then follow the guide for your stack.</p>
        <InstallCommand create className="mt-8" />
        <p className="mt-3 text-sm text-muted-foreground">
          Already have an app?{" "}
          <Link to="/docs/$slug" params={{ slug: "getting-started" }} hash="set-it-up-yourself" className="underline underline-offset-4 hover:text-foreground">
            Add mismo to it
          </Link>
          .
        </p>
        <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-10 w-full sm:w-auto">
            <Link to="/docs/$slug" params={{ slug: "getting-started" }}>
              Get started <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-10 w-full bg-card sm:w-auto">
            <Link to="/docs/$slug" params={{ slug: "introduction" }}>
              Read the docs
            </Link>
          </Button>
        </div>
      </div>

      <div className="reveal-on-scroll mx-auto mt-14 flex max-w-4xl flex-wrap justify-center gap-3">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            to="/docs/$slug"
            params={{ slug: guide.slug }}
            className="group flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 transition hover:border-foreground/25 sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
          >
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 fill-current" aria-hidden>
              <path d={guide.icon.path} />
            </svg>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{guide.name}</span>
              <span className="block text-xs text-muted-foreground">{guide.platform}</span>
            </span>
            <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </Section>
  );
}

/* ─── Footer ────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t">
      <Container className="flex flex-col items-start justify-between gap-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <p>
          <span className="font-display text-lg text-foreground">mismo</span>, Spanish for “the same”.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a
            href={github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-foreground underline decoration-brand/40 underline-offset-4 transition hover:decoration-brand"
          >
            <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden>
              <path d={siGithub.path} />
            </svg>
            GitHub
          </a>
          <p>
            Built with <span aria-label="love">♥</span> by{" "}
            <a
              href="https://xilef.work"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline decoration-brand/40 underline-offset-4 transition hover:decoration-brand"
            >
              Krakenwagen
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
