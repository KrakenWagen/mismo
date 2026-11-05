// The site's images: the social cards (Open Graph) for the home page and each docs page, and the
// favicons. Drawn as HTML in the site's own fonts and colors, and photographed with the installed
// Chrome, so they match the site. The output is committed to public/, so building and deploying
// need no browser; run this again after changing a docs page's title or description:
//
//   pnpm assets
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

import { chromium } from "playwright-core";
import { siExpo, siNextdotjs, siReactrouter, siTanstack } from "simple-icons";

import { sections } from "../src/docs/nav.ts";

const publicDir = path.join(import.meta.dirname, "..", "public");

const fonts =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400..700&family=Geist+Mono:wght@400..600&family=Instrument+Serif:ital@0;1&display=block";

// The site's light theme (src/styles.css).
const color = {
  background: "oklch(0.985 0.004 85)",
  foreground: "oklch(0.2 0.01 60)",
  muted: "oklch(0.5 0.012 60)",
  border: "oklch(0.9 0.008 75)",
  brand: "oklch(0.64 0.19 42)",
  card: "oklch(0.995 0.003 85)",
};

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const logo = (icon: { path: string }) =>
  `<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="${icon.path}"/></svg>`;

const frameworks = [
  ["Expo Router", siExpo],
  ["Next.js", siNextdotjs],
  ["TanStack Start", siTanstack],
  ["React Router", siReactrouter],
] as const;

/** A 1200×630 card: the frame every social card shares, around its own content. */
function card(content: string, footer: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><link rel="stylesheet" href="${fonts}">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: ${color.background}; color: ${color.foreground};
    font-family: Geist, sans-serif;
    background-image: radial-gradient(${color.border} 1.4px, transparent 1.4px);
    background-size: 28px 28px;
  }
  .frame {
    position: absolute; inset: 0; padding: 64px 72px;
    display: flex; flex-direction: column;
    background: radial-gradient(ellipse at 30% 40%, ${color.background} 35%, transparent 80%);
  }
  .wordmark { font-family: "Instrument Serif", serif; font-size: 44px; letter-spacing: -0.02em; line-height: 1; }
  .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .footer { display: flex; align-items: center; justify-content: space-between; font-size: 24px; color: ${color.muted}; }
  .eyebrow { font-family: "Geist Mono", monospace; font-size: 22px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: ${color.brand}; margin-bottom: 22px; }
  .display { font-family: "Instrument Serif", serif; letter-spacing: -0.025em; line-height: 0.98; }
  em { color: ${color.brand}; }
  .logos { display: flex; gap: 14px; }
  .pill { display: inline-flex; align-items: center; gap: 10px; padding: 10px 18px; border: 1.5px solid ${color.border}; border-radius: 999px; background: ${color.card}; color: ${color.foreground}; font-size: 22px; font-weight: 500; }
</style></head>
<body><div class="frame">
  <div class="wordmark">mismo</div>
  <div class="content">${content}</div>
  <div class="footer">${footer}</div>
</div></body></html>`;
}

const home = card(
  `<div class="display" style="font-size: 104px; max-width: 980px;">Write your screens once.<br>Run them on <em>any</em> stack.</div>
   <div style="margin-top: 30px; font-size: 30px; color: ${color.muted}; max-width: 900px; line-height: 1.35;">Screens, routes and navigation, shared between React Native and the web.</div>`,
  `<div class="logos">${frameworks.map(([name, icon]) => `<span class="pill">${logo(icon)}${name}</span>`).join("")}</div>
   <span style="font-family: 'Geist Mono', monospace;">mismo.dev</span>`,
);

function docsCard(section: string, title: string, description: string, slug: string) {
  return card(
    `<div class="eyebrow">${escape(section)}</div>
     <div class="display" style="font-size: 96px; max-width: 1000px;">${escape(title)}</div>
     <div style="margin-top: 28px; font-size: 30px; color: ${color.muted}; max-width: 960px; line-height: 1.35;">${escape(description)}</div>`,
    `<span>Docs</span><span style="font-family: 'Geist Mono', monospace;">mismo.dev/docs/${escape(slug)}</span>`,
  );
}

/** The favicon: the wordmark's first letter, on a dark rounded square. */
const icon = (size: number, radius: number) => `<!doctype html>
<html><head><meta charset="utf-8"><link rel="stylesheet" href="${fonts}">
<style>
  * { margin: 0; }
  html, body { width: ${size}px; height: ${size}px; background: transparent; }
  .tile {
    width: ${size}px; height: ${size}px; border-radius: ${radius}px;
    background: ${color.foreground};
    display: flex; align-items: center; justify-content: center;
    font-family: "Instrument Serif", serif; font-style: italic; color: ${color.brand};
    font-size: ${Math.round(size * 0.86)}px; line-height: 1; letter-spacing: -0.04em;
    padding-bottom: ${Math.round(size * 0.12)}px; box-sizing: border-box;
  }
</style></head>
<body><div class="tile">m</div></body></html>`;

const browser = await chromium.launch({ channel: "chrome" });

async function shoot(html: string, file: string, width: number, height: number, transparent = false) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(publicDir, file);
  mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: transparent });
  await page.close();
  console.log(`  ${file}`);
}

rmSync(path.join(publicDir, "og"), { recursive: true, force: true });
console.log("Social cards:");
await shoot(home, "og.png", 1200, 630);
for (const section of sections) {
  for (const page of section.pages) {
    await shoot(docsCard(section.title, page.title, page.description, page.slug), `og/docs/${page.slug}.png`, 1200, 630);
  }
}

console.log("Icons:");
await shoot(icon(32, 7), "favicon-32.png", 32, 32, true);
await shoot(icon(180, 0), "apple-touch-icon.png", 180, 180); // iOS rounds the corners itself.
await shoot(icon(512, 112), "icon-512.png", 512, 512, true);

await browser.close();
