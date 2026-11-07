// "Try it on your phone", added to the web app by the build, so it stays out of the starter.
// A QR code on a computer, and a button on a phone, where you can't scan your own screen.
// Closing it leaves a small button in the corner, which opens it again.
import qrcode from "qrcode-generator";

import launcherHtml from "./launcher.html";
import panelHtml from "./panel.html";
import css from "./panel.css";

/** Where Expo Go opens this app: `exps://` for https, and `exp://` for the dev server. */
const link = `${location.protocol === "https:" ? "exps" : "exp"}://${location.host}`;

const DISMISSED = "mismo-demo-panel-dismissed";

/** Whether it was closed, kept in the browser. Storage can be blocked: then it opens on every visit. */
const closed = {
  get(): boolean {
    try {
      return localStorage.getItem(DISMISSED) === "1";
    } catch {
      return false;
    }
  },
  set(value: boolean) {
    try {
      if (value) localStorage.setItem(DISMISSED, "1");
      else localStorage.removeItem(DISMISSED);
    } catch {}
  },
};

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function start() {
  const qr = qrcode(0, "M");
  qr.addData(link);
  qr.make();
  const qrSvg = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });

  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);

  function openPanel() {
    const panel = document.createElement("div");
    panel.id = "mismo-demo-panel";
    panel.setAttribute("role", "complementary");
    panel.setAttribute("aria-label", "Try the native app");
    panel.innerHTML = panelHtml.replace("{{qr}}", () => qrSvg).replace("{{link}}", () => escapeHtml(link));

    panel.querySelector("button")!.addEventListener("click", () => {
      panel.remove();
      closed.set(true);
      showLauncher();
    });
    document.body.append(panel);
  }

  function showLauncher() {
    const launcher = document.createElement("button");
    launcher.id = "mismo-demo-launcher";
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Try it on your phone");
    launcher.innerHTML = launcherHtml;

    launcher.addEventListener("click", () => {
      launcher.remove();
      closed.set(false);
      openPanel();
    });
    document.body.append(launcher);
  }

  if (closed.get()) showLauncher();
  else openPanel();
}

// After the app has hydrated, as React owns the whole document.
if (document.readyState === "complete") setTimeout(start, 300);
else addEventListener("load", () => setTimeout(start, 300));
