import { useParams } from "@mismo/core";
import type { NextRouteOptions } from "@mismo/next";
import type { ReactRouterRouteOptions } from "@mismo/react-router";

// Types only: gone from the built code, so the native app never bundles the server file.
import type { reactRouter as server } from "./[id].server";

export default function Org() {
  const { id } = useParams("/orgs/[id]");
  return <h1>Organization {id}</h1>;
}

// Next.js's plain values: copied into the generated server page, so they can sit beside the screen.
export const next = { revalidate: 3600 } satisfies NextRouteOptions;

// React Router's options that run in the browser: the page title, from the server loader's data.
export const reactRouter = {
  meta: ({ loaderData }) => [{ title: loaderData?.title ?? "Organization" }],
  handle: { crumb: "Organization" },
} satisfies ReactRouterRouteOptions<typeof server>;
