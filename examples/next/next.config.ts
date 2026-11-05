import { withMismo } from "@mismo/next/config";
import type { NextConfig } from "next";

const config: NextConfig = {
  // The shared screens are TypeScript source in another package, and `@mismo/core` with them.
  transpilePackages: ["@mismo/example-shared", "@mismo/core", "@mismo/next"],
};

export default withMismo(config, { config: "../shared/routes.config.ts", outDir: "app", types: "app/routes.gen.ts" });
