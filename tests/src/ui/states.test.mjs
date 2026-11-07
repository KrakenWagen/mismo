import assert from "node:assert/strict";
import { test } from "vitest";

import { hasStateClasses, mergeStates } from "../../../packages/ui/src/states.ts";

test("finds classes that depend on a state", () => {
  for (const name of ["active:p-1", "p-1 focus:p-2", "dark:active:p-1"]) assert.equal(hasStateClasses(name), true, name);
  for (const name of [undefined, "", "p-1", "inactive:p-1", "disabled:p-1"]) assert.equal(hasStateClasses(name), false, String(name));
});

test("only what a state changes becomes a variant", () => {
  const base = { padding: 8, color: "red" };
  const merged = mergeStates(base, { ":active": { padding: 8, color: "blue" }, ":focus": { padding: 8, color: "red" } });
  assert.deepEqual(merged, { padding: 8, color: { default: "red", ":active": "blue" } });
});

test("a property can differ by state", () => {
  const merged = mergeStates({ color: "red" }, { ":focus": { color: "green" }, ":active": { color: "blue" } });
  assert.deepEqual(merged.color, { default: "red", ":focus": "green", ":active": "blue" });
});

test("a property only a state sets has no default", () => {
  assert.deepEqual(mergeStates({}, { ":active": { opacity: 0.5 } }), { opacity: { default: undefined, ":active": 0.5 } });
});

test("a transform goes back to an empty list, as undefined crashes React Native", () => {
  const transform = [{ scale: 0.5 }];
  assert.deepEqual(mergeStates({}, { ":active": { transform } }).transform, { default: [], ":active": transform });
});

test("a lineHeight stays in pixels, not a multiple of the font size", () => {
  assert.deepEqual(mergeStates({ lineHeight: 20 }, { ":active": { lineHeight: 32 } }).lineHeight, { default: "20px", ":active": "32px" });
});
