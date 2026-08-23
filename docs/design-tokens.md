---
type: Convention
title: Design tokens
description: Elevation, motion, layering, type and layout are named tokens in src/style.css, documented in Foundations stories and enforced in the architecture tier.
tags: [design-system, tokens, tailwind, css, elevation, motion]
status: stable
sources:
  - resource: https://tailwindcss.com/docs/theme
    id: tailwind-theme-namespaces
    title: Tailwind v4 theme namespaces
---

# Design tokens

Depth, timing, stacking order, type size and the shell's geometry are tokens.
None of them is a number typed at a call site, and the architecture tier is
what keeps it that way.

The rule is the same one the colour tokens already followed: **the CSS is
authoritative, the catalog renders it.** A Foundations story reads the live
custom property; it never contains a copied value.

## The families

| Family    | Declared as                              | Consumed as                     | Documented in                   |
| --------- | ---------------------------------------- | ------------------------------- | ------------------------------- |
| Elevation | `--elevation-*`, aliased to `--shadow-*` | `shadow-raised`                 | `Foundations/Elevation`         |
| Easing    | `--ease-*` (a real namespace)            | `ease-out-expo`                 | `Foundations/Motion`            |
| Duration  | plain custom properties                  | `duration-(--duration-fast)`    | `Foundations/Motion`            |
| Layering  | plain custom properties                  | `z-(--z-sheet)`                 | `Foundations/Layering`          |
| Type      | `--text-*` plus its modifiers            | `text-body`                     | `Foundations/Typography`        |
| Layout    | `--spacing-*`                            | `min-h-nav-height`, `px-gutter` | `Foundations/Shape and spacing` |

Duration and z-index are **not** Tailwind theme namespaces. The compiled
Tailwind source does resolve `duration-*` against an undocumented
`--transition-duration-*`; this repository does not build on it. Both are
consumed through the documented `utility-(<custom-property>)` syntax instead.

## Elevation has five levels, and dark mode is not light mode

`raised`, `sticky`, `floating`, `sheet`, `overlay`. The five names are
exhaustive: a sixth level is a design change and belongs here as a written
reason, not as a `shadow-lg` at a call site.

Two of the values are shaped by geometry rather than by taste:

- **`--elevation-sheet` points upward.** A bottom sheet occludes the content
  above it. A downward shadow on a bottom-anchored surface is the single most
  common tell that a web app is imitating a native one.
- **`--elevation-sticky` has no vertical offset at all.** One token serves a
  header at the top edge and a tab bar at the bottom edge, and content scrolls
  *under* both — from below in one case, from above in the other. A directional
  shadow is right for exactly one of them, so this one is a halo.

Dark mode does not elevate with shadow. A black shadow on a near-black surface
is invisible, and reusing the light values is why most dark interfaces look
flat. Dark elevation is a hairline light ring on the surface's own edge, with a
soft ambient shadow beneath it once the surface is genuinely above the page.
The names are identical; only the values differ, under the two-layer rule
below.

## The `@theme inline` two-layer rule

`src/style.css` uses `@theme inline`, which inlines a token's value into the
generated utility instead of emitting a `var()` reference. A value written
directly there could not be overridden by `.dark`. So any token whose value
differs between themes is declared twice: an alias in `@theme inline` that
holds a `var()`, and the real values on `:root` and `.dark`.

Elevation does this. Motion, layering, type and layout do not, and are declared
once.

One trap that costs an afternoon: a token `src/style.css` itself reads back
with `var()` — the easings, which the `@utility animate-*` blocks use — must be
declared in a **plain `@theme`**, not `@theme inline`. Inline emits no custom
property for anything to read.

## tailwind-merge has to be told the names

`cn()` is `extendTailwindMerge`, and `src/lib/utils.ts` lists every `--text-*`
and `--shadow-*` rung. This is not tidiness. tailwind-merge classifies an
unknown `text-*` by shape, and a semantic name matches none of its size
validators — so it lands in the **colour** group and silently replaces the
colour written beside it. `cn('text-primary-foreground', 'text-label')` shipped
a primary button whose label inherited `--foreground`, at 3.6:1 on its own
fill. Nothing about the class list looked wrong; axe found it.

`tokenCoverage.test.ts` holds that list to the stylesheet.

## Enforcement

Three tests, all in the architecture tier:

- **`designTokenUsage.test.ts`** fails on `shadow-{2xs…2xl}`, `z-<number>` and
  `duration-<number>` anywhere in application source, and names the token to
  use instead. Its allowlist is empty and should stay empty. Comments are
  stripped before scanning, because a rule that forbids naming the thing it
  forbids cannot be documented where it is enforced.
- **`tokenCoverage.test.ts`** fails on an `--elevation-*`, `--z-*` or
  `--duration-*` that no Foundations story shows, on a story naming a token the
  stylesheet no longer declares, and on a scale rung `cn()` does not know.
- **`touchConventions.test.ts`** already owned the related rule that a press
  transition must name `scale`, since Tailwind v4 compiles `scale-*` to the
  standalone property.

There is no rule for "the story renders the live value rather than a copied
one". That one is not machine-checkable and is why it is written down here.

## Platform insets are tokens too

`--safe-top-min`, `--safe-bottom-min` and `--keyboard-inset` are a public
contract, declared on `:root` alongside everything else. The `safe-area-*`
utilities clamp `env()` against the two floors; `useKeyboardInset` writes the
third onto `<html>` from `visualViewport`.

That clamp is also what makes Storybook's **Phone frame** toolbar control work:
`env()` cannot be faked, but the floor beneath it can. See
[Storybook component contracts](design-system.md) for why the frame is a design
aid and never evidence.

## What the inventory cost

The bundle budget in `package.json` moved from **172 kB to 183 kB** over this
work. The measured total was 171.75 kB before and 181.01 kB after, so the
budget keeps about 2 kB of headroom.

Almost all of it is one decision. `QuickAddNoteSheet` moved from
`MoleculeDialog` to `MoleculeSheet`, which put Reka's `Drawer` into the
production graph *alongside* `Dialog` — `OrganismPwaInstallDialog` still needs
the latter. That is roughly 8 kB brotlied. The rest is `MoleculeAlert`,
`OrganismOfflineBanner` and the list components.

It is a trade worth naming rather than burying, because it is reversible: the
dialog rendered a perfectly good bottom sheet, and what the drawer adds is a
drag handle that actually drags. `MoleculeDialogContent`'s own comment had
called that out as the thing it could not do — a handle that does not drag is
an affordance nobody wired, which is convention 5 in
[Touch conventions](touch-conventions.md). If the bytes matter more than the
gesture on some future device budget, moving the quick-add sheet back is a
one-import change and `MoleculeSheet` stays in the catalogue for the screens
that want it.

Everything else added here is catalogue-only. Foundations, Guidelines and
Patterns are stories; components with no call site — the search field, the
swipeable row, pull-to-refresh — are tree-shaken out of the production build
entirely.
