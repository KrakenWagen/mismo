import { siExpo, siNextdotjs, siReact, siReactrouter, siTanstack } from "simple-icons";

import { type LogoIcon, navigationArrow } from "@/lib/icons";
import { cn } from "@/lib/utils";

// The frameworks mismo runs on, as badges around the hero's headline. Logos from Simple Icons
// (CC0), drawn in the text color so they sit quietly on the page.

const frameworks: { name: string; icon: LogoIcon; position: string; delay: string }[] = [
  { name: "Expo Router", icon: siExpo, position: "left-[2%] top-[6%]", delay: "0s" },
  { name: "React Native", icon: siReact, position: "left-[-2%] top-[52%]", delay: "-2s" },
  { name: "React Navigation", icon: navigationArrow, position: "left-[5%] top-[80%]", delay: "-5s" },
  { name: "Next.js", icon: siNextdotjs, position: "right-[1%] top-[2%]", delay: "-4s" },
  { name: "TanStack Start", icon: siTanstack, position: "right-[-3%] top-[42%]", delay: "-1s" },
  { name: "React Router", icon: siReactrouter, position: "right-[6%] top-[80%]", delay: "-3s" },
];

function Logo({ icon, className }: { icon: LogoIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4 shrink-0 fill-current", className)} aria-hidden>
      <path d={icon.path} />
    </svg>
  );
}

function Badge({ name, icon, className, style }: { name: string; icon: LogoIcon; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-card/85 px-3 py-1.5 text-sm font-medium shadow-[0_8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur",
        className,
      )}
      style={style}
    >
      <Logo icon={icon} />
      {name}
    </span>
  );
}

/** Around the headline, drifting, on wide screens. Its parent is `relative`. */
export function FloatingBadges() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden xl:block" aria-hidden>
      {frameworks.map((framework) => (
        <Badge
          key={framework.name}
          name={framework.name}
          icon={framework.icon}
          className={cn("absolute animate-float", framework.position)}
          style={{ animationDelay: framework.delay }}
        />
      ))}
    </div>
  );
}

/** The same frameworks as a row, where there's no room around the headline. */
export function BadgeRow({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap justify-center gap-2 xl:hidden", className)} aria-label="Works with">
      {frameworks.map((framework) => (
        <li key={framework.name}>
          <Badge name={framework.name} icon={framework.icon} className="px-2.5 py-1 text-xs" />
        </li>
      ))}
    </ul>
  );
}
