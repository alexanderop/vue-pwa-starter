---
type: Convention
title: Storybook component contracts
description: Storybook is the state catalogue and executable test home for isolated UI components, with explicit boundaries for tests that need the app, platform, snapshots, or production build.
tags: [storybook, components, testing, accessibility, interaction-testing]
status: stable
sources:
  - resource: https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
    id: storybook-vitest-addon
    title: Storybook Vitest addon
  - resource: https://storybook.js.org/docs/writing-tests/accessibility-testing
    id: storybook-accessibility-testing
    title: Storybook accessibility tests
---

# Storybook component contracts

Storybook is the canonical test home for an isolated rendered component. A
story names a state a reviewer can inspect; its `play` function makes the
state executable. The Vitest addon turns every story into a real Chromium
smoke test, runs every `play` assertion, and runs axe because
`.storybook/preview.ts` sets `a11y.test` to `error`.

Do not keep a parallel `src/__tests__/components/**` spec for a contract a
story can prove faithfully. Two files that mount the same component and assert
the same public behaviour are two catalogues that can drift.

## What belongs in a story

Use named stories for props, slots, variants, empty/loading/disabled states,
long content, and responsive states. Add `play` when the contract needs an
assertion:

- pointer and keyboard interaction, focus, disabled behaviour and emitted
  state;
- roles, accessible names, descriptions and ARIA state;
- resolved geometry, computed CSS, overflow, clipping, portal placement and
  hit testing;
- memory-router behaviour owned by the component;
- production timers owned by a component-facing store;
- a coarse-pointer branch, tagged `touch`, when the component owns that
  branch.

Query through `within(canvasElement)` and accessible roles/names. A portalled
element is queried through `within(canvasElement.ownerDocument.body)`. Raw DOM
is reserved for contracts the query layer cannot express: geometry, computed
style, hit testing, IDREF resolution, animation presence, and element identity.

One contract story may use the `step` callback to name several assertions that
share one rendered state. Prefer separate named stories when the initial state
or user journey differs. Axe already runs for every story; do not call it again
inside `play`.

## What the catalogue is organised into

`storySort` in `.storybook/preview.ts` fixes the order, and each section
answers a different question:

| Section       | Answers                                                       |
| ------------- | ------------------------------------------------------------- |
| `Foundations` | What the tokens are, rendered from the live custom properties |
| `Guidelines`  | *When* to reach for something — what a props table cannot say |
| `Components`  | What each component's states are, per atomic-design tier      |
| `Patterns`    | How to assemble a screen out of them                          |
| `Features`    | The worked example, composed                                  |
| `Screens`     | Whole routes                                                  |

`Guidelines` pages are MDX and link to the markdown conventions rather than
restating them — a rule that exists in two files is a rule that will drift.
They render demonstrations through `<Story of={…} />`, so what a reader sees is
the real component and not a copy of it.

A `Patterns` story composes existing components only. A pattern that needs a
new component means that component belongs in `Components`.

## The catalogue opens at 390 px

`initialGlobals` sets the mobile viewport, matching what CI grades. Before that
line existed the two disagreed: the touch project ran at 390 px while a human
browsing the catalogue saw desktop width, so a responsive rule could be green
in CI and visibly wrong in the tool built to inspect it.

A consequence worth knowing: a story asserting the *wide* half of a responsive
rule must name its viewport with story-level
`globals: { viewport: { value: 'desktop' } }`. Inheriting it was what made
`MoleculeDialogFooter`'s row layout stop being tested the day the default
changed.

## Two design aids that are not evidence

The toolbar carries `frame` (a phone bezel with notched safe-area insets) and
`keyboard` (a simulated on-screen keyboard height). Both default to **off**,
and all three Vitest Storybook projects leave them off — the touch project
asserts 44 px geometry and the visual tier holds pixel baselines, so a frame
that changed layout by default would silently move both.

The frame works because the `safe-area-*` utilities clamp `env()` against
`--safe-top-min` / `--safe-bottom-min`: `env()` cannot be faked, but the floor
beneath it can. It paints *over* the story rather than wrapping it in a box,
because `dvh` resolves against the viewport and a fixed-height frame sliced the
bottom off every `h-dvh` component put inside it.

Neither is proof. They show that a component reserves space when told to; they
cannot show that iOS reports the inset, that the status bar overlays the right
strip, or that a real keyboard resizes the visual viewport the way
`useKeyboardInset` expects. **Real safe areas and real on-screen keyboards stay
on the manual device checklist**, unchanged.

## The matrix

`pnpm test:storybook` runs three Vitest projects:

- light Chromium for every story carrying the inherited `test` tag;
- dark Chromium for the same stories, so axe sees both palettes;
- touch-emulated Chromium for stories tagged `touch`, with `hasTouch`,
  `isMobile`, and a 390 by 844 viewport.

A narrow viewport is documentation, not touch emulation. A contract that reads
`(pointer: coarse)` must carry the `touch` tag and assert that the media query
matches before asserting the branch.

The Storybook Test panel exposes only the light project because the addon gives
projects using one config directory the same panel identity. CLI and CI retain
the full matrix. `pnpm build:storybook` and `pnpm test:storybook` both run in
CI.

## What stays outside Storybook

A standalone test remains only when isolation would replace or omit the thing
being proved:

| Contract                                                          | Home                           |
| ----------------------------------------------------------------- | ------------------------------ |
| Pure logic, schemas and properties                                | `src/__tests__/unit/`          |
| IndexedDB writes or a feature journey through the real app        | default browser tier           |
| Page-level axe rules and stable accessibility-tree snapshots      | a11y tier                      |
| Cross-screen touch conventions                                    | touch/default boundary specs   |
| Real browser-platform events and adapters                         | focused platform/default specs |
| Service worker, reload persistence, offline and production bundle | e2e                            |
| Import, catalogue and source-tree completeness                    | architecture tier              |
| Pixel regression                                                  | visual tier                    |
| Real safe areas and on-screen keyboards                           | manual device checklist        |

Three files deliberately remain under `src/__tests__/components/`:

- `atoms/atomSwitch.spec.ts` contains only the ARIA inline snapshot, because
  the Storybook Vitest addon does not expose Vitest Browser's ARIA snapshot
  matcher;
- `organisms/pwaInstall.spec.ts` drives the real `beforeinstallprompt`
  boundary and persistence, while Storybook deliberately aliases that
  composable to a controllable story adapter;
- `touchConventions.spec.ts` grades selection and overscroll across the app,
  not one isolated component.

`architecture/storybookCoverage.test.ts` holds both sides of the rule: every
component/view owns its story catalogue, migrated interactive catalogues keep
a `play` function, and no new standalone component spec appears outside those
exceptions. It also keeps `src/__tests__/touch/` to the two app-composed
contracts (`sheetFocus.spec.ts` and `touchTargets.spec.ts`), so an isolated
coarse-pointer assertion cannot drift into a parallel touch spec.

## Visual and snapshot boundaries

This repository does not install Storybook's Chromatic Visual Tests addon.
Stories therefore provide rendered states, interaction assertions and axe, but
not pixel baselines. Whole-app pixel baselines stay in `pnpm test:visual`.

ARIA snapshots stay scoped and deliberate in Vitest. Do not add DOM snapshots
for every story: markup snapshots are noisy, and neither prove appearance nor
focused behaviour.

## Adding or changing a component

1. Add or update its colocated `.stories.ts` state catalogue. A compound
   primitive owns one provider-tree story file, not one file per part.
2. Put isolated public contracts in named stories and `play` functions.
3. Tag a coarse-pointer-only contract `touch`.
4. Add a separate test only if the contract matches one boundary in the table
   above; state the boundary in the file comment.
5. Run `pnpm test:storybook`, then the non-Storybook tier only when the change
   crosses into it.
