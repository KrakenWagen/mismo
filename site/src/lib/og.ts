import { site } from "@/lib/site";

// The social cards, drawn by scripts/assets.ts into src/assets/og. They are imported as assets, so the
// build names each one with a hash of its contents, under /assets, which is cached for good: a changed
// card is a new address, and link previews pick it up.
const cards = import.meta.glob<string>("../assets/og/**/*.png", { eager: true, query: "?url", import: "default" });

/**
 * The address of a social card, in full: `home`, or `docs/<slug>`. A page without a card of its own
 * gets the home one, so a share never points at an image that isn't there.
 */
export function ogImage(name: string): string {
  const url = cards[`../assets/og/${name}.png`] ?? cards["../assets/og/home.png"];
  if (!url) throw new Error("The social cards are missing: run `pnpm assets`.");
  return site + url;
}
