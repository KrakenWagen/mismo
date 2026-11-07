// The native entry. Uniwind compiles Tailwind's CSS to a stylesheet at build time, and each element
// looks its classes up there. They go through React Strict DOM's `style`, so that `flex`, inherited
// text styles and `:active` and `:focus` behave as they do with `css.create`.
//
// `active:` and `focus:` need Uniwind's internals, as its public hook can't resolve a state. They're
// listed in `uniwind-internals.d.ts`: check them whenever you upgrade Uniwind, which is pinned for this.
import { createElement, type ComponentType } from "react";
import { css, html as strictHtml } from "react-strict-dom";
import { useStyle } from "uniwind/internal/components/native/useStyle";
import { useUniwindContext } from "uniwind/internal/core/context";
import { UniwindStore } from "uniwind/internal/core/native";

import "./safe-areas.native.ts";
import { hasStateClasses, mergeStates } from "./states.ts";
import type { Html } from "./types.ts";

type Props = { className?: string; disabled?: boolean; style?: unknown };

// Tailwind expects this on every element, as `tailwind.css` sets it on the web.
const borderBox = css.create({ all: { boxSizing: "border-box" } }).all;

/** One entry per resolved style, which stays the same object until a class's value changes. */
const withStates = new WeakMap<Record<string, unknown>, Record<string, unknown>>();

function useClasses(className: string | undefined, props: Props) {
  const context = useUniwindContext();
  const isDisabled = props.disabled === true;
  const base = useStyle(className, props, { isDisabled });
  if (!hasStateClasses(className)) return base;

  let styles = withStates.get(base);
  if (styles === undefined) {
    const resolve = (state: { isFocused?: boolean; isPressed?: boolean }) =>
      UniwindStore.getStyles(className, props, { isDisabled, ...state }, context).styles;
    styles = mergeStates(base, { ":focus": resolve({ isFocused: true }), ":active": resolve({ isPressed: true }) });
    withStates.set(base, styles);
  }
  return styles;
}

function withClassName(Element: ComponentType<any>) {
  return function StyledElement({ className, style, ...props }: Props) {
    const classes = useClasses(className, props);
    return createElement(Element, { ...props, style: [borderBox, style, classes] });
  };
}

export const html = Object.fromEntries(
  Object.entries(strictHtml).map(([tag, Element]) => [tag, withClassName(Element as ComponentType<any>)]),
) as Html;
export { css };
export type * from "./types.ts";
