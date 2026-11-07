import { packageConfig } from "../../configs/tsdown.ts";

// Every source file is an entry: `integrations/metro.cjs` loads `safe-areas.native.js` by path.
export default packageConfig(["src/index.ts", "src/index.native.ts", "src/safe-areas.native.ts"]);
