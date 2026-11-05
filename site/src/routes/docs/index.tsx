import { createFileRoute, redirect } from "@tanstack/react-router";

// /docs is the first page.
export const Route = createFileRoute("/docs/")({
  beforeLoad: () => {
    throw redirect({ to: "/docs/$slug", params: { slug: "introduction" } });
  },
});
