import type { Config } from "@react-router/dev/config";

// A single-page app: React Router's own build checks the generated routes, with no server to run.
// /orgs/acme is prerendered, so its shared route's server loader runs, at build time.
export default { ssr: false, prerender: ["/", "/orgs/acme"] } satisfies Config;
