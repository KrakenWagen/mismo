import type { SimpleIcon } from "simple-icons";

/** What the logos need from an icon: its outline, in a 24px box. */
export type LogoIcon = Pick<SimpleIcon, "path">;

/**
 * React Navigation, as a navigation arrow. Simple Icons (where the other logos come from) has no
 * React Navigation logo, and this is a plain shape, not a copy of theirs.
 */
export const navigationArrow: LogoIcon = { path: "M3 11 22 2 13 21 11 13Z" };
