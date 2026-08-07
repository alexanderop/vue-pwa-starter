# Adding a feature

The notes feature (`src/features/notes`) is the worked example — this walkthrough maps its pieces so you can copy the pattern. Build in this order; every step has a test home.

## 1. Storage (if the feature persists data)

- Add the table to `src/db/schema.ts`. New table on a fresh install → just add it to the **current** version's `stores()`. Changing an existing table → bump the version, write an `upgrade()`, and widen the `Stored*` type (see the v1→v2 example).
- Add a converter in `src/db/converters.ts` — reads must produce complete domain objects from any historical shape.
- Add a repository in `src/db/repositories/` and re-export it from `src/db/index.ts`. Nothing outside `src/db` may import deeper than the index (the arch tests will fail your PR if it does).
- Add the table to `src/db/backup.ts` in the same commit.
- **Tests**: converter → unit tier; repository CRUD + backup round-trip → `src/__tests__/db/`.

## 2. Domain logic

Pure functions in `src/features/<name>/domain.ts` (sorting, deriving, validating). Keeping them out of components is what makes them unit-tier testable — `src/features/notes/domain.ts` and its spec in `src/__tests__/unit/notes/` are the template.

## 3. State

A store per feature with VueUse `createGlobalState()` — `src/features/notes/useNotesStore.ts` is the template. Conventions:

- The store is the only writer; every mutation calls the repository, then re-reads, so state always mirrors disk.
- Expose a `$reset()` for test isolation and add it to `src/__tests__/helpers/reset.ts`.
- Why not Pinia? Nothing here needs devtools time-travel or plugins; `createGlobalState` is a plain composable — less API, same reactivity, trivially testable.

## 4. UI

- Feature-owned components in `src/features/<name>/components/`. Features never import from other features — shared pieces go to `src/components/` (once they have 2+ consumers).
- Route-level page in `src/views/`, registered in `src/router/index.ts`.
- New tab? Add one entry to `src/router/navigation.ts` — the shell handles the rest. Full-screen route? `meta: { hideNav: true }`.
- Every user-facing string goes through i18n (`src/i18n/messages/en.ts` **and** `de.ts` — the `MessageSchema` type makes a missing key a compile error).
- Give destructive/ambiguous icon buttons an `aria-label` that includes the item name (see `NoteCard.vue`) — the a11y tier will catch bare icon buttons.

## 5. Tests, tier by tier

For a feature the size of notes, the full set is roughly:

| Tier | What to cover |
| --- | --- |
| unit | domain functions, converters |
| default | the main user flow through the real UI (`notesFlow.spec.ts` pattern: interact, assert UI, assert persistence) |
| a11y | one axe sweep of the new screen; one of any new dialog |
| visual | a screenshot if the screen is part of the shell's core look (`pnpm test:visual:update`) |
| arch | nothing to write — the generic rules pick up new features automatically |
| e2e | only if the feature carries a load-bearing journey (like persistence-across-reload) |

## 6. Ship

```bash
pnpm lint:check && pnpm type-check && pnpm knip
pnpm test:unit && pnpm test && pnpm test:a11y && pnpm test:arch
```

Commit per behavior — the pre-commit gate (~15 s) keeps you honest. CI runs the full matrix on the PR.
