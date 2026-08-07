# Testing strategy

Six tiers, each answering a different question. The point of the tiers is **placement**: every test has exactly one right home, and the cheap tiers stay fast enough to run constantly.

## The tiers

| Tier | Command | Runtime | Question it answers |
| --- | --- | --- | --- |
| unit | `pnpm test:unit` | Node, ~100 ms | Is the pure logic right? |
| default | `pnpm test` | Real Chromium (Vitest browser mode) | Do components and features behave, wired together? |
| a11y | `pnpm test:a11y` | Real Chromium + axe-core | Are rendered screens accessible? |
| visual | `pnpm test:visual` | Real Chromium screenshots | Did the UI change when I didn't mean it to? |
| arch | `pnpm test:arch` | Node + ArchUnitTS/ESLint | Are the layer boundaries intact, and does the enforcement fire? |
| e2e | `pnpm test:e2e` | Playwright against the **production build** | Does the shipped artifact work end to end? |

## Which tier does my test belong in?

Work down this list and stop at the first match:

1. **Pure function, no DOM, no IndexedDB?** → `unit` (`src/__tests__/unit/`). This tier runs in the pre-commit hook, so it must stay in the hundreds of milliseconds. Extract logic out of components into plain `.ts` modules (see `src/features/notes/domain.ts`) precisely so it can live here.
2. **Needs a rendered component, the router, or the database?** → `default` (`src/__tests__/<area>/`). Browser mode means real CSS, real events, real browser APIs — no jsdom approximations. IndexedDB is replaced by fake-indexeddb per test file for speed and isolation.
3. **Asserting on accessibility?** → `a11y` (`src/__tests__/a11y/`). Axe sweeps whole rendered screens; per-control a11y (labels, roles) belongs in the `default` specs that exercise the control. Rules axe classifies as page-level (landmark structure, `region`, `page-has-heading-one`) are skipped when the sweep is scoped to a container, so `assertNoPageLevelViolations` runs them against the document instead. `html-has-lang` and `document-title` are not among them — in this tier they would grade the Vitest runner's page, so the shipped index.html is checked in e2e.
4. **Asserting nothing changed visually?** → `visual` (`src/__tests__/visual/`).
5. **Asserting an import boundary or dependency rule?** → `arch` (`src/__tests__/architecture/`). Two things live there: ArchUnitTS rules over the real module graph, and `boundaries.test.ts`, which feeds ESLint deliberate violations. The second exists because ArchUnitTS does not parse `.vue` files and because "the codebase has no violations" also passes when nothing is being enforced — the actual `.vue` coverage comes from `no-restricted-imports` in `eslint.config.ts`.
6. **Proving a user journey against what actually ships (service worker, real IndexedDB, production bundle)?** → e2e (`test/e2e/`, Gherkin + playwright-bdd). Keep these few and load-bearing — the offline-reload scenario is the canonical example: it cuts the network before reloading, so it fails unless the service worker precached the shell.

## Test quality bar

- Verify observable behavior through the public interface — what a user or caller sees.
- Mock only at system boundaries (time, randomness, network). Never mock internal collaborators; the browser tier exists so you don't have to.
- No call-count/order assertions, no reaching into component internals.
- Every test file resets its own state (`beforeEach(resetAppState)`) — order independence is non-negotiable.

## The visual tier and its baselines

Screenshot baselines live in `__screenshots__/` and are **platform-specific** (font rendering differs between macOS and Linux). The tier is a local tool by default and is deliberately not in CI:

- After an intentional UI change: `pnpm test:visual:update`, review the diff, commit the new baselines.
- To enable it in CI: run the tier once in a CI job with `--update`, download the Linux baselines as an artifact, commit them, then add a CI job mirroring the a11y one.

## Where the gates run

- **Every commit** (husky, ~15 s): lint-staged, type-check, `test:unit`, knip.
- **Before pushing**: `pnpm lint:check` and `pnpm format:check`, plus the tiers your change touches. Formatting on commit only reaches staged files, so `format:check` is the CI gate that catches the rest.
- **CI on every PR**: everything, with the browser tier sharded (`.github/workflows/ci.yml`).

The principle: the cost of a check should match how often it runs. Fast checks run on every commit; minutes-long tiers are CI's job.
