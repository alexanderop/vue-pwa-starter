---
type: Convention
title: Vitest practices
description: The Vitest 4 APIs this project standardises on — fixtures over lifecycle hooks, defineHelper on every assertion helper, ARIA snapshots, tags, and viewport assertions — and the ones deliberately left alone.
tags: [testing, vitest, fixtures, snapshots, browser-mode]
status: stable
---

# Vitest practices

[testing-strategy.md](testing-strategy.md) decides *which tier* a test belongs
in. This decides *how it is written* once it is there. Everything below is
Vitest 4.1, which is what the project is pinned to (`vitest` in the `testing`
catalog); the version each API landed in is noted so a downgrade is a decision
rather than a surprise.

## Fixtures, not lifecycle hooks

**Rule: a browser-tier spec declares what it needs and gets it. It does not
mount, and it does not clean up.**

```ts
import { describe, expect } from 'vitest'
import { it } from '../fixtures'

it('creates a note through the center FAB', async ({ notes }) => {
  await notes.addNote({ title: 'Buy milk' })
  await notes.expectNote('Buy milk')
})
```

`src/__tests__/fixtures.ts` is the browser tiers' `it`, the counterpart of
`test/e2e/fixtures.ts` on the Playwright side. A fixture owns the whole
lifecycle — reset the app state, mount, unmount when the test ends — which is
what removed this from every browser spec:

```ts
// What a spec used to open with, and no longer does.
let notes: NotesScreen | undefined
beforeEach(resetAppState)
afterEach(() => {
  notes?.close()
  notes = undefined
})
```

That block was not just noise. The mutable `notes` had to be typed
`| undefined` because the hook could not know whether the test had assigned
it yet, so every use was an optional chain, and a spec that forgot the
`afterEach` leaked a mounted app into the next test with nothing to catch it.
A fixture has no such gap: the teardown is registered by the same code that
did the setup.

Three properties are worth knowing:

- **Fixtures are lazy.** A test that never names `notes` never mounts it. That
  is why one spec file can mix `notes` and `settings` without paying for both,
  and why extending the shared `it` in a spec that uses none of its fixtures
  costs nothing.
- **Use the builder syntax** — `.extend('name', async ({}, { onCleanup }) => …)`,
  Vitest 4.1 — rather than the Playwright-compatible object form. The fixture
  type is inferred from what the function returns, so there is no second copy
  of the type to keep in step. The empty `{}` first parameter is not
  decorative: Vitest parses it to learn which fixtures this one depends on, so
  it cannot be renamed to `_context`. `no-empty-pattern` is configured for
  `src/__tests__/**` in `.oxlintrc.json` for exactly that reason.
- **`onCleanup` may be called once per fixture.** Two teardowns means two
  fixtures — which is the better shape anyway, since it makes the dependency
  explicit.

### Where a fixture lives

| Scope | Home |
| --- | --- |
| An app screen every tier drives | `src/__tests__/fixtures.ts` (`notes`, `settings`, `theme`) |
| A harness for one spec | That spec file, extending the shared `it` |

`components/appShell.spec.ts` (a stub router and a component in isolation) and
`components/ui/dialog/dialogContent.spec.ts` (a tall sheet under a simulated
keyboard) are the worked examples of the second row. Neither harness means
anything outside its file, so neither belongs in the shared module — but both
still extend the shared `it`, so there is one import to remember.

## Every assertion helper is wrapped in `vi.defineHelper`

**Rule: a function that calls `expect` on behalf of a spec is defined with
`vi.defineHelper` (4.1).**

The wrapper strips the helper's own frames from the stack, so the failure is
reported at the line in the spec that asked for it. Without it, every a11y
failure in the suite points at the same `expect` inside `helpers/a11y.ts`,
whichever screen produced it. The more behaviour a helper or page object
absorbs, the worse that gets — which would otherwise be an argument against
page objects rather than a solved problem.

**It does not matter for every assertion, which is why the rule is uniform.**
Measured against 4.1.10, a cross-file helper reports its failure at:

| Assertion in the helper | Unwrapped | With `defineHelper` |
| --- | --- | --- |
| `expect(value).toEqual(…)` | inside the helper | the spec's call site |
| `expect.poll(…).toBe(…)` | inside the helper | the spec's call site |
| `expect.element(…).toBeVisible()` | the spec's call site already | unchanged |

So the browser runner already attributes locator assertions correctly, and
wrapping `expectNote` changes nothing today — while `NotesScreen.expectOrder`
(a poll) and both axe helpers (plain `expect`) genuinely need it. Wrapping
all of them means adding an assertion never requires knowing which of the two
kinds you just wrote, and never quietly regresses the stack when a locator
assertion grows a plain one beside it.

This is why the `expect*` members of a screen object are **fields, not
methods**:

```ts
readonly expectNote = vi.defineHelper(async (title: string): Promise<void> => {
  await expect.element(this.note(title)).toBeVisible()
})
```

Locators and actions stay ordinary methods. Only the assertions need the
stack rewrite.

## ARIA snapshots for structure, axe for violations

`src/__tests__/a11y/` holds two different questions, and they do not overlap:

- **`a11y.spec.ts`** — axe-core sweeps. Catches what axe can *name*: an
  unlabelled control, insufficient contrast, a broken landmark.
- **`ariaStructure.spec.ts`** — `toMatchAriaSnapshot` (4.1.4, experimental).
  Catches structure quietly disappearing: a `<nav>` that becomes a `<div>`, a
  heading that drops a level, a dialog that loses its accessible name. Axe
  reports no violation for any of those — nothing is *wrong*, the semantics
  are simply gone.

A baseline is the accessibility tree as text, which is the form a screen
reader consumes and a reviewer can actually read in a diff:

```text
- navigation "Main navigation":
  - button "Notes"
  - button "Add a note"
  - button "Settings"
```

Unlike the visual tier's screenshots these are platform-independent, so they
cost nothing to keep in CI. Two rules keep them honest:

- **Scope them to a region whose semantics are a promise** — navigation,
  dialogs, forms. A snapshot of the whole app root gets re-recorded on every
  copy change, and a baseline nobody reads is a baseline nobody trusts.
- **Rebaseline deliberately**: `pnpm test:a11y -- --update`, then read the
  diff. A structure change that surprises you is the test doing its job.

## `toBeInViewport` when the claim is reachability

`toBeVisible` asserts the CSS notion of visible. It passes for an element
clipped by an ancestor's scroll region — present, laid out, and completely
unreachable on the device. When the thing being proved is that a user can
actually get to a control, the assertion is `toBeInViewport` (4.0), which
measures the intersection through the ancestor chain:

```ts
await expect.element(submit).not.toBeInViewport()
body.scrollTop = body.scrollHeight
await expect.element(submit).toBeInViewport()
```

This matters more here than in most apps: keyboard-aware sheets are the
product, and "the Save button is below the fold with the keyboard open" is the
failure mode the dialog primitive exists to prevent. `QuickAddSheet.expectReady`
uses it too, so the wait that gates every quick-add interaction means *usable*
rather than merely *rendered*.

## Retries are narrow, and tagged

The browser projects retry on CI only, and only for errors that are the
browser rather than the app — a lazy chunk that did not arrive, a page torn
down mid-run. That narrowing is the `condition` option (4.1):

```ts
retry: process.env.CI
  ? { count: 2, delay: 250, condition: /Failed to fetch dynamically imported module|…/i }
  : 0
```

A blanket retry is worse than none: a failed assertion fails the same way the
second time, so all it buys is a slower red — and if it *does* pass on the
retry, a real race has just been hidden. Locally there is no retry at all,
because a flake is a thing to look at.

**Tags** (4.1) carry the options for a category of test that cuts across the
tiers:

```ts
it('creates a single note when submitted twice', { tags: ['flaky'] }, async ({ notes }) => { … })
```

Tags are defined once in `vitest.config.ts` and inherited by every project;
`strictTags` defaults to on, so a typo is an error rather than a silently
untagged test. `src/__tests__/vitest.d.ts` augments `TestTags` so it is a
compile error too.

**A tag has to earn itself.** Reach for one only when the category cuts across
the tiers and carries runner options:

| If the grouping follows… | Use |
| --- | --- |
| a directory | a project — that is what the tiers already are |
| a test name | `-t` / `--testNamePattern` |
| a cross-cutting category with shared timeout/retry | a tag |

`flaky` is the only tag today, and it is applied to exactly one test. Do not
add `frontend`/`backend`-style tags that restate the tier structure — filter
by project instead.

## The console is asserted on

Every browser tier fails on an unexpected `console.warn` or `console.error`.
The gate is installed once in `src/__tests__/setup.ts` — nothing per spec.

It is there because a whole class of Vue mistake is reported this way and no
other: a missing required prop, a prop of the wrong type, a `v-model` pointed
at nothing, a duplicate `v-for` key, a component that resolved to nothing.
None of it throws. Without the gate, a spec renders a broken component, finds
the text that still made it to the screen, and passes — and so does the next
twenty.

Two consequences when writing a spec:

- **If a test you expect to pass fails on a warning, the warning is the bug.**
  It was there before; it just had nowhere to be reported.
- **A spec that provokes a warning on purpose** — proving a component rejects
  bad input, say — asserts on it rather than tolerating it: read the spy in the
  test itself. Do not widen the allowlist in `helpers/consoleGate.ts` for one
  spec. That list is for noise from the harness and from libraries, each entry
  a specific pattern with the reason it is not a defect; `/Vue warn/` would
  switch the gate off while looking like configuration.

The console still prints — `vi.spyOn` wraps the method, it does not replace
it — so the output is there when a failure needs reading.

## What we deliberately do not use

Recorded so the question does not get re-opened every few months.

- **`aroundEach` / `aroundAll` (4.1)** — for wrapping a test in a *context*: a
  database transaction, an `AsyncLocalStorage` scope, a tracing span. Nothing
  here needs to straddle the test that way; a fixture's `onCleanup` covers the
  setup/teardown case and reads better.
- **`locators.extend` (3.2)** — custom locators like `page.getByNoteCard(…)`.
  The screen-object classes already own that vocabulary. Worth revisiting only
  if a domain query needs locator chaining or strict-mode protection.
- **`context.annotate` (3.2)** — attaching axe violation payloads or trace
  paths to the reporter. The current failure messages are already readable;
  this is the tool if they stop being.
- **`test.scoped`** — deprecated in favour of `test.override` (4.1). Neither is
  in use.
- **`expect.schemaMatching`, `mock.mockThrow`** — documented on the Vitest site
  under a 4.x badge, but not present in 4.1.10. Do not plan around them.
