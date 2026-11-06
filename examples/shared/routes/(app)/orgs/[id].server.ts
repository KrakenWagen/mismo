// This route's server-only options. Only the web apps' generated files import this file; the
// native app never bundles it.
import type { NextServerOptions } from "@mismo/next";
import type { ReactRouterServerOptions } from "@mismo/react-router";
import type { TanstackServerOptions } from "@mismo/tanstack";
import { createServerFn } from "@tanstack/react-start";

// Next.js's options that need code: they run on the server.
export const next = {
  async generateStaticParams() {
    return [{ id: "acme" }];
  },
  async generateMetadata({ params }) {
    const { id } = await params;
    return { title: `Organization ${String(id)} · Next.js` };
  },
} satisfies NextServerOptions;

export const reactRouter = {
  async loader({ params }) {
    return { title: `Organization ${params.id} · React Router` };
  },
} satisfies ReactRouterServerOptions;

// TanStack runs a loader in the browser too, on client-side navigation: the work that must stay on
// the server is a server function, which TanStack's compiler swaps for a call to the server in the
// browser's bundle.
const getOrg = createServerFn().handler(async () => {
  const secret = "MISMO_SERVER_ONLY_MARKER"; // stands for a database password: never in the browser
  return { title: "Organization · TanStack Start", authorized: secret.length > 0 };
});

export const tanstack = {
  loader: () => getOrg(),
} satisfies TanstackServerOptions;
