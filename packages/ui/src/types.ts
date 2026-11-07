import type { html } from "react-strict-dom";

type WithClassName<Element> = Element extends (props: infer Props) => infer Result
  ? (props: Props & { className?: string }) => Result
  : never;

/** React Strict DOM's elements, each also taking a Tailwind `className`. */
export type Html = { [Tag in keyof typeof html]: WithClassName<(typeof html)[Tag]> };

export type { StaticStyles, Styles, StylesWithout, StyleTheme, StyleVars } from "react-strict-dom";
