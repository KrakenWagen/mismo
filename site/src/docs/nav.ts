// The docs, in reading order. Each slug is a file in src/content/docs; its title and description
// live here, so the sidebar, the page header, and the <title> agree.

export type DocPage = { slug: string; title: string; description: string };
export type DocSection = { title: string; pages: DocPage[] };

export const sections: DocSection[] = [
  {
    title: "Getting started",
    pages: [
      {
        slug: "introduction",
        title: "Introduction",
        description: "Share whole screens between a React Native app and a web app, each on its own router.",
      },
      {
        slug: "getting-started",
        title: "Getting started",
        description: "Start a project with one command, or set up a shared routes package and your apps by hand.",
      },
    ],
  },
  {
    title: "Guides",
    pages: [
      {
        slug: "routes-folder",
        title: "Defining routes",
        description: "Pages, layouts, groups, params, and files for one platform, written once for every app.",
      },
      {
        slug: "navigation",
        title: "Navigation",
        description: "Link, useNav, Redirect and the rest: one API for screens, on every router, with links typed from your routes.",
      },
      {
        slug: "route-options",
        title: "Route options",
        description: "Each router's per-route settings, such as metadata, loaders and caching, from the shared routes.",
      },
      {
        slug: "rules",
        title: "Rules and limits",
        description: "Why a route one router can't take fails every app's build, what each router can't take, and what mismo doesn't do yet.",
      },
    ],
  },
  {
    title: "Routers",
    pages: [
      {
        slug: "routers",
        title: "Overview",
        description: "Which routers mismo supports, and on which platforms.",
      },
      {
        slug: "expo-router",
        title: "Expo Router",
        description: "Run your shared screens and routes in an Expo Router app.",
      },
      {
        slug: "react-navigation",
        title: "React Navigation",
        description: "Run your shared screens and routes in a React Native app on React Navigation.",
      },
      {
        slug: "nextjs",
        title: "Next.js",
        description: "Run your shared screens and routes in a Next.js app.",
      },
      {
        slug: "tanstack-start",
        title: "TanStack Start",
        description: "Run your shared screens and routes in a TanStack Start app.",
      },
      {
        slug: "react-router",
        title: "React Router",
        description: "Run your shared screens and routes in a React Router app, or define them with its config.",
      },
    ],
  },
  {
    title: "Reference",
    pages: [
      {
        slug: "configuration",
        title: "Configuration",
        description: "defineRoutes, the Vite plugin, Metro's wrapper and the CLI.",
      },
      {
        slug: "troubleshooting",
        title: "Troubleshooting",
        description: "The errors you're most likely to see, what they mean, and the fix.",
      },
      {
        slug: "platform-types",
        title: "Types for platform files",
        description: "Typecheck .web and .native files against their own platform's routes.",
      },
      {
        slug: "adapters",
        title: "Writing an adapter",
        description: "Add a router, or a new way to define routes.",
      },
    ],
  },
];

export const pages = sections.flatMap((section) => section.pages);

export function pageOf(slug: string): DocPage | undefined {
  return pages.find((page) => page.slug === slug);
}

/** The pages before and after, for the links at the foot of each page. */
export function neighborsOf(slug: string): { previous: DocPage | undefined; next: DocPage | undefined } {
  const i = pages.findIndex((page) => page.slug === slug);
  return { previous: pages[i - 1], next: pages[i + 1] };
}
