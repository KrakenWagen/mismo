import { pathOf } from "@mismo/core/contract";
import { describe, expect, it } from "vitest";

// With no routes registered here, `To` is `never`: these are the shapes a project's types allow.
const path = (to: unknown) => pathOf(to as never);

describe("pathOf", () => {
  it("fills in params however the routes were defined", () => {
    expect(path({ href: "/orgs/[id]", params: { id: "acme" } })).toBe("/orgs/acme");
    expect(path({ href: "/orgs/:id", params: { id: "acme" } })).toBe("/orgs/acme");
    expect(path({ href: "/orgs/:org/people/:id", params: { org: "acme", id: "ana" } })).toBe("/orgs/acme/people/ana");
  });

  it("leaves a route without params, encodes values, and refuses a missing param", () => {
    expect(path("/settings")).toBe("/settings");
    expect(path({ href: "/orgs/:id", params: { id: "a b" } })).toBe("/orgs/a%20b");
    expect(() => path({ href: "/orgs/:id" })).toThrow(/needs the param id/);
  });
});
