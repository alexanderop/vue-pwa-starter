# Spec — mobile shell bugs + Stage 1 reflexes

**Status:** proposed
**Scope:** three bugs, six Stage 1 changes, three enforcement tripwires, one doc
**Estimated:** ~1.5h of edits, plus verification on a real device profile

This is a working plan, not a concept doc — it lives at the repository root
rather than in `docs/`, and it gets deleted when the work lands. The durable
conventions it produces go to `docs/touch-conventions.md` (see §D).

---

## Why

An interface teardown compared a downstream app (MacroTracker) against Tilly
and found fourteen missing native-feel conventions. Reading it against this
tree: thirteen of the fourteen are **defects in this starter**, inherited
unchanged. Several cite the same file and line we ship.

| Teardown finding | Origin here |
| --- | --- |
| Only `active:` is the FAB | `src/App.vue:60` — the only one |
| Only `select-none` is a form label | `src/components/ui/label/Label.vue:23` |
| `overscroll-behavior-y` on the wrong element | `src/style.css:125` + `src/components/AppShell.vue:49` |
| `safe-area-bottom` is raw `env()`, collides with `pb-6` | `src/style.css:133` + `src/components/ui/dialog/DialogContent.vue:74` |
| Decorative grabber, comment promising a swipe | `DialogContent.vue:86`, comment at `:102` |
| Only `env()` in the tree is the bottom inset | one occurrence, `src/style.css:134` |
| No reduced-motion guard | zero occurrences, and we ship the sheet keyframes |

`docs/index.md` states that *"the app shell, safe-area handling, and
keyboard-aware sheets are the product."* Two of those three are the weakest
part of the shipped shell. This spec fixes the part that is wrong today; the
Drawer migration and the install surface are separate work (§F).

---

## A. Bugs

These are not missing polish. They are wrong on real hardware today and
invisible in every test tier we run.

### A1 — `safe-area-bottom` collapses sheet padding on flat-bottomed phones

`src/style.css:133`, `src/components/ui/dialog/DialogContent.vue:74`

The utility writes a bare `padding-bottom`. `DialogContent` applies it
alongside `pb-6`, so two utilities declare the same property and the winner is
decided by generated-stylesheet order, not by the order they were authored.

**Verified against the compiled stylesheet, not reasoned about.** Compiling
`src/style.css` against a `class="pb-6 safe-area-bottom"` probe emits:

```css
.pb-6            { padding-bottom: calc(var(--spacing) * 6); }   /* line 620 */
.safe-area-bottom{ padding-bottom: env(safe-area-inset-bottom); } /* line 623 */
```

Equal specificity, `safe-area-bottom` last — so it wins, and `env()` resolves
to `0px` on any hardware without a home indicator. This is not a latent
ordering risk. **Every bottom sheet in the app has zero bottom padding right
now**, on every desktop browser, in every test run, and on every flat-bottomed
phone. It looks correct only on a notched device, which is the one place nobody
checks a starter.

Clamp it, and make the utility the only thing writing the property:

```css
/* src/style.css */

/* Padding for elements pinned to the bottom edge, so they clear the home
   indicator on notched phones in standalone PWA mode. Requires
   viewport-fit=cover in index.html.

   Clamped, not raw: every inset is 0 on flat-bottomed hardware, so a bare
   env() ships a layout nobody tested. `--safe-bottom-min` is the floor the
   call site wants; the utility is the only thing writing padding-bottom, so
   there is no second declaration to lose an ordering race to. */
@utility safe-area-bottom {
  padding-bottom: max(var(--safe-bottom-min, 0px), env(safe-area-inset-bottom));
}
```

Then at `DialogContent.vue:74`, drop `pb-6` and pass the floor instead:

```diff
- '… rounded-t-2xl border pt-2 px-4 pb-6 shadow-lg safe-area-bottom',
+ '… rounded-t-2xl border pt-2 px-4 shadow-lg safe-area-bottom [--safe-bottom-min:1.5rem]',
```

**Checked, non-issue:** at `sm:` the sheet becomes a centered dialog with
`sm:p-6`. Both that and the clamped utility resolve to ≥1.5rem there (`env()`
is 0 on desktop), so whichever wins the cascade produces the same box. No
change needed.

### A2 — scroll chains out of `<main>`

`src/components/AppShell.vue:49`

`body` carries `overscroll-behavior-y: none` (`src/style.css:125`) and that
rule is correct — it is the outer guard. But `body` never scrolls: the shell is
an `h-dvh` flex column and `<main>` is the scroller. Reaching the end of a list
chains the gesture outward, which is the single most common "this is a website"
tell.

```diff
- <main class="flex-1 overflow-y-auto">
+ <main class="flex-1 overflow-y-auto overscroll-contain">
```

`overscroll-contain` rather than `none`: we want chaining stopped, not
rubber-banding removed from the element that legitimately scrolls.

### A3 — we draw an affordance we have not wired

`src/components/ui/dialog/DialogContent.vue:86`, comment at `:101–103`

The grabber pill is a decorative `<div>` with no pointer handlers, and the
comment beside it tells the reader the sheet is *"dismissed by tapping the
overlay or swiping."* Swiping is not implemented. An unhonored affordance is
worse than no affordance — the user tries it, gets nothing, and stops trusting
the rest of the screen.

`reka-ui@2.10.1` is already installed and ships `Drawer/` (`DrawerRoot`,
`DrawerHandle`, `DrawerSwipeArea`, snap points, velocity dismissal). Migrating
to it is the right fix and is **out of scope here** — it is an API migration,
not a CSS change (§F).

The in-scope fix is to stop lying:

```diff
- <!-- Close button (desktop only) — on mobile the sheet is dismissed by
-      tapping the overlay or swiping, and the corner target competes with
-      the drag handle. -->
+ <!-- Close button (desktop only) — on mobile the sheet is dismissed by
+      tapping the overlay, and the corner target competes with the drag
+      handle. The handle is currently a visual grip, not a gesture: see
+      spec.md §F for the reka-ui Drawer migration that wires it. -->
```

---

## B. Stage 1 — reflexes

Ordered by payoff. All six are CSS and class strings; no new dependencies.

### B1 — press states and touch-first sizing on the button base

`src/components/ui/button/index.ts:7,17–22`

Every button in the app currently answers a tap with nothing: the base carries
`transition-colors` and each variant carries a `hover:`. Tailwind v4 correctly
gates `hover:` behind `@media (hover: hover)`, which means on a phone those
styles never fire at all.

Three problems, one edit:

- `transition-colors` cannot animate a transform, so the property list widens.
- `touch-action: manipulation` drops the ~300ms double-tap-zoom wait.
- `select-none` stops a long-press turning a button label into a selection.

```diff
- "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden …"
+ "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium select-none touch-manipulation transition-[color,background-color,box-shadow,transform] duration-100 active:scale-[0.97] focus-visible:outline-hidden …"
```

Sizing is written touch-first and collapsed for a fine pointer, so the 44px
floor is the default and shrinking is the exception:

```diff
  size: {
-   default: 'h-10 px-4 py-2',
-   sm: 'h-9 rounded-md px-3',
-   lg: 'h-11 rounded-md px-6',
-   icon: 'size-touch-target',
+   default: 'h-touch-target px-4 py-2 pointer-fine:h-10',
+   sm: 'h-10 rounded-md px-3 pointer-fine:h-9',
+   lg: 'h-12 rounded-md px-6 pointer-fine:h-11',
+   icon: 'size-touch-target pointer-fine:size-10',
  },
```

**Verified:** `pointer-fine:` compiles natively in the pinned Tailwind 4.3.3 —
`@media (pointer: fine) { .pointer-fine\:h-9 { … } }`. No config, no
`@custom-variant`.

**Consequence for the visual tier:** Playwright's Chromium reports
`pointer: fine`, so `pointer-fine:h-10` wins and the rendered button height is
identical to today. Baselines should not move (§E).

### B2 — press feedback on the tab bar

`src/components/AppShell.vue:63,82` (both loops carry the same string)

The most-tapped surface in the app, and its only feedback is a `hover:` that
never fires on a phone.

```diff
- class="flex min-h-touch-target flex-1 flex-col items-center justify-center px-2 py-3 transition-colors"
+ class="flex min-h-touch-target flex-1 flex-col items-center justify-center px-2 py-3 select-none touch-manipulation transition-[color,transform] duration-100 active:scale-90"
```

The two loops exist because the tabs split around the optional `#center-action`
slot. Keep them in sync; §C2 will fail the build if one drifts.

### B3 — pay the top and side insets, and drop the inert `sticky`

`src/components/AppShell.vue:48,56`

`index.html:8` sets `viewport-fit=cover`, which is a request for the full
display *and* the responsibility for it. The only `env()` in the tree is the
bottom inset, so landscape on a notched phone is unpaid right now, and the day
anyone adds `black-translucent` every view's header lands under the clock.

Add the two missing utilities beside the clamped one:

```css
/* src/style.css */
@utility safe-area-top {
  padding-top: max(var(--safe-top-min, 0px), env(safe-area-inset-top));
}

@utility safe-area-x {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

**Decision — the insets go on the shell root, not on `<main>`.** The teardown
puts them on the scroll container, which is right for MacroTracker because it
has no shared header. We do: `PageHeader.vue:47` is `sticky top-0`. A sticky
element's constraint rectangle is the **scrollport**, i.e. the scroll
container's padding box — so `padding-top` on `<main>` would *not* push a
sticky header down. The header would stick flush to the top of `<main>` and
slide under the status bar, which is the exact bug we are fixing. Putting the
inset on the shell root is one declaration, correct with or without a sticky
header, correct for both view styles, and it cannot be double-paid.

```diff
- <div class="flex h-dvh flex-col bg-background">
+ <div class="flex h-dvh flex-col bg-background safe-area-top safe-area-x">
```

`bg-background` paints under padding, so the status-bar strip is filled rather
than transparent.

Same file, `:56` — the nav's `sticky bottom-0` is inert. It is a non-flexing
sibling in a non-scrolling `h-dvh` column, so there is no scrollport for it to
stick against. Remove it rather than leave a class that reads as load-bearing:

```diff
- class="sticky bottom-0 border-t bg-card safe-area-bottom"
+ class="border-t bg-card safe-area-bottom"
```

**Gap this opens:** with `meta: { hideNav: true }` the nav does not render, so
nothing pays the bottom inset. Bind it to `<main>` in that case:

```diff
- <main class="flex-1 overflow-y-auto overscroll-contain">
+ <main
+   class="flex-1 overflow-y-auto overscroll-contain"
+   :class="hideNavigation && 'safe-area-bottom'"
+ >
```

**Deliberately not in this spec:** adding
`<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`.
That is what buys the modern full-bleed look, and it is only safe *after* this
lands. Sequenced into §F so the two never ship in the wrong order.

### B4 — stop the app being selectable

`src/style.css:122–127`

App chrome is not a document. Rows, tab labels and stat readouts are controls,
not quotable text, and letting them be selected intercepts the long-press a
native app would spend on a context menu.

```diff
  body {
    @apply bg-background text-foreground;
    /* Prevent rubber-band scrolling of the whole shell; inner containers own scrolling. */
    overscroll-behavior-y: none;
    -webkit-tap-highlight-color: transparent;
+   /* App chrome is not a document: rows, tab labels and readouts are
+      controls. Prose opts back in with `select-text`. */
+   -webkit-user-select: none;
+   user-select: none;
+   -webkit-touch-callout: none;
  }
+
+ /* Fields must stay selectable or text editing breaks on iOS. */
+ input,
+ textarea,
+ [contenteditable='true'] {
+   -webkit-user-select: text;
+   user-select: text;
+ }
```

> **Gotcha — ship both halves in one commit.** Global `user-select: none`
> without the field exemption makes iOS refuse caret placement inside inputs.
> The failure presents as a broken keyboard, not as a CSS bug, and it
> reproduces on no desktop browser and in no tier we run.

`-webkit-touch-callout: none` is the second half of the same idea: without it,
long-pressing a link still raises the iOS action sheet over the UI.

Note for the notes feature: note bodies are prose. Whichever element renders
user-authored text gets `select-text` back — check `NotesView.vue` and
`NoteCard.vue` while making this change.

### B5 — honor reduced motion

`src/style.css`

Zero occurrences of `prefers-reduced-motion` in the tree, and we ship
`slide-up-mobile` / `slide-down-mobile` (`style.css:138–163`) plus, after B1
and B2, a transform on every button and tab in the app. Append after the
`@utility` blocks:

```css
/* We ship sheet keyframes and press transforms; a user who has asked the OS
   for less motion has asked for both. Scoped globally on purpose — an
   opt-in list is a list someone forgets to extend. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### B6 — `touch-manipulation` on the FAB

`src/App.vue:53`

The FAB already has `active:scale-95`, which is why it was the teardown's one
positive. It is missing the double-tap-zoom suppression the other controls now
get, and the outer `<button>` — not the inner `<span>` — is the hit target.

```diff
- class="flex flex-1 flex-col items-center justify-center px-2 py-2"
+ class="flex flex-1 flex-col items-center justify-center px-2 py-2 select-none touch-manipulation"
```

---

## C. Tests

### Why these rotted, which decides where the tests go

**No tier this project runs uses a coarse pointer.** All three browser tiers —
`default`, `a11y`, `visual` — call the same `browserConfig()` and launch a
stock desktop Chromium, where `hover: hover` and `pointer: fine` match. The
e2e tier *is* a `Pixel 7` profile (`playwright.config.ts:44`), the one place
with a coarse pointer and touch, but it drives Gherkin journeys and never
asserts on chrome behavior.

So a mobile-first starter whose stated product is the app shell has no tier
that experiences the app the way its users do. Every convention in §B could rot
silently because *nothing was looking*. That root cause is worth more than any
single fix here, and it is what C5 addresses.

### The placement rule for this batch

Nearly every change above is "a declaration exists in a class string," and the
obvious test asserts the class string. `docs/testing-strategy.md` forbids that
— *"verify observable behavior through the public interface"*, *"no reaching
into component internals"* — and it is right to: a class-string assertion goes
red on a harmless rename and stays green when the CSS is broken. It is a change
detector aimed at the wrong thing.

The rule for this batch: **assert the computed effect, never the declaration.**
Three outcomes follow, and each picks its own tier.

1. Effect is measurable in a browser we already run → behavioral spec, `default`.
2. Effect exists only under a device condition → the tier that has the condition.
3. Effect is invisible to every tier we can afford → a static tripwire in
   `arch`, **labelled as a tripwire**, plus a line on the manual checklist.
   Never a spec that pretends to be behavioral.

And one pairing rule the project already uses — `boundaries.test.ts` feeds
ESLint deliberate violations, `a11yCoverage.test.ts` grades the a11y tier:
**one behavioral test that the mechanism works, one static tripwire that it is
applied everywhere.** A per-button spec does not scale to the next button
someone adds; a tripwire does not prove the mechanism. Where only one of the
two is worth having, say which and why.

### The plan

| # | What it asserts | Tier | Red today? |
| --- | --- | --- | --- |
| C1 | A sheet's last control is not flush against the bottom edge | `default` | **yes — 0px** |
| C2 | Whatever actually scrolls contains its overscroll | `default` | **yes** |
| C3 | Chrome is unselectable; prose and fields are not | `default` | partly |
| C4 | A sheet-open screenshot exists at all | `visual` | n/a (new baseline) |
| C5 | Controls clear 44px under a coarse pointer | `touch` (new) | **yes — 40px** |
| C6 | No raw `env(safe-area-inset-*)` outside the clamped utilities | `arch` | no |
| C7 | New controls cannot ship hover-only | `arch` | **yes** |
| C8 | The reduced-motion guard exists | `arch` | **yes** |

Nothing here belongs in the `unit` tier, and Stryker is scoped to that tier —
so **none of this work is graded by mutation testing**, by construction. Worth
knowing rather than discovering.

### C1 — the sheet keeps its bottom padding · `default`

The best test in the batch: it is behavioral, it names the bug precisely, and
it is red right now. Goes in the existing `dialogContent.spec.ts`, whose
`tallSheet` fixture already mounts a sheet with a Save button in it.

The weak form asserts `getComputedStyle(sheet).paddingBottom === '24px'`. The
strong form asserts what a user actually sees, and survives someone swapping
padding for a spacer element:

```ts
it('keeps its last control clear of the bottom edge with no home indicator', async ({
  tallSheet,
}) => {
  const { body, submit } = tallSheet
  body.scrollTop = body.scrollHeight
  await expect.element(submit).toBeInViewport()

  const sheet = document.querySelector('[data-slot="dialog-content"]')
  // env(safe-area-inset-bottom) is 0 here, exactly as on a flat-bottomed
  // phone — which is the case the clamp exists for.
  const gap = sheet.getBoundingClientRect().bottom - (await submit.element()).getBoundingClientRect().bottom
  expect(gap).toBeGreaterThanOrEqual(24)
})
```

Today this reports a gap of `0`. Copy this shape for anything spacing-related:
measure the distance a user perceives, not the property that produces it.

### C2 — the element that actually scrolls contains its overscroll · `default`

The bug was a *correct declaration on an element that never scrolls*, so a test
naming `<main>` would miss the next instance of it. Ask the DOM which element
scrolls, then hold that element to the rule:

```ts
function scrollContainers(root: Element): Array<Element> {
  return [...root.querySelectorAll('*')].filter((el) => {
    const overflowY = getComputedStyle(el).overflowY
    return overflowY === 'auto' || overflowY === 'scroll'
  })
}

it('contains overscroll on every scroll container in the shell', async ({ notes }) => {
  const containers = scrollContainers(notes.root)

  // Without this, the test passes when the shell has no scroller at all —
  // the a11yCoverage lesson: a green check means nothing until you know it
  // would go red.
  expect(containers.length).toBeGreaterThan(0)

  for (const el of containers) {
    expect(getComputedStyle(el).overscrollBehaviorY).toBe('contain')
  }
})
```

This would have failed on MacroTracker too, without modification. That is the
sign it is aimed at the bug class rather than the instance.

### C3 — chrome is unselectable, prose and fields are not · `default`

A double-click selects a word; under `user-select: none` it selects nothing.
That makes all three assertions behavioral, with no class string in sight.
`userEvent.dblClick` is available in this tier (verified in
`@vitest/browser/context.d.ts:218`).

```ts
await userEvent.dblClick(tabLabel)
expect(window.getSelection()?.toString()).toBe('')      // chrome: nothing

await userEvent.dblClick(noteBody)
expect(window.getSelection()?.toString()).not.toBe('')  // prose: a word

await userEvent.dblClick(input)
expect(input.selectionEnd).toBeGreaterThan(input.selectionStart)  // fields still edit
```

**Assertions two and three pass before the change as well as after**, which
normally means a test is not earning its place. These earn it anyway, because
they go red on the *plausible wrong implementation* — global `user-select:
none` with no exemption — which is exactly the iOS caret bug in B4's gotcha. A
test that only catches the bug you already fixed is worth less than one that
catches the mistake you are about to make.

Put the locators on the screen objects (`AppScreen` already owns the tab bar),
not in the spec.

### C4 — a baseline with a sheet open · `visual`

Worth stating plainly: **A1 shipped because no baseline has a sheet in it.**
Zero bottom padding on every sheet in the app is visually obvious, and the
visual tier missed it because both baselines are the notes screen with the
sheet closed.

Add a third baseline with the quick-add sheet open. It costs one screenshot and
covers the whole class of sheet-geometry regressions that C1 only spot-checks.

### C5 — a coarse-pointer project · new `touch` tier

The `pointer-fine:` collapse in B1 cannot be verified anywhere we currently
run: `matchMedia` is read-only from inside the page, so a coarse pointer has to
come from the browser context. The provider supports it —
`@vitest/browser-playwright` accepts `contextOptions`
(`dist/index.d.ts:28`), and `hasTouch` + `isMobile` are what make Chromium
report `pointer: coarse`.

```ts
// vitest.config.ts — a fifth project
{
  plugins, resolve, optimizeDeps: optimizeDependencies,
  test: {
    ...sharedTestConfig,
    name: 'touch',
    include: ['src/__tests__/touch/**/*.spec.ts'],
    browser: {
      ...browserConfig('touch-browser'),
      // The whole point of the tier: Chromium reports `pointer: coarse`
      // only under touch emulation, and no other tier does.
      provider: playwright({
        contextOptions: { hasTouch: true, isMobile: true },
      }),
    },
  },
}
```

Then the assertion that could not be written before:

```ts
it('clears the 44px floor on a touch device', async ({ notes }) => {
  expect(matchMedia('(pointer: coarse)').matches).toBe(true)  // the tier is real
  for (const tab of notes.tabs) {
    expect(tab.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  }
})
```

**Cost, honestly:** one more Chromium boot in CI. **Why it is still right:** a
mobile-first starter with no coarse-pointer tier is how all fourteen findings
survived, and this tier is the reusable home for every mobile convention added
after this spec. It pays for more than the two assertions it opens with.

Note the a11y tier does *not* cover this: axe's `target-size` rule uses the
WCAG 2.2 AA floor of 24×24, and our floor is the 44px HIG one. A 40px button
satisfies axe and fails us.

### C6–C8 — static tripwires · `arch`

These live in `src/__tests__/architecture/` beside `uiPrimitives.test.ts` and
inherit its two house rules: **text-level checks, not a full parse**, and
**every helper is exercised against a synthetic violation as well as the real
tree** — a rule that only ever sees passing input is not a rule. Budget for the
synthetic fixtures; they are half the work of each one.

- **C6 — no raw `env(safe-area-inset-*)`.** Scan `src/**/*.{css,vue,ts}`, allow
  it only inside the three `@utility` blocks in `src/style.css`, fail pointing
  at `safe-area-bottom` / `-top` / `-x`. This is the A1 bug class made
  unrepeatable.
- **C7 — no hover-only controls.** Scan `.vue` for elements carrying `@click`
  or `type="button"` whose class string has a `hover:` but no `active:`.
  Deliberately narrow: catching a new control that ships mouse-only, not
  grading every div. Expect a small allowlist with a reason per entry, the way
  `A11Y_SKIPPED` does it.
- **C8 — the reduced-motion guard exists.** Assert `src/style.css` contains a
  `prefers-reduced-motion: reduce` block. Say in the file comment that this is
  a presence check, not a behavioral one.

**Why press feedback gets a tripwire and no behavioral test.** `:active` is
UA-driven and cannot be dispatched; `userEvent` has `click`, `dblClick` and
`hover` but no pointer-hold, so there is no clean way to hold a press in this
tier. `cdp()` is exported but typed as an empty interface, so using
`Input.dispatchMouseEvent` would mean an untyped call — too clever for a
starter's suite. That is the practical reason. The better reason is that
asserting `active:scale-97` visibly scales an element is **testing Chromium,
not testing us**. What can actually rot is coverage — the next button that
ships hover-only — and coverage is exactly what a static rule catches. C7 is
the right and complete answer here, not a compromise.

**Why reduced motion stays a tripwire too.** A behavioral check needs
`contextOptions: { reducedMotion: 'reduce' }`, i.e. a *second* new project —
and folding it into `touch` would conflate two conditions so a failure could
not say which one it was. Not worth it for one assertion today. Documented
upgrade path, not a silent omission.

---

## D. Docs

`docs/index.md` is the single copy of the rules — *"an agent that changes a
rule changes it here."* This work adds six conventions that need reasoning
behind them, which is more than a bullet.

- **New:** `docs/touch-conventions.md`, OKF frontmatter, `type: Convention`.
  Covers: press feedback before completion feedback; touch-first sizing
  collapsed for fine pointers; suppress document behavior and grant it back;
  clamp every environment value; never draw an unwired affordance.
- **Edit:** `docs/index.md` — add the row to the concept table, and add a
  `Critical conventions` bullet pointing at it.
- **Edit:** `docs/ui-components.md` — the button base and its `pointer-fine:`
  collapse are now part of the primitive contract that C7 enforces.
- **Edit:** `docs/testing-strategy.md` — the tier table gains a seventh row
  (`touch`), and the "which tier does my test belong in?" list gains the
  coarse-pointer branch. This is a change to the tiering itself, so it is not
  optional documentation.

---

## E. Verification

```bash
pnpm check          # lint + format + types + knip + unit + arch — must be green
pnpm test           # browser tier (C1, C2, C3)
pnpm test:touch     # new coarse-pointer tier (C5) — add the script with the project
pnpm test:a11y      # light + dark sweeps + ARIA snapshots
pnpm test:visual    # baselines, including the new sheet-open one (C4)
```

**Write the tests before the fixes for C1, C2 and C5.** All three are red
today, and watching them go red for the stated reason — a `0` gap, a missing
`contain`, a 40px tab — is the only evidence that they test the thing they
claim to. C6–C8 cannot be written first (their subject does not exist yet), so
they get the synthetic-violation fixture instead; that is the same evidence by
another route, and it is why `uiPrimitives.test.ts` insists on it.

**Expected impact on the existing tiers:**

- **Visual baselines: no change to the two current ones.** Chromium reports
  `pointer: fine`, so B1's sizes collapse to today's values; `active:`,
  `select-none` and `touch-manipulation` do not affect a static screenshot;
  `env()` is 0. *A diff means something resolved differently than reasoned
  above — read it before rebaselining, do not `--update` reflexively.* The
  sheet-open baseline in C4 is new and needs generating deliberately.
- **ARIA snapshots: no change.** No DOM structure moves. The `<main>` class
  binding in B3 is conditional on `hideNav`, which no current route sets.
- **No existing test couples to a class string** — checked; there are no
  `toHaveClass` or `getComputedStyle` assertions anywhere in `src/__tests__/`.
  C1, C2 and C5 will be the first `getComputedStyle` / geometry assertions in
  the repo. That is a deliberate new idiom, so it belongs in
  `docs/vitest-practices.md` alongside the viewport-assertion note that
  `dialogContent.spec.ts` already earned.

**What no tier can tell us.** `env()` is 0 in every headless Chromium, so B3's
insets are unverifiable in CI by construction; overscroll *chaining* needs a
real gesture, so C2 checks the property rather than the behavior; and the iOS
caret bug reproduces on no desktop browser at all. Before calling this done,
drive it per `docs/agent-browser.md` in a mobile device profile and confirm by
hand:

1. A sheet opened on a flat-bottomed profile has visible bottom padding (A1).
2. Scrolling an inner list to its end does not move the page behind it (A2).
3. Buttons and tabs visibly depress on `pointerdown`, not on release (B1, B2).
4. Long-pressing a list row produces no selection highlight and no callout,
   and tapping into a text field still places a caret (B4).
5. With reduced motion on, the sheet appears without sliding (B5).

Item 4's second half is the one that will not fail loudly. Check it explicitly.

---

## F. Out of scope — sequenced, not dropped

- **reka-ui `Drawer` migration.** Wires the grabber for real: drag-to-dismiss,
  velocity, snap points, all already in `node_modules`. Keep `useKeyboardInset`
  when it happens — feeding `--keyboard-inset` into the drawer's max-height is
  better than what either reference app does, and it is ours.
- **`black-translucent` status bar.** Only after B3. Shipping it first puts
  every header under the clock.
- **Install surface.** Manifest `id` / `display_override` / `launch_handler` /
  `shortcuts` / `screenshots`; the parse-time splash; `apple-mobile-web-app-title`.
- **One source of truth for brand colour.** `index.html:13–14` and
  `themeColor.ts:6–9` mirror `--background`; `vite.config.ts:32` mirrors
  `--primary` and its comment says so. Manifest `theme_color` tints OS chrome —
  the task-switcher card, the Android status bar — so it should match the
  surface we paint, not the accent we paint on it. Three files, one category
  error; fix them together or not at all.
- **Consolidating the two header systems.** `SettingsView.vue:106` uses
  `PageLayout`; `NotesView.vue:68` hand-rolls an `<h1>`. A maintenance problem
  rather than a feel problem — but it is why B3's inset decision had to be
  reasoned rather than copied.
- **Haptics, swipe-to-action rows, scroll restoration, tap-active-tab-to-top.**
  Stage 2+ of the teardown. Worth noting that scroll restoration cannot use
  Vue Router's `scrollBehavior` here: that drives the window, and our scroller
  is `<main>`.

---

## Commit plan

Five commits, each independently revertable, and the first is tests-only:

1. `test(shell): pin the sheet inset and overscroll containment` — C1, C2,
   **committed red**, so the fix commit has something to turn green.
2. `fix(shell): clamp the safe-area inset and contain main's overscroll` — §A1,
   §A2, §A3. Turns commit 1 green.
3. `test: add a coarse-pointer tier` — C5's project, `pnpm test:touch`, the
   44px spec (red), and the `docs/testing-strategy.md` row.
4. `feat(shell): answer every touch` — §B1–B6, plus C3 and C4. Turns commit 3
   green.
5. `test(arch): enforce the touch conventions` — C6–C8 with their synthetic
   fixtures, plus the rest of §D.

Two constraints drove this split. The gotcha in B4 is why §B is one commit and
not six — the global `user-select` and the field exemption must never exist
apart. And commits 1 and 3 are separate from their fixes so the red is a
recorded fact in history rather than a claim in a spec: `git show` on either
proves the test was capable of failing.

Commit 1 breaks `main` if pushed alone. Either land 1–2 together or mark the
specs `.fails()` — the former is simpler and the pre-commit gate does not run
the browser tiers anyway.
