import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { site } from "@/lib/site";

import appCss from "../styles.css?url";

const title = "mismo · share screens between React Native and the web";

const description =
  "Write each screen once and ship it in your React Native and web apps: the screen, its route, and every link to it, with each app on its own router.";

// Runs before the first paint, so a dark page never flashes light.
const themeScript = `(() => {
  try {
    const stored = localStorage.getItem("theme");
    const dark = stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch {}
})()`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title },
      { name: "description", content: description },
      // One per name: the head keeps a single tag for each, so the light theme's, the default.
      { name: "theme-color", content: "#faf9f6" },
      // Social cards. Pages with their own (the docs) replace the title, description, URL and image.
      { property: "og:site_name", content: "mismo" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: `${site}/` },
      { property: "og:image", content: `${site}/og.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "mismo: Write your screens once. Run them on any stack." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: `${site}/og.png` },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // The wordmark's first letter (scripts/assets.ts makes them).
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
    scripts: [{ children: themeScript }],
  }),
  shellComponent: RootDocument,
  component: () => (
    <TooltipProvider>
      <Outlet />
    </TooltipProvider>
  ),
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
