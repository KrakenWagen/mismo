// Turns Uniwind's flat styles into React Strict DOM's shape for states.
type Style = Record<string, unknown>;

const STATE_VARIANT = /(?:^|[\s:])(?:active|focus):/;

export function hasStateClasses(className: string | undefined): className is string {
  return className !== undefined && STATE_VARIANT.test(className);
}

/** `{ color: { default: "red", ":active": "blue" } }`, for each property a state changes. */
export function mergeStates(base: Style, states: Record<string, Style>) {
  const variants: Record<string, Style> = {};
  for (const [state, styles] of Object.entries(states)) {
    for (const [key, value] of Object.entries(styles)) {
      if (value === base[key]) continue;
      variants[key] ??= { default: toVariantValue(key, base[key]) };
      variants[key][state] = toVariantValue(key, value);
    }
  }
  return { ...base, ...variants };
}

function toVariantValue(key: string, value: unknown) {
  // React Strict DOM reads a variant's `lineHeight` number as a multiple of the font size.
  if (key === "lineHeight" && typeof value === "number") return `${value}px`;
  // React Native throws if a `transform` that was set goes back to undefined.
  if (key === "transform" && value === undefined) return [];
  return value;
}
