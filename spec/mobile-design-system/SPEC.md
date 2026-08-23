# Mobile design-system depth

Status: Accepted  
Implementation status: Complete — all six phases  
Predecessor: `spec/storybook-design-system/SPEC.md`, whose catalog now exists in-tree  
Target Tailwind version: `4.3.3` (catalog `ui`)  
Target Reka UI version: catalog `ui`  
Sources of truth: `/Users/alexanderopalic/Projects/opensource/reka-ui` (branch `v2`),
`/Users/alexanderopalic/Projects/opensource/storybook` (branch `pinned/10.5.7`),
and the Tailwind v4 theme-namespace table quoted in
[Tailwind namespace constraints](#tailwind-namespace-constraints)

## Summary

The predecessor spec built the catalog *machinery*: story coverage graded in
the architecture tier, axe at `error` on every story, a light/dark/touch
Chromium matrix, locale switching, and Autodocs through `vue-component-meta`.
That work is done and is not revisited here.

What it did not build is the *content* a contributor needs in order to assemble
a mobile PWA that looks finished. Two things are missing:

1. **The token layer stops at colour.** Elevation, motion, layering, the type
   scale, and layout constants are not tokens; they are literals typed at call
   sites. A design system whose depth and timing are ad hoc produces screens
   that are individually defensible and collectively incoherent.
2. **The component inventory stops at form controls.** There is no list row, no
   sheet, no tabs, no empty state. Every screen therefore invents them, and the
   catalog documents nine atoms while the app is built out of undocumented
   one-offs.

This specification closes both, plus the smaller catalog gaps that follow from
them: a mobile default viewport, a device frame that makes safe-area and
keyboard behaviour visible, written guidance pages, and a PWA state catalog.

As with its predecessor, this document contains no implementation. The first
implementation change begins only after it is accepted.

## Evidence

Counted across `src/components/`, `src/features/`, `src/views/`, and
`src/App.vue` at the time of writing:

| Literal | Occurrences | What it means |
| --- | --- | --- |
| `shadow-xs` | 9 | "a card", untokenised |
| `shadow-lg` | 6 | "the FAB" and "the dialog" and "the sheet", all one value |
| `z-50` | 6 | six different layers, one number |
| `z-10` | 1 | the seventh layer |
| `duration-100` | 3 | press feedback |
| `duration-200` | 2 | unclassified |
| `duration-300`, `duration-150`, `duration-0` | 1 each | unclassified |

`src/style.css` additionally hard-codes `cubic-bezier(0.16, 1, 0.3, 1)` in two
keyframes and `cubic-bezier(0.32, 0.72, 0, 1)` in two more, with no name
binding the sheet and drawer timings together.

Three further findings drive sections below:

- **The catalog and its tests disagree about viewport.** `vitest.config.ts`
  runs Storybook stories with `viewport: { value: 'mobile', isRotated: false }`
  while `.storybook/preview.ts` sets `initialGlobals` to `locale` and `theme`
  only. CI grades the system at 390 px; a human browsing it sees desktop width.
- **The shell says the button atom is insufficient.**
  `OrganismAppShell.vue` carries two `eslint-disable vue/no-restricted-html-elements`
  comments, both stating that `AtomButton` cannot express a nav tab and that
  the fix "wants a `nav` variant on the atom". The system has already diagnosed
  itself.
- **Safe-area and keyboard behaviour are invisible in the catalog.**
  `docs/design-system.md` routes "real safe areas and on-screen keyboards" to a
  manual device checklist. This is correct for *proof*, but it means the
  catalog cannot *show* the shell's most distinctive behaviour.

## Goals

1. Make elevation, motion, layering, type, and layout first-class tokens with
   the same "the CSS is authoritative, the catalog renders it" rule the colour
   foundations already follow.
2. Give dark mode a correct elevation model rather than the light model's
   shadows.
3. Ship the mobile components every screen currently reinvents, built on Reka
   UI headless behaviour wherever Reka has it.
4. Retire both `eslint-disable` comments in `OrganismAppShell.vue` by extending
   the button atom rather than overriding it.
5. Make the catalog open at mobile width, matching what CI grades.
6. Make safe-area insets and the on-screen keyboard *visible* in Storybook
   without weakening the rule that only a real device proves them.
7. Add the written guidance a props table cannot carry: when to use a sheet
   versus a dialog, what each elevation level means, which motion duration
   applies.
8. Catalog the PWA states a local-first app actually has — offline, sync
   pending, quota exceeded, first run.
9. Enforce every new token in the architecture tier, so the literals this spec
   removes cannot come back.
10. Keep the production bundle inside a budget that is raised deliberately or
    not at all.

## Non-goals

- Restyling the product. Token extraction must be visually neutral except where
  a diff is explicitly reviewed as an improvement.
- A second design system, a component package, or a published token artifact.
- Chromatic or any hosted visual-review service. The existing local visual tier
  remains the pixel authority.
- Replacing `env(safe-area-inset-*)` with a JavaScript measurement.
- Treating the Storybook device frame as evidence of safe-area correctness.
- Adding an icon library beyond `@lucide/vue`.
- Theming beyond light and dark. No brand-swap, no per-user accent.
- Migrating to CSF Next, which the predecessor spec deferred and this one does
  not reopen.

## Tailwind namespace constraints

The token design below is shaped by what Tailwind v4 actually exposes. These
were verified against the theme-namespace table in the Tailwind docs and must
not be re-derived from memory during implementation:

| Token family | Namespace | Consumption |
| --- | --- | --- |
| Elevation | `--shadow-*` **is** a namespace | `shadow-sheet` |
| Easing | `--ease-*` **is** a namespace | `ease-out-expo` |
| Keyframe animations | `--animate-*` **is** a namespace | `animate-sheet-in` |
| Type sizes | `--text-*` **is** a namespace, with `--text-*--line-height`, `--text-*--font-weight`, `--text-*--letter-spacing` modifiers | `text-body` |
| Spacing and sizing | `--spacing-*` **is** a namespace | `h-nav-height` |
| Font family | `--font-*` **is** a namespace | `font-sans` |
| **Duration** | **not** a documented namespace | `duration-(--duration-fast)` |
| **Z-index** | **not** a namespace | `z-(--z-sheet)` |

Duration and z-index therefore live as plain custom properties on `:root` and
are consumed through Tailwind's documented `utility-(<custom-property>)`
syntax. The compiled Tailwind source does resolve `duration-*` against an
undocumented `--transition-duration-*` namespace; the implementation must not
rely on it. This repository's policy on unstable API — stated in the
predecessor spec and reaffirmed here — is to use the documented form.

### The `@theme inline` two-layer rule

`src/style.css` uses `@theme inline`, which inlines a token's value into the
generated utility instead of emitting a `var()` reference. That is why colours
are declared twice: `@theme inline { --color-card: var(--card) }` plus a
`--card` on `:root` and again on `.dark`. Inlining a `var()` keeps the
indirection, so the `.dark` override still wins.

Every token in this spec whose value differs between themes must follow the
same two-layer shape. Elevation does. Motion, layering, type, and layout do
not, and are declared once.

## Part A: The token layer

### A1. Elevation

Five semantic levels, each named for the role that owns it:

| Token | Owner |
| --- | --- |
| `--elevation-raised` | A card resting on the background |
| `--elevation-sticky` | A header or tab bar that has content scrolled under it |
| `--elevation-floating` | The FAB |
| `--elevation-sheet` | A bottom sheet or drawer |
| `--elevation-overlay` | A dialog, menu, or toast |

Two rules constrain the values:

- **The sheet shadow points upward.** A bottom sheet occludes content above it,
  not below. A downward shadow on a bottom-anchored surface is the single most
  common tell that a web app is imitating a native one.
- **Dark mode does not elevate with shadow.** A black shadow on a near-black
  surface is invisible, and matching the light values there is the reason dark
  interfaces look flat. Dark elevation is carried by a lighter surface plus a
  hairline top highlight — a `0 0 0 1px oklch(1 0 0 / …)` ring, optionally with
  a soft ambient shadow beneath it. The token names stay identical; only the
  values differ, and they differ inside `.dark` under the two-layer rule.

The five names are exhaustive. A sixth level is a design change and needs a
reason recorded in `docs/design-system.md`, not a new literal.

### A2. Motion

Easings, in `@theme` because `--ease-*` is a real namespace:

| Token | Value | Owner |
| --- | --- | --- |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | sheet enter — already in `style.css`, unnamed |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Reka drawer enter — already in `style.css`, unnamed |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | everything else |

Durations, as plain custom properties:

| Token | Value | Owner |
| --- | --- | --- |
| `--duration-instant` | `100ms` | press feedback, matching today's `duration-100` |
| `--duration-fast` | `150ms` | colour, opacity, small state changes |
| `--duration-base` | `200ms` | in-place layout and size changes |
| `--duration-sheet-in` | `300ms` | sheet and drawer entrance |
| `--duration-sheet-out` | `240ms` | sheet and drawer exit |

Entrance and exit are separate tokens because they are not symmetric: a
dismissal should feel faster than a presentation. The existing keyframes
already encode this asymmetry (`0.3s` in, `0.24s` out; `0.25s` in, `0.2s` out)
without naming it. Naming it is the point.

The `prefers-reduced-motion` block in `src/style.css` stays exactly as it is.
It already overrides every duration globally, and tokenisation must not narrow
it to an opt-in list.

### A3. Layering

Six levels, plain custom properties, consumed as `z-(--z-nav)`:

| Token | Value | Owner |
| --- | --- | --- |
| `--z-sticky` | `10` | sticky page header |
| `--z-nav` | `20` | bottom tab bar |
| `--z-floating` | `30` | FAB |
| `--z-overlay` | `40` | scrim behind a sheet or dialog |
| `--z-sheet` | `50` | sheet, drawer, dialog surface |
| `--z-toast` | `60` | toast viewport, above everything |

The ordering is the contract. Reka portals its overlay content to `body`, so
the scrim and surface values must stay adjacent and above every in-document
level; a story must prove a toast renders above an open sheet.

### A4. Type scale

`--text-page-title` and `--text-section-title` stay. The scale is completed
with body, callout, label, footnote, and caption, using the `--text-*`
namespace and its `--line-height` / `--font-weight` modifiers so a size carries
its own vertical rhythm and weight rather than needing a companion class.

Also added:

- `--font-sans`, so the system font stack is a token rather than a Tailwind
  default the app never chose.
- A `tabular-nums` utility or token for numeric readouts. `MoleculeNumericInput`
  displays a changing number; without tabular figures it jitters as digits
  change width.

The scale is semantic, not numeric. There is no `--text-lg`-style rung whose
name says nothing about where it belongs.

### A5. Layout constants

| Token | Owner |
| --- | --- |
| `--spacing-nav-height` | tab-bar content box, excluding the safe-area inset |
| `--spacing-header-height` | page-header content box, excluding the safe-area inset |
| `--spacing-gutter` | screen-edge horizontal padding |

`--spacing-touch-target` and `--spacing-section` already exist and are
unchanged. `OrganismAppShell` currently derives its tab height implicitly from
`py-3` plus icon and label heights, so anything that needs to sit above the tab
bar has to guess; these tokens make the geometry addressable.

Both height tokens exclude safe-area insets, because the insets are added by
the `safe-area-*` utilities on top. A token that silently included them could
not be used in a `calc()` alongside those utilities without double-paying.

### A6. Safe area and keyboard, as documented contract

No new behaviour. `useKeyboardInset` already writes `--keyboard-inset` to
`<html>` from `visualViewport`, correctly handling the iOS pan case and the
pinch-zoom false positive, and the `safe-area-*` utilities already clamp
`env()` against `--safe-top-min` / `--safe-bottom-min`.

What is missing is that these three variables are a *public token contract* and
are documented nowhere in the token file. The implementation declares them with
comments in `src/style.css` alongside the other tokens, and Part C makes them
adjustable in the catalog.

`index.html` is not changed. Adding `interactive-widget=resizes-content` to the
viewport meta would alter how the visual viewport reports keyboard height and
would invalidate `useKeyboardInset`'s tested behaviour and
`src/__tests__/composables/useKeyboardInset.spec.ts`. If it is ever wanted, it
is its own spec.

### A7. Call-site migration

Every literal counted in [Evidence](#evidence) is replaced with the token that
names its role. This is the part of Part A that can regress the product, so:

- The migration is visually neutral by intent. Where a literal was wrong — the
  same `shadow-lg` on the FAB and the dialog — the corrected value is called
  out in the commit message as a deliberate change, not folded in silently.
- `pnpm test:visual` runs before and after. Baseline updates are reviewed as an
  intentional diff, never regenerated to make a run green.

## Part B: The component inventory

Reka UI supplies headless behaviour for most of what is missing. The table
below names the Reka primitive where one exists; a dash means the component is
ours end to end. Nothing here changes the layering rule in
`docs/ui-components.md`: Reka owns behaviour, the primitive owns markup and
classes, composites own composition.

### B1. Tier 1 — unblocks the most screens

| Component | Tier | Reka | Required states |
| --- | --- | --- | --- |
| `MoleculeList` / `MoleculeListRow` | molecules | — | plain, with leading icon, with trailing chevron, with trailing control, two-line, sectioned, pressed, disabled, long label truncation |
| `MoleculeSheet` | molecules | `Drawer` | closed, open, with form, swipe-dismiss, above keyboard, long scrolling content |
| `MoleculeTabs` | molecules | `Tabs` | two tabs, many tabs with overflow, selected, disabled tab, keyboard traversal |
| `MoleculeEmptyState` | molecules | — | empty, filtered-to-empty, error, with primary action |
| `AtomButton` `nav` and `icon` variants | atoms | — | tab active, tab inactive, icon-only with accessible name |

The button variants are grouped into tier 1 because they are the fix for the
two `eslint-disable` comments in `OrganismAppShell.vue`. Their exit condition
is that both comments and both inline class strings are deleted.

`MoleculeListRow` is first for a reason: it is the most-used component in any
mobile app and `SettingsView` is currently hand-rolling it.

### B2. Tier 2 — the standard primitives

| Component | Tier | Reka | Notes |
| --- | --- | --- | --- |
| `AtomCard` | atoms | — | the surface that owns `--elevation-raised` |
| `AtomSeparator` | atoms | `Separator` | |
| `AtomAvatar` | atoms | `Avatar` | image, initials fallback, loading |
| `AtomCheckbox` | atoms | `Checkbox` | includes indeterminate |
| `AtomRadioGroup` | atoms | `RadioGroup` | compound; one provider-tree story |
| `AtomSlider` | atoms | `Slider` | touch-tagged; thumb must meet the 44 px floor |
| `AtomProgress` | atoms | `Progress` | determinate and indeterminate |
| `MoleculeAlert` | molecules | — | info, success, warning, destructive, dismissible |
| `MoleculeSearchField` | molecules | — | empty, typing, with clear button, no results |

### B3. Tier 3 — the mobile-specific ones

| Component | Tier | Reka | Notes |
| --- | --- | --- | --- |
| `MoleculeActionSheet` | molecules | `Drawer` | the native overflow/long-press affordance; destructive item styling |
| `MoleculeChipRow` | molecules | `ScrollArea` + `Toggle` | horizontal scroll-snap filter row; must not trap vertical scroll |
| `MoleculeSwipeableRow` | molecules | — | touch-tagged; reveal, commit, cancel, keyboard-accessible equivalent action |
| `OrganismPullToRefresh` | organisms | — | touch-tagged; idle, pulling, threshold, refreshing, done |
| `OrganismBottomNav` | organisms | — | extracted from `OrganismAppShell`, which keeps composing it |

Two accessibility constraints are not optional and belong in the story `play`
functions, not in review comments:

- A swipe action must have a non-gesture equivalent. A destructive action
  reachable only by swiping is unreachable for keyboard and switch users.
- Pull-to-refresh must not be the only path to refreshed data.

### B4. Inventory rules

- A component is added at the lowest tier whose dependencies fit, per
  `docs/atomic-design.md`.
- A compound primitive gets one provider-tree story, per the existing
  architecture rule. `AtomRadioGroup`, `MoleculeSheet`, `MoleculeTabs`,
  `MoleculeActionSheet`, and `MoleculeChipRow` are compound.
- Every new interactive component is added to `PLAY_REQUIRED` in
  `src/__tests__/architecture/storybookCoverage.test.ts`.
- Every gesture component carries the `touch` tag and asserts
  `matchMedia('(pointer: coarse)').matches` before asserting its branch, per
  `docs/design-system.md`.
- No component is added without a consumer. If a tier-2 or tier-3 component
  has no call site in the `notes` example or a view, its story must document
  the intended use in component JSDoc.

## Part C: The catalog as a design system

### C1. Mobile default viewport

`.storybook/preview.ts` gains `viewport: { value: 'mobile', isRotated: false }`
in `initialGlobals`, matching `vitest.config.ts`. One line, and the catalog
stops disagreeing with the suite that grades it.

The four existing viewport options are unchanged.

### C2. Device frame, safe area, and keyboard

Add two Storybook globals with toolbar entries:

- `frame`: `off` (default) or `phone`.
- `keyboard`: `closed` (default) or `open`.

The `frame` decorator wraps the story in a phone bezel and sets
`--safe-top-min: 44px` and `--safe-bottom-min: 34px` on the story root. This
works *because* the existing `safe-area-*` utilities are written as
`max(var(--safe-top-min, 0px), env(safe-area-inset-top))`: `env()` cannot be
faked, but the clamp floor can, and it produces exactly the padding a notched
device would. The utilities need no change.

The `keyboard` decorator sets `--keyboard-inset` on `<html>` to a representative
height, so a sheet's `bottom: var(--keyboard-inset, 0px)` positioning is
visible in the catalog.

Both default to off, and `vitest.config.ts` leaves them off in all three
Storybook projects. This is a hard requirement: the touch project asserts 44 px
geometry and the visual tier holds pixel baselines, and a frame that changed
layout by default would silently move both.

Neither decorator is evidence. `docs/design-system.md` keeps routing real safe
areas and real keyboards to the manual device checklist, and the implementation
adds a sentence to the frame's own docs page saying so.

### C3. Guidance pages

MDX under `src/stories/`, because a generated props table cannot say *when*:

| Page | Answers |
| --- | --- |
| `Foundations/Elevation` | what each of the five levels means, why dark mode elevates differently, rendered live from the tokens |
| `Foundations/Motion` | the duration and easing tokens, the entrance/exit asymmetry, the reduced-motion guarantee |
| `Foundations/Layering` | the six z-index levels and the portal rule |
| `Foundations/Icons` | the sanctioned `@lucide/vue` set and the two sizes — 24 px in nav, 16 px in buttons — currently recorded only inside an `eslint-disable` comment |
| `Guidelines/Sheet or dialog` | which to reach for, on which viewport, with which dismissal |
| `Guidelines/Touch` | the five conventions from `docs/touch-conventions.md`, rendered against real components |
| `Guidelines/Small screens` | truncation, long German copy, two-line rows, minimum legible sizes |

The touch page must not fork `docs/touch-conventions.md`. It links to it and
renders demonstrations; the markdown file stays the single source of the rules,
per the project's one-copy-of-a-convention rule.

`storySort` in `.storybook/preview.ts` is extended so the order becomes
`Start`, `Foundations`, `Guidelines`, `Components`, `Patterns`, `Features`,
`Screens`.

### C4. Patterns

A `Patterns/` section holding composed recipes rather than single components:
list-detail navigation, a form inside a sheet, a long scrolling list with
sticky section headers, offline-and-retry, and first-run onboarding.

These are the answer to "show me how to build a screen", which no atom story
can give. They compose existing components only; a pattern that needs a new
component means that component belongs in Part B.

## Part D: PWA states

Install and update prompts already have stories. A local-first app has four
more states that are the product, not edge cases:

| State | Where |
| --- | --- |
| Offline | `OrganismOfflineBanner`, plus the offline-and-retry pattern |
| Sync or write pending | list and row stories |
| Storage quota exceeded | an `MoleculeAlert` destructive story, reachable from `src/lib/persistentStorage.ts`'s public contract |
| First run, no data | the empty state on `Screens/Notes`, plus the onboarding pattern |

These stories drive their state through public composable and repository
boundaries, never by writing a Dexie table or asserting a global exists. That
rule is inherited from the predecessor spec and is unchanged.

## Enforcement

Tokens that are not enforced come back as literals within two features. Three
additions to the architecture and lint-rule tiers:

1. **No raw depth, layer, or timing utilities in application source.** A test
   over `src/**/*.vue` and `src/**/*.ts` fails on `shadow-{2xs,xs,sm,md,lg,xl,2xl}`,
   `z-<number>`, and `duration-<number>`, and names the token to use instead.
   The allowlist starts empty. Foundations stories that deliberately render
   Tailwind's defaults for comparison are the only candidates for exemption,
   and each needs a stated reason.
2. **Token coverage ledger.** Every `--elevation-*`, `--z-*`, and
   `--duration-*` declared in `src/style.css` must appear in a Foundations
   story. This mirrors the existing a11y coverage ledger: it catches the token
   that was added and never documented.
3. **Story coverage.** Unchanged mechanism, extended data —
   `storybookCoverage.test.ts` already fails on a component without a story,
   and each new interactive component is added to `PLAY_REQUIRED`.

Foundations stories continue to read values from live CSS custom properties.
The existing rule — "the catalog contains names and compositions, never copied
OKLCH values" — extends verbatim to shadows, durations, and z-index.

## Files expected from implementation

```text
src/style.css                                   # all new tokens
src/stories/foundations/
  Elevation.stories.ts
  Motion.stories.ts
  Layering.stories.ts
  Icons.stories.ts
src/stories/guidelines/
  SheetOrDialog.mdx
  Touch.mdx
  SmallScreens.mdx
src/stories/patterns/
  ListDetail.stories.ts
  FormInSheet.stories.ts
  StickySectionList.stories.ts
  OfflineAndRetry.stories.ts
  FirstRun.stories.ts
.storybook/
  preview.ts                                    # initialGlobals, globals, decorators, storySort
  decorators/
    withDeviceFrame.ts
    withKeyboard.ts
src/components/atoms/Atom{Card,Separator,Avatar,Checkbox,Progress,Slider}.vue
src/components/atoms/AtomRadioGroup/            # compound
src/components/molecules/{list,sheet,tabs,action-sheet,chip-row}/
src/components/molecules/Molecule{EmptyState,Alert,SearchField,SwipeableRow}.vue
src/components/organisms/Organism{BottomNav,PullToRefresh,OfflineBanner}.vue
  + a colocated .stories.ts for every one of the above
src/__tests__/architecture/tokenCoverage.test.ts
```

Expected edits outside those files:

- `src/components/organisms/OrganismAppShell.vue`: both `eslint-disable`
  comments deleted, tab markup replaced by `OrganismBottomNav`;
- `src/components/atoms/AtomButton.vue`: `nav` and `icon` variants;
- `src/views/SettingsView.vue`: hand-rolled rows replaced by `MoleculeListRow`;
- `src/__tests__/architecture/storybookCoverage.test.ts`: `PLAY_REQUIRED`;
- `vitest.config.ts`: only if the new globals need explicit defaults;
- `docs/design-system.md`, `docs/ui-components.md`, `docs/touch-conventions.md`,
  `docs/atomic-design.md`, `docs/index.md`: the token contract, the component
  inventory, and the device-frame caveat;
- `package.json` `size-limit`: only under the rule in
  [Risks](#risks-and-failure-shields).

## Implementation sequence

Each phase ends green. No phase begins before its predecessor's exit condition
holds.

### Phase 1: Tokens, no call sites

1. Declare elevation, motion, layering, type, and layout tokens in
   `src/style.css`, with the two-layer shape for elevation.
2. Add the four Foundations stories rendering them live.
3. Add `tokenCoverage.test.ts`.

Exit condition: tokens exist and are documented, no component file has changed,
and `pnpm test:visual` is byte-identical.

### Phase 2: Call-site migration and enforcement

1. Replace every counted literal with its token.
2. Add the no-raw-utilities architecture test with an empty allowlist.
3. Review the visual diff; update baselines only for intended changes.

Exit condition: the enforcement test passes with no exemptions, and every
visual baseline change is individually justified in the commit message.

### Phase 3: Catalog mobile-first

1. Default the Storybook viewport to mobile.
2. Add the frame and keyboard decorators and their toolbar globals, both
   defaulting to off.
3. Add the guidance MDX pages and extend `storySort`.

Exit condition: the catalog opens at 390 px, the frame reveals safe-area
padding on the app-shell story, the keyboard global lifts the dialog sheet, and
all three Vitest Storybook projects are unchanged in outcome.

### Phase 4: Tier 1 components

1. `AtomButton` `nav` and `icon` variants; retire both `eslint-disable`
   comments and extract `OrganismBottomNav`.
2. `MoleculeListRow` / `MoleculeList`; migrate `SettingsView`.
3. `MoleculeSheet` on Reka `Drawer`; reconcile with `QuickAddNoteSheet`.
4. `MoleculeTabs`, `MoleculeEmptyState`.

Exit condition: no inline nav-tab markup or hand-rolled setting row remains in
the app, and every new component is green in the light, dark, and touch
projects.

### Phase 5: Tier 2 and tier 3 components

1. Tier 2 primitives, each with its story catalog.
2. Tier 3 mobile components, each `touch`-tagged with a coarse-pointer
   assertion and a non-gesture equivalent action.
3. Re-run `pnpm build && pnpm size-limit` after each group.

Exit condition: the inventory in Part B is complete and the bundle is inside
its budget, or a budget change has been reviewed on its own.

### Phase 6: Patterns and PWA states

1. Add the five pattern stories.
2. Add offline, pending, quota, and first-run states.
3. Update the documentation tree and the deletion path in `README.md`.

Exit condition: a contributor can assemble a screen from the catalog without
opening the app, and every documented state is reachable in Storybook.

## Verification matrix

| Verification | What it proves |
| --- | --- |
| `pnpm check` | lint, types, unit, architecture, and dead-code gates stay green, including the two new architecture tests |
| `pnpm build:storybook` | MDX guidance pages, decorators, and docgen build together |
| `pnpm test:storybook` | every new story renders and passes axe in light and dark |
| `pnpm test:storybook:touch` | gesture components assert coarse pointer before asserting their branch |
| Storybook UI, frame global on | safe-area padding appears on the app shell and sheet stories |
| Storybook UI, keyboard global on | a sheet repositions above `--keyboard-inset` |
| Toast story over an open sheet | the layering order is real, across the Reka portal boundary |
| Dark elevation story | depth is visible on a dark surface without a light-mode shadow |
| `pnpm test:visual` | token migration is visually neutral except where reviewed |
| `pnpm test:touch` | the 44 px geometry contracts survive the new components |
| `pnpm test:a11y` | whole-screen axe and ARIA structure survive the `SettingsView` and app-shell migrations |
| `pnpm test:e2e` | production PWA behaviour is unaffected |
| `pnpm build && pnpm size-limit` | Reka's new component imports stay inside the budget |

## Acceptance criteria

- Elevation, motion, layering, type, and layout are tokens in `src/style.css`.
- Elevation has distinct dark-mode values and the sheet shadow points upward.
- Duration and z-index use the documented `utility-(<custom-property>)` syntax,
  not an undocumented namespace.
- No `shadow-<default>`, `z-<number>`, or `duration-<number>` literal remains
  in application source, and the architecture test that forbids them has an
  empty allowlist.
- Every declared token appears in a Foundations story, rendered from the live
  custom property rather than a copied value.
- Both `eslint-disable vue/no-restricted-html-elements` comments in
  `OrganismAppShell.vue` are gone, replaced by a button variant.
- `SettingsView` composes `MoleculeListRow` instead of hand-rolled markup.
- Every component in Part B exists, sits in the correct atomic tier, and owns
  exactly one story catalog, with compound primitives documented as trees.
- Every gesture component has a keyboard-reachable equivalent action, asserted
  in a `play` function.
- The catalog opens at mobile width, matching `vitest.config.ts`.
- The frame and keyboard globals default to off and change no test outcome.
- `docs/design-system.md` still routes real safe areas and keyboards to the
  device checklist, and the frame page says it is a design aid.
- The guidance pages link to the markdown conventions rather than forking them.
- Every documented PWA state is reachable in Storybook through a public
  boundary.
- The production bundle is inside its size budget, raised only by a reviewed
  decision.
- No hosted visual service was added.

## Risks and failure shields

| Risk | Required shield |
| --- | --- |
| Token migration silently restyles the product | Phase 1 changes no call site; Phase 2's visual diff is reviewed line by line and baselines are never regenerated to go green |
| Dark elevation copies light shadows and looks flat | Separate `.dark` values under the two-layer rule, plus a dark elevation story that a reviewer must look at |
| Device frame shifts geometry and moves touch or visual assertions | Both globals default to off and are left off in all three Vitest projects; the touch and visual tiers run in the same phase that adds them |
| The frame is mistaken for safe-area proof | The device checklist stays authoritative in `docs/design-system.md`, and the frame's own page says it is a design aid |
| `duration-*` relies on an undocumented namespace | Documented `duration-(--duration-fast)` syntax only, recorded in [Tailwind namespace constraints](#tailwind-namespace-constraints) |
| Twenty-one new components blow the bundle budget | `size-limit` after every group in Phase 5; a budget raise is its own reviewed commit with the measured delta, never folded into a component commit |
| The component inventory outgrows its consumers | No component ships without a call site or documented intent; tier 3 can be cut without blocking tier 1 and 2 |
| A gesture becomes the only path to an action | Non-gesture equivalent asserted in the story `play` function, not left to review |
| Guidance pages fork the markdown conventions | MDX links to `docs/*.md` and renders demonstrations; the rules live in one file |
| New tokens are added but never documented | `tokenCoverage.test.ts` fails on an undocumented token |
| The catalog and CI drift on viewport again | Both read mobile as the default and the acceptance criteria name the pair |

## Deferred decisions

- `interactive-widget=resizes-content` in the viewport meta. It changes what
  `visualViewport` reports and would invalidate `useKeyboardInset` and its
  spec. Its own document, if wanted.
- A brand-swappable theme layer or user-selectable accent colour.
- Publishing tokens as generated JSON or a design-tool artifact.
- Container queries as the responsive mechanism for list rows and cards.
- View Transitions for route changes, which would interact with the motion
  tokens defined here but is a navigation decision, not a token one.
- Extracting the design system into a package.
- Hosted visual review, unchanged from the predecessor spec.

Each of these changes deployment, source ownership, or an already-tested
contract rather than merely deepening the system.
