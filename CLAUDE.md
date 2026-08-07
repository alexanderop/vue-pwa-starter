# CLAUDE.md

## What this is

A local-first Vue 3 PWA starter template. Data lives in the browser (Dexie/IndexedDB) — no backend, no accounts. Mobile-first: the app shell, safe-area handling, and keyboard-aware sheets are the product. The `notes` feature is a worked example meant to be copied and then deleted.

When in doubt about a design call: does it keep interactions instant and the data on-device?

## Commands

```bash
pnpm dev            # Dev server
pnpm test:unit      # Node unit tier — pure logic, ~100 ms
pnpm test           # Browser tier (Vitest browser mode)
pnpm test:a11y      # axe-core sweeps
pnpm test:visual    # Screenshot comparisons (test:visual:update to rebaseline)
pnpm test:arch      # ArchUnitTS boundary rules
pnpm test:e2e       # playwright-bdd against the production build
pnpm lint           # oxlint + eslint + markdownlint (fix mode; lint:check to verify)
pnpm type-check     # vue-tsc --build
pnpm knip           # Dead exports
pnpm build          # Production build (+ pnpm size-limit for the budget)
```

## Critical conventions

- **State**: VueUse `createGlobalState()` for shared stores — NOT Pinia. Stores expose `$reset()` for tests.
- **DB**: all access via `src/db/index.ts` repositories. Schema changes need a version bump + `upgrade()` + converter update — see `src/db/schema.ts` for the worked v1→v2 example and docs/local-first.md for why both.
- **Features never import other features**; shared layers never import features. Enforced by `src/__tests__/architecture/`.
- **Two-way binding**: `const open = defineModel<boolean>('open')`.
- **i18n**: every user-facing string in `src/i18n/messages/en.ts` and `de.ts`; the schema type makes missing keys a compile error.
- **Tests are not colocated**: they live in `src/__tests__/`, mirroring the source tree. Which tier a test belongs in: docs/testing-strategy.md.
- Keep logic in `.ts` modules, not `<script setup>` — that is what makes it unit-testable and visible to the arch tests.

## Git workflow

Conventional Commits with scope (`feat(notes): …`). The husky pre-commit gate (~15 s) runs lint-staged, type-check, test:unit, and knip on every commit — do not bypass it with `--no-verify`. Browser/a11y/visual/e2e tiers are CI's job (`.github/workflows/ci.yml`); run the ones your change touches before pushing.
