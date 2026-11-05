import { type RouteConfig, route } from "@react-router/dev/routes";

import { routes } from "./mismo/routes";

// The shared routes, written by mismo, next to this app's own.
export default [...routes, route("status", "status.tsx")] satisfies RouteConfig;
