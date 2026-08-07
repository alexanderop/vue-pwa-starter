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
pnpm format         # prettier (format:check to verify — CI runs the check)
pnpm type-check     # vue-tsc --build
pnpm knip           # Dead exports
pnpm build          # Production build (+ pnpm size-limit for the budget)
```

## Effect

`effect` is pinned to exactly `4.0.0-beta.105`. For any Effect question (API
shape, runtime behavior, examples), read the real source at
`~/Projects/opensource/effect` — checked out on branch `pinned/4.0.0-beta.105`
to match. Start with its `LLMS.md`, `SCHEMA.md`, and the runnable examples
under `ai-docs/src/**`. Online docs and v3 training data describe a different
API; do not use them. Bumping the pin means moving the reference clone's
pinned branch too.

## Critical conventions

- **State**: atoms via `@effect/atom-vue` (pinned in lockstep with `effect`) — NOT Pinia, NOT VueUse `createGlobalState`. Shared state lives in a registry-held `Atom`; components subscribe with `useAtomValue`/`useAtom`/`useAtomSet`. Plain UI state is `Atom.make(...)` behind a composable (`src/stores/quickAdd.ts`, `src/stores/toast.ts` — note the writable `computed` wherever a component two-way binds). The registry is provided in `main.ts`; tests provide a fresh one per render instead of `$reset()`.
- **DB**: all access via `src/db/index.ts` repositories. Schema changes need a version bump + `upgrade()` + converter update — see `src/db/schema.ts` for the worked v1→v2 example and docs/local-first.md for why both.
- **One schema per row, in `src/db/converters.ts`**: a `Schema.Struct` plus a same-name `interface` is the source of truth; Dexie's table typing, the read-path decode, and backup validation all derive from it. Never hand-write a TypeScript type beside a schema for the same data — they drift silently. IndexedDB is untrusted input: repositories decode every row on read and validate every draft on write, both failing with tagged errors.
- **DB is Effect-based**: repositories are `Context.Service` classes with `Layer`s (`src/db/repositories/notes.ts` is the worked example); failures are tagged errors (`Schema.TaggedError`, `src/db/errors.ts`) visible in each program's type; validation uses `effect/Schema` (not zod). **Effect does not stop at the Vue boundary — it meets Vue at atoms**: reads that drive the UI are atoms built with `dbRuntime.atom(program)` and wired with `Atom.withReactivity([NOTES_KEY])` (`src/features/notes/atoms.ts` is the worked example) — their `AsyncResult` value carries loading, failure, and data typed into the template, and subscribing is the load. Writes are programs the component composes and hands to the `dbMutation` fn atom via `useAtomSet(() => dbMutation, { mode: 'promise' })`; like `runDb`, it accepts only `Effect<unknown, never, DbServices>`, so every failure must be handled inside Effect with `Effect.catchTag`/`Effect.catchTags` first — an unhandled `DatabaseError` is a type error, not a runtime surprise — and a landed write invalidates the reactivity key, so read atoms re-read from disk (no manual re-read). `runDb` remains the imperative edge for programs that read and leave (backup export, test assertions). No try/catch and no `instanceof` in `.vue` files; `src/views/SettingsView.vue` is the worked example (three failure types, one exhaustive `catchTags`). Pure Effect programs are tested with `it.effect` from `@effect/vitest` in the unit tier (worked example: `src/__tests__/unit/db/backup.spec.ts`); browser-tier tests say what they mean about failure with `Effect.orDie` (a failure would break the test) or `Effect.flip` (the failure *is* the assertion). Inside a program, log with `Effect.logError` + `Effect.annotateLogs`, not `console.error` in an `Effect.sync` — that keeps the entry on the fiber and the span `Effect.fn` opened.
- **Where Effect starts and stops**: everything reachable from `@/db` — persistence, backup payloads, and the domain rules over them (`src/lib/backupFile.ts` is on this side, since a component composes it into one `catchTags` with the db programs). Browser-platform plumbing with no domain content stays plain async TypeScript: `src/lib/persistentStorage.ts` and `src/lib/swUpdateCheck.ts` use try/catch on purpose. If a failure needs a name the UI can match on, it belongs in Effect; if the only response is `console.debug`, it does not.
- **One layer stack, two runtimes**: `src/db/layer.ts` defines `dbLayer`, and both the atom runtime (`src/db/atoms.ts`) and the ManagedRuntime behind `runDb` (`src/db/runtime.ts`) are built from it. They are separate contexts, so a repository layer merged into one is invisible to the other — add new layers in `layer.ts` and nowhere else. `src/lib/observability.ts` rides along there: OTLP tracer + logger from `effect/unstable/observability` (no `@opentelemetry/*` dependency), gated on `import.meta.env.DEV && VITE_OTLP_URL` so it is dead code in production. The spans it exports are the `Effect.fn('NotesRepo.list')` names already in the repositories — instrument by naming the `Effect.fn`, not by adding an exporter call.
- **Features never import other features**; shared layers never import features. Enforced twice: ArchUnitTS in `src/__tests__/architecture/` reads the TypeScript module graph, and `no-restricted-imports` in `eslint.config.ts` covers `.vue` files, which ArchUnitTS does not parse.
- **Two-way binding**: `const open = defineModel<boolean>('open')`.
- **i18n**: every user-facing string in `src/i18n/messages/en.ts` and `de.ts`; the schema type makes missing keys a compile error.
- **Tests are not colocated**: they live in `src/__tests__/`, mirroring the source tree. Which tier a test belongs in: docs/testing-strategy.md.
- Keep logic in `.ts` modules, not `<script setup>` — that is what makes it unit-testable and visible to the arch tests.

## Git workflow

Conventional Commits with scope (`feat(notes): …`). The husky pre-commit gate (~15 s) runs lint-staged, type-check, test:unit, and knip on every commit — do not bypass it with `--no-verify`. Browser/a11y/visual/e2e tiers are CI's job (`.github/workflows/ci.yml`); run the ones your change touches before pushing.
