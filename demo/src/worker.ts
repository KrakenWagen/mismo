// The Worker: the handler, with the manifests the build wrote.
import { createHandler } from "./handler.ts";
import manifests from "./manifests.json";

export default { fetch: createHandler(manifests) };
