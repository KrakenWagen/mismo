// The parts of Uniwind that aren't public, which `integrations/metro.cjs` makes importable. If an upgrade
// changes one of these, `src/index.native.ts` is the only file to update.
type ComponentState = { isDisabled?: boolean; isFocused?: boolean; isPressed?: boolean };

declare module "uniwind/internal/components/native/useStyle" {
  export function useStyle(
    className: string | undefined,
    componentProps: Record<string, any>,
    state?: ComponentState,
  ): Record<string, unknown>;
}

declare module "uniwind/internal/core/context" {
  export function useUniwindContext(): unknown;
}

declare module "uniwind/internal/core/native" {
  export const UniwindStore: {
    getStyles(
      className: string | undefined,
      componentProps: Record<string, any> | undefined,
      state: ComponentState | undefined,
      context: unknown,
    ): { styles: Record<string, unknown> };
  };
}
