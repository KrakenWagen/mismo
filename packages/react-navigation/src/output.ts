import path from "node:path";

import {
  exportedOptions,
  type Files,
  GENERATED,
  importPath,
  oneUrlPerPage,
  type RouteOutput,
  type RouteRules,
  type SharedRoute,
} from "@mismo/core/adapter";

/**
 * What React Navigation cannot express. It matches a URL to a screen by its linking path alone, so
 * two pages at one URL, such as `(a)/about` and `(b)/about`, would be ambiguous.
 */
export const rules: RouteRules = {
  router: "React Navigation",
  target: "native",
  check: (routes) => oneUrlPerPage(routes, "React Navigation"),
};

type Kind = "stack" | "tabs" | "drawer";

/** The navigator each layout becomes, and where the app gets it. A layout is a native stack unless it says otherwise. */
const NAVIGATORS: Record<Kind, { create: string; from: string }> = {
  stack: { create: "createNativeStackNavigator", from: "@react-navigation/native-stack" },
  tabs: { create: "createBottomTabNavigator", from: "@react-navigation/bottom-tabs" },
  drawer: { create: "createDrawerNavigator", from: "@react-navigation/drawer" },
};

/** What a screen takes (any page, and a layout in its parent), and what only a layout's navigator takes. */
const SCREEN_OPTIONS = ["options", "listeners", "initialParams", "getId"];
const NAVIGATOR_OPTIONS = ["screenOptions", "initialRouteName"];

/** The URL pattern of a route below its parent, in the `:param` syntax React Navigation's linking reads. */
const linkingPath = (route: SharedRoute) => (route.index ? "" : (route.path ?? ""));

/**
 * React Navigation's files, for a React Native app: one `routes.tsx` in `outDir` (`src/navigation`)
 * with the shared routes as navigators. The app mounts what it exports:
 *
 *     import { Navigation } from "./navigation/routes";
 *     export default () => <Navigation linking={{ prefixes: ["acme://"] }} />;
 *
 * Each layout becomes a navigator whose `layout` renders the shared layout around the routes
 * below it (`Slot`), a native stack unless the layout's `reactNavigation` export says `tabs` or
 * `drawer`. Each page becomes a screen with its URL as `linking.path`, so React Navigation's
 * deep links and `Link` both read the routes' URLs. Headers are off unless a route turns them on:
 * a shared screen brings its own.
 */
export function output({ outDir, types }: { outDir: string; types: string }): RouteOutput {
  return {
    name: "react-navigation",
    target: "native",
    outDir,
    types,
    rules,
    runtime: "@mismo/react-navigation/runtime",
    emit(routes, context) {
      const at = path.join(context.outDir, "routes.tsx");
      const used = new Set<Kind>(["stack"]);
      const modules: string[] = [];
      const navigators: string[] = [];
      let hasLayout = false;
      let count = 0;

      /** The `screens` of a navigator, one entry per route; each layout's own navigator is declared before it. */
      const screens = (list: readonly SharedRoute[], indent: string): string =>
        list
          .map((route) => {
            const n = count++;
            const options = exportedOptions(route.file, "reactNavigation");
            const module = `Route${n}`;
            const opts = `Options${n}`;
            modules.push(`import ${module}${options ? `, { reactNavigation as ${opts} }` : ""} from ${JSON.stringify(importPath(at, route.file))};`);

            for (const key of options?.keys() ?? []) {
              const known = route.layout ? [...SCREEN_OPTIONS, ...NAVIGATOR_OPTIONS, "navigator"] : SCREEN_OPTIONS;
              if (!known.includes(key)) {
                throw new Error(
                  `${route.id}: \`reactNavigation.${key}\` isn't a React Navigation option for a ${route.layout ? "layout" : "page"}. It takes ${known.join(", ")}.`,
                );
              }
            }

            const onScreen = SCREEN_OPTIONS.filter((key) => options?.has(key)).map((key) => `${key}: ${opts}.${key}`);
            // A group's layout has no URL of its own, so no path: with an empty one, React Navigation
            // would treat it as the page at `/`, and refuse a second such layout or an index page.
            const linking = route.layout && route.path === undefined ? [] : [`linking: { path: ${JSON.stringify(linkingPath(route))} }`];
            const entry = (screen: string) => `${indent}${JSON.stringify(route.id)}: { ${[`screen: ${screen}`, ...linking, ...onScreen].join(", ")} }`;

            if (!route.layout) return entry(module);

            hasLayout = true;
            const kind = kindOf(route, options);
            used.add(kind);
            const navigator = `Navigator${n}`;
            const own = NAVIGATOR_OPTIONS.filter((key) => options?.has(key) && key !== "screenOptions");
            navigators.push(`const ${navigator} = ${NAVIGATORS[kind].create}({
  layout: ({ children }) => (
    <SlotChildren value={children}>
      <${module} />
    </SlotChildren>
  ),
  screenOptions: { headerShown: false${options?.has("screenOptions") ? `, ...${opts}.screenOptions` : ""} },${own.map((key) => `\n  ${key}: ${opts}.${key},`).join("")}
  screens: {
${screens(route.children ?? [], "    ")},
  },
});`);
            return entry(navigator);
          })
          .join(",\n");

      const root = screens(routes, "    ");

      const imports = [
        'import { createStaticNavigation } from "@react-navigation/native";',
        ...[...used].map((kind) => `import { ${NAVIGATORS[kind].create} } from "${NAVIGATORS[kind].from}";`),
        ...(hasLayout ? ['import { SlotChildren } from "@mismo/react-navigation/runtime";'] : []),
        'import type { ComponentProps } from "react";',
      ];

      const files: Files = new Map();
      files.set(
        "routes.tsx",
        `${GENERATED}${imports.join("\n")}

${modules.join("\n")}

${navigators.length ? `${navigators.join("\n\n")}\n\n` : ""}/** The shared routes as the app's root navigator. */
export const Root = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
${root},
  },
});

const Static = createStaticNavigation(Root);

/**
 * The app's navigation, with deep links on: the shared routes' URLs open the app at \`linking.prefixes\`.
 * Mount it once, where the app mounts its navigation container.
 */
export function Navigation(props: ComponentProps<typeof Static>) {
  return <Static {...props} linking={{ prefixes: [], enabled: true, ...props.linking }} />;
}
`,
      );

      return files;
    },
  };
}

/** The navigator a layout becomes, from its `reactNavigation.navigator`: a literal, since mismo reads it without running the file. */
function kindOf(route: SharedRoute, options: Map<string, string> | undefined): Kind {
  const text = options?.get("navigator");
  if (text === undefined) return "stack";

  const match = /^["'](stack|tabs|drawer)["']$/.exec(text.replace(/\s+as\s+const$/, "").trim());
  if (!match) {
    throw new Error(`${route.id}: \`reactNavigation.navigator\` must be "stack", "tabs" or "drawer", written as a literal. mismo reads it without running the file.`);
  }
  return match[1] as Kind;
}
