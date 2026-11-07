// Keeps packages/ui/CLASSES.md honest: the classes it names are compiled by Uniwind, as an iOS app would,
// and must still do what it says. When an upgrade changes one, update the table and this list together.
import assert from "node:assert/strict";
import { test } from "vitest";

import { compileForNative } from "./native-classes.mjs";

const works = [
  // Layout, flexbox, spacing, sizing
  "flex", "inline-flex", "hidden", "contents", "absolute", "relative", "z-10", "aspect-video", "object-cover", "overflow-hidden",
  "flex-1", "flex-col", "flex-wrap", "grow", "justify-between", "items-center", "gap-4", "gap-x-2", "p-4", "mx-auto", "-mt-2",
  "pt-safe", "pb-safe-or-4", "w-1/2", "w-full", "w-screen", "h-dvh", "size-8", "min-h-screen", "max-w-md",
  // Typography
  "text-xl", "font-bold", "italic", "leading-tight", "tracking-wide", "text-center", "text-start", "uppercase", "underline",
  "tabular-nums", "align-middle", "text-red-500",
  // Backgrounds, borders, effects, filters, transforms, interactivity
  "bg-red-500", "bg-red-500/50", "bg-linear-to-r", "bg-cover", "bg-center", "bg-no-repeat", "rounded-lg", "border", "border-t-2",
  "border-dashed", "ring-2", "outline-2", "outline-offset-2", "shadow-md", "inset-shadow-sm", "opacity-50", "mix-blend-multiply",
  "grayscale", "blur-md", "drop-shadow-md", "translate-x-2", "rotate-45", "scale-x-50", "skew-x-3", "origin-center", "perspective-near",
  "cursor-pointer", "pointer-events-none", "select-none", "p-[13px]", "w-[50vw]", "!p-4",
  // Variants
  "dark:p-4", "ios:p-4", "native:p-4", "sm:p-4", "portrait:p-4", "rtl:p-4", "active:p-4", "focus:p-4", "disabled:p-4", "data-[state=open]:p-4",
];

const doesNothing = [
  "block", "inline", "grid", "table", "fixed", "sticky", "visible", "invisible", "order-1", "float-left", "columns-2",
  "grid-cols-2", "col-span-2", "space-x-2", "space-y-2", "divide-x", "w-fit", "h-min", "size-max", "object-center",
  "text-ellipsis", "text-balance", "whitespace-nowrap", "underline-offset-2", "indent-4", "antialiased",
  "text-shadow-md", "bg-fixed", "bg-clip-text", "mask-t-from-0", "backdrop-blur-sm", "transition", "duration-150", "animate-spin",
  "fill-red-500", "stroke-2", "scroll-m-2", "snap-x", "touch-none", "resize", "will-change-transform", "transform-3d",
  // Variants
  "web:p-4", "android:p-4", "hover:p-4", "focus-visible:p-4", "first:p-4", "odd:p-4", "checked:p-4", "aria-checked:p-4",
  "has-[:checked]:p-4", "group-hover:p-4", "peer-checked:p-4", "before:p-4", "placeholder:p-4", "print:p-4",
];

// Parts of these work and the rest is ignored, so they're kept apart: what's ignored is what matters.
const partly = { truncate: "textOverflow", "line-clamp-2": "WebkitLineClamp" };

const compiled = await compileForNative([...works, ...doesNothing, ...Object.keys(partly)]);

test("the classes CLASSES.md says work compile to styles", () => {
  assert.deepEqual(works.filter((name) => !compiled[name].works), []);
});

test("the classes CLASSES.md says do nothing still don't", () => {
  assert.deepEqual(doesNothing.filter((name) => compiled[name].works), []);
});

test("the classes CLASSES.md says only partly work still lose the same part", () => {
  for (const [name, ignored] of Object.entries(partly)) {
    const style = compiled[name].styles.find(([property]) => property === ignored);
    assert.ok(style && !style[2], `${name} should still compile ${ignored} to nothing`);
  }
});
