# vue-pwa-starter

A **local-first Vue 3 PWA starter** with the part most starters skip: a complete, tiered testing strategy and the mobile app-shell boilerplate you otherwise rebuild every time.

Everything lives on the device (IndexedDB via Dexie). No backend, no accounts, no spinners. Built for apps you use on a phone, offline, mid-task.

## Quickstart

Use this repository as a GitHub template (or clone it), then:

```bash
pnpm install
pnpm dev
```

All gates should be green out of the box:

```bash
pnpm lint:check && pnpm format:check              # lint + formatting
pnpm type-check && pnpm knip                      # types + dead code
pnpm test:unit && pnpm test && pnpm test:a11y     # unit + browser + a11y tiers
pnpm test:arch && pnpm test:visual                # architecture + visual tiers
pnpm test:e2e                                     # production build in a real browser
pnpm build && pnpm size-limit                     # bundle budget
```

## What you get

| Area | What is in the box |
| --- | --- |
| App shell | Config-driven bottom nav ([`AppShell.vue`](src/components/AppShell.vue)), optional center FAB slot, `meta.hideNav` escape hatch, safe-area insets, `PageLayout`/`PageHeader`, keyboard-aware bottom sheet (`MobileDialogContent`), toast viewport |
| Local-first data | Dexie schema with a worked v1→v2 migration, converter pattern for reading old data forever, repository layer, zod-validated JSON export/import |
| Example feature | `src/features/notes` — one deliberately boring feature that touches every layer, with a test in every tier. Copy it, then delete it |
| Testing | Six tiers: unit (Node, ~100 ms), browser (Vitest browser mode), a11y (axe-core), visual (screenshots), architecture (ArchUnitTS), e2e (playwright-bdd against the production build). See [docs/testing-strategy.md](docs/testing-strategy.md) |
| Quality gates | oxlint + ESLint + Prettier + markdownlint, knip (dead exports), size-limit (bundle budget), husky pre-commit gate (~15 s) |
| PWA | vite-plugin-pwa with update prompt, icons generated from one SVG at build time, offline precache, web-vitals seam |
| CI | Sharded GitHub Actions pipeline, actions pinned by SHA, zizmor-clean |
| i18n | vue-i18n with typed message keys, English + German |
| Agent-ready | A `CLAUDE.md`/`AGENTS.md` that teaches coding agents the conventions |

## Stack

Vue 3.5 · TypeScript (strict) · Vite · Tailwind CSS v4 · reka-ui · VueUse · Dexie · vue-router · vue-i18n · zod · Vitest 4 (browser mode) · Playwright · pnpm (with catalogs — pnpm is required)

## Philosophy: local-first

Design tie-breakers, borrowed from [Ink & Switch's local-first ideals](https://www.inkandswitch.com/local-first/):

1. **No spinners** — instant input, never block on network
2. **Network optional** — fully offline
3. **The Long Now** — data readable after the app dies (export, schema stability, converters)
4. **Ownership & control** — user owns the data, no accounts, exportable any time

How the data layer implements this: [docs/local-first.md](docs/local-first.md)

## Project structure

```text
src/features/      Feature-owned UI, state, and domain logic (features never import features)
src/db/            Dexie schema, converters, repositories — the only place that touches storage
src/stores/        Shared app-wide singleton state (VueUse createGlobalState, not Pinia)
src/composables/   Shared reactive logic (2+ consumers)
src/views/         Route-level pages; may compose multiple features
src/components/    App shell + UI shared across features
src/components/ui/ Styled primitives (shadcn-style, yours to edit)
src/__tests__/     All tests, mirroring the source tree — not colocated
test/e2e/          playwright-bdd features + steps
```

These boundaries are not just documentation — they are enforced by [architecture tests](src/__tests__/architecture/architecture.test.ts) over the module graph and by `no-restricted-imports` rules in [eslint.config.ts](eslint.config.ts), which also cover `.vue` files. [A negative test](src/__tests__/architecture/boundaries.test.ts) proves the enforcement actually fires.

## Adding your first feature

Follow the walkthrough in [docs/adding-a-feature.md](docs/adding-a-feature.md). Short version: copy how `src/features/notes` does it, tier by tier.

## Deleting the example

The notes feature is scaffolding. To remove it:

1. Delete `src/features/notes`, `src/views/NotesView.vue`, and the notes specs under `src/__tests__` and `test/e2e`.
2. Remove the notes entries from `src/router/index.ts`, `src/router/navigation.ts`, and the `notes`/`quickAdd` keys from `src/i18n/messages/*`.
3. Replace the `notes` table in `src/db/schema.ts` (and `repositories/`, `backup.ts`) with your own.
4. Remove the `QuickAddNoteSheet` wiring from `src/App.vue` (keep the `#center-action` slot if you want a FAB).
5. Run `pnpm lint:check && pnpm format:check && pnpm type-check && pnpm knip` — the gates will point at anything you missed.

## License

[MIT](LICENSE)
