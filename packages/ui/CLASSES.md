# Which Tailwind classes work

**On the web, every Tailwind class works**, as it's real Tailwind. This lists what works on **native**, through Uniwind.

| | |
| --- | --- |
| ✅ | Compiles to a style React Native has |
| ⚠️ | Partly: see the note |
| ❌ | Compiles to nothing, or to a style React Native ignores |

## How this was checked

All 9,793 utilities that Tailwind 4.3.3 defines (every color shade except `red-500` and every size, but not `/` modifiers) were run through Uniwind 1.13.2's own native compiler, the one Metro uses. A class is ✅ when at least one style it compiles to is one React Native 0.88 has, and ❌ when Uniwind drops it or the property doesn't exist there. The variants were checked the same way, on iOS and Android.

This is a check of the compiled styles, **not of rendering on a device**. Some ✅ classes can still have values React Native rejects, and those are listed as ⚠️.

**Uniwind's docs disagree in places.** `space-x-*` and `space-y-*` are listed as supported there, but 1.13.2 doesn't compile any of them. Where the two differ, this table follows what the compiler did.

## Variants

| Variant | Native | Note |
| --- | --- | --- |
| `dark:` `light:` | ✅ | |
| `ios:` `android:` `native:` | ✅ | `ios:` only applies on iOS, and `android:` only on Android |
| `web:` | ❌ | Web only, by design |
| `tv:` `android-tv:` `apple-tv:` | ⚠️ | Need `isTV: true` in the Metro config. Not checked |
| `rtl:` `ltr:` | ✅ | |
| `sm:` `md:` `lg:` `xl:` `2xl:` | ✅ | Against the screen width |
| `portrait:` `landscape:` | ✅ | |
| `motion-safe:` `motion-reduce:` `contrast-more:` `contrast-less:` | ✅ | |
| `pointer-fine:` `pointer-coarse:` `forced-colors:` `inverted-colors:` | ✅ | They compile: not checked on a device |
| `min-[400px]:` `max-[400px]:` `supports-[…]:` | ✅ | |
| `data-[prop=value]:` | ✅ | Reads the component's props |
| `active:` `focus:` `disabled:` | ✅ | `@mismo/ui` handles these: only elements that use them listen |
| `hover:` | ❌ | For pointers, use `css.create` with `":hover"` |
| `focus-visible:` `focus-within:` `visited:` `target:` `open:` | ❌ | |
| `group-*:` `peer-*:` | ❌ | They depend on another element's state |
| `first:` `last:` `odd:` `even:` `only:` `empty:` and the `nth-*` and `*-of-type` forms | ❌ | |
| `checked:` `required:` `invalid:` `valid:` `read-only:` `enabled:` `default:` and the rest of the form states | ❌ | |
| `aria-*:` `has-*:` `in-*:` | ❌ | |
| `before:` `after:` `placeholder:` `marker:` `selection:` `file:` `first-line:` | ❌ | Pseudo-elements |
| `@sm:` `@md:` and other container queries | ❌ | |
| `print:` `starting:` `backdrop:` | ❌ | |

## Values

All of these work: `w-1/2`, `bg-red-500/50`, `text-sm/6`, `!p-4`, `p-4!`, `-mt-2`, `p-[13px]`, `w-[50vw]`, `h-[calc(100%-8px)]`, `bg-[#ff0000]`, `w-(--my-var)`, `dark:bg-black/50`, `pt-safe`, `pt-safe-or-4`, `pb-safe-offset-4`.

## Layout

| Classes | Native | Note |
| --- | --- | --- |
| `container` `aspect-*` | ✅ | |
| `box-border` `box-content` | ✅ | Every element is `border-box` already |
| `flex` `hidden` `contents` | ✅ | `flex` is a row by default, unlike React Native |
| `inline-flex` | ✅ | Becomes `flex`: it's block-level on native |
| `block` `inline` `inline-block` `grid` `flow-root` `table` `list-item` | ❌ | React Native only has `flex`, `none` and `contents` |
| `columns-*` `break-*` `box-decoration-*` | ❌ | |
| `float-*` `clear-*` | ❌ | |
| `isolate` `isolation-*` | ✅ | |
| `object-cover` `-contain` `-fill` `-none` `-scale-down` | ✅ | |
| `object-center` `object-top` and the other positions | ❌ | |
| `overflow-visible` `-hidden` `-scroll` | ✅ | |
| `overflow-auto` `overflow-clip` | ⚠️ | React Native only has the first three |
| `overflow-x-*` `overflow-y-*` `overscroll-*` | ❌ | |
| `static` `relative` `absolute` | ✅ | |
| `fixed` `sticky` | ❌ | |
| `inset-*` `top-*` `right-*` `bottom-*` `left-*` `start-*` `end-*` | ✅ | |
| `visible` `invisible` `collapse` | ❌ | Use `opacity-0` or `hidden` |
| `z-*` | ✅ | |

## Flexbox and grid

| Classes | Native | Note |
| --- | --- | --- |
| `flex-row` `flex-col` `flex-wrap` `flex-nowrap` and `-reverse` | ✅ | |
| `flex-1` `flex-auto` `flex-none` `grow` `shrink` `basis-*` | ✅ | |
| `justify-start` `-end` `-center` `-between` `-around` `-evenly` | ✅ | |
| `justify-stretch` | ⚠️ | React Native has no such value |
| `items-*` `content-*` `self-*` | ✅ | |
| `gap-*` `gap-x-*` `gap-y-*` | ✅ | Needs `display: flex` |
| `order-*` | ❌ | |
| `justify-items-*` `justify-self-*` `place-*` | ❌ | Grid only |
| `grid-cols-*` `grid-rows-*` `col-*` `row-*` `auto-cols-*` `auto-rows-*` `grid-flow-*` | ❌ | React Native has no grid yet |

## Spacing

| Classes | Native | Note |
| --- | --- | --- |
| `p-*` `px-*` `py-*` `pt-*` `pr-*` `pb-*` `pl-*` `ps-*` `pe-*` | ✅ | |
| `m-*` and the same sides, including negative | ✅ | |
| `pt-safe` `pb-safe` `ps-safe` `me-safe` and so on | ✅ | `withUI` follows the device's insets |
| `space-x-*` `space-y-*` | ❌ | Uniwind's docs say supported: 1.13.2 doesn't compile them. Use `gap-*` |
| `pbs-*` `pbe-*` `mbs-*` `mbe-*` | ❌ | Logical block-axis spacing |

## Sizing

| Classes | Native | Note |
| --- | --- | --- |
| `w-*` `h-*` `size-*` `min-w-*` `max-w-*` `min-h-*` `max-h-*` | ✅ | Including fractions and `full` |
| `w-screen` `h-screen` `h-dvh` | ✅ | |
| `w-fit` `w-min` `w-max`, and the same for `h`, `size`, `min-*`, `max-*` | ❌ | |
| `inline-*` `block-*` `min-inline-*` and the other logical sizes | ❌ | |

## Typography

| Classes | Native | Note |
| --- | --- | --- |
| `font-sans` `font-serif` `font-mono` and custom families | ⚠️ | The font has to be loaded |
| `text-xs` … `text-9xl`, `leading-*`, `tracking-*` | ✅ | |
| `font-thin` … `font-black` | ✅ | |
| `italic` `not-italic` | ✅ | |
| `text-left` `-center` `-right` `-justify` | ✅ | |
| `text-start` `text-end` | ⚠️ | `end` needs React Native 0.87+ |
| `text-{color}` | ✅ | |
| `underline` `overline` `line-through` `no-underline` `decoration-{color}` `decoration-{style}` | ✅ | `decoration-wavy` may not draw |
| `uppercase` `lowercase` `capitalize` `normal-case` | ✅ | |
| `tabular-nums` `lining-nums` `oldstyle-nums` `slashed-zero` and the rest of `font-variant-numeric` | ✅ | |
| `align-top` `align-middle` `align-bottom` | ✅ | |
| `align-baseline` and the other `align-*` | ⚠️ | React Native only has `top`, `middle` and `bottom` |
| `truncate` | ⚠️ | It hides overflow but doesn't add an ellipsis: use `numberOfLines` |
| `line-clamp-*` | ❌ | Only hides overflow, and never clamps: use `numberOfLines` |
| `text-ellipsis` `text-clip` `text-wrap` `text-balance` `text-pretty` | ❌ | |
| `whitespace-*` `break-*` `wrap-*` `hyphens-*` `indent-*` | ❌ | |
| `decoration-{width}` `underline-offset-*` | ❌ | |
| `text-shadow-*` | ❌ | The color classes compile, but no size does |
| `font-stretch-*` `antialiased` `subpixel-antialiased` `list-*` `tab-*` | ❌ | |
| `[font-variation-settings:…]` | ⚠️ | Needs React Native 0.88+ and a variable font |

## Backgrounds

| Classes | Native | Note |
| --- | --- | --- |
| `bg-{color}` | ✅ | |
| `bg-linear-*` `from-*` `via-*` `to-*` | ✅ | |
| `bg-cover` `bg-contain` `bg-center` `bg-top` `bg-no-repeat` `bg-repeat` and the other sizes, positions and repeats | ✅ | |
| `bg-[url(…)]` | ⚠️ | Not checked |
| `bg-fixed` `bg-clip-*` `bg-origin-*` `bg-blend-*` | ❌ | |

## Borders

| Classes | Native | Note |
| --- | --- | --- |
| `rounded-*` and per-corner | ✅ | |
| `border` `border-{width}` and per-side, `border-{color}` | ✅ | |
| `border-solid` `border-dashed` `border-dotted` | ✅ | |
| `border-double` `border-none` | ⚠️ | Not in React Native's border styles |
| `border-bs-*` `border-be-*` | ❌ | Logical block-axis borders |
| `ring-*` `ring-{color}` | ✅ | |
| `outline-*` `outline-{color}` `outline-offset-*` | ✅ | |
| `divide-*` | ❌ | Like `space-*`, it isn't compiled |

## Effects

| Classes | Native | Note |
| --- | --- | --- |
| `shadow-*` `shadow-{color}` `inset-shadow-*` | ✅ | |
| `opacity-*` | ✅ | |
| `mix-blend-*` | ✅ | |
| `mask-*` | ❌ | |

## Filters

| Classes | Native | Note |
| --- | --- | --- |
| `grayscale` `saturate-*` `hue-rotate-*` `brightness-*` `contrast-*` `invert` `sepia` | ✅ | |
| `blur-*` `drop-shadow-*` | ⚠️ | Android 12+. iOS needs a React Native feature flag |
| `backdrop-*` | ❌ | |

## Tables

| Classes | Native | Note |
| --- | --- | --- |
| `table-*` `border-collapse` `border-spacing-*` `caption-*` | ❌ | |

## Transitions and animation

| Classes | Native | Note |
| --- | --- | --- |
| `transition-*` `duration-*` `ease-*` `delay-*` | ❌ | React Native 0.88 has no transition styles |
| `animate-*` | ❌ | |

## Transforms

| Classes | Native | Note |
| --- | --- | --- |
| `translate-*` `rotate-*` `scale-*` `skew-*` | ✅ | `-z` variants are ❌ |
| `origin-*` | ✅ | |
| `perspective-*` `backface-*` | ✅ | |
| `perspective-origin-*` `transform-3d` `transform-flat` | ❌ | |

## Interactivity

| Classes | Native | Note |
| --- | --- | --- |
| `cursor-*` `pointer-events-*` `select-*` | ✅ | |
| `accent-*` | ⚠️ | As a prefix it targets color props that aren't `style`, like `tintColorClassName`. As a class it does nothing |
| `appearance-*` `caret-*` `resize-*` `touch-*` `will-change-*` `zoom-*` `scrollbar-*` `field-sizing-*` `contain-*` | ❌ | |
| `scroll-*` `snap-*` | ❌ | |

## SVG and accessibility

| Classes | Native | Note |
| --- | --- | --- |
| `fill-*` `stroke-*` | ❌ | Pass `fill` and `stroke` as props to the SVG element |
| `sr-only` `not-sr-only` | ⚠️ | |
| `forced-color-adjust-*` | ❌ | |
