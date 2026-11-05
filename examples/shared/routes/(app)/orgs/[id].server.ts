// This route's server-only options. Only the web apps' generated files import this file; the
// native app never bundles it.
import type { NextServerOptions } from "@mismo/next";
import type { ReactRouterServerOptions } from "@mismo/react-router";

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
