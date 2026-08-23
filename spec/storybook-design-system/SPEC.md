# Storybook design-system catalog

Status: Proposed  
Implementation status: Not started  
Target Storybook version: `10.5.7`  
Source of truth: `/Users/alexanderopalic/Projects/opensource/storybookjs/storybook` at
`v10.5.7` (`7c6fb3a5ecf4495d73de6d70f802251934e079bd`)

## Summary

Add Storybook as this starter's browsable design-system catalog and its
component-state testing surface. The catalog should make the system easier to
understand than a folder of components: a new contributor must be able to see
the tokens, atomic tiers, supported variants, responsive states, light and dark
themes, interaction contracts, and accessibility results without first running
the product or reading component source.

Storybook is additive. It does not replace the existing seven-tier testing
strategy wholesale, it does not change production behavior, and it does not
introduce a second design system. The components under `src/components/` remain
the design system; Storybook is the lens through which it is documented and
exercised.

This specification deliberately contains no implementation. Its first
implementation change begins only after this document is accepted.

## Why Storybook, not Histoire

The useful ideas in the Reka UI Histoire workspace should be retained:

- a branded, searchable catalog;
- deliberate sidebar grouping;
- shared preview setup rather than per-story boilerplate;
- the real application stylesheet and tokens;
- isolated component variants rather than one large showcase page.

Storybook is the better runtime for this repository because the checked-out
`@storybook/vue3-vite@10.5.7` framework accepts Vite 5 through Vite 8, and the
checked-out `@storybook/addon-vitest@10.5.7` accepts Vitest 3 and 4. The starter
currently uses Vite 8 and Vitest 4. Histoire's stable release would require a
second Vite 5 runtime, while its current beta still does not match Vite 8.

Storybook also supplies the parts this request is really asking for: Vue
docgen, Autodocs, controls, themed previews, responsive viewports, a11y
inspection, interaction playback, and test status in the catalog itself.

## Evidence used for this specification

The implementation must be checked against the pinned source rather than
recalled from a different Storybook major. The relevant authorities are:

| Concern | Pinned source |
| --- | --- |
| Vue and Vite framework support | `docs/get-started/frameworks/vue3-vite.mdx` and `code/frameworks/vue3-vite/` |
| Vite configuration behavior | `docs/builders/vite.mdx` and `code/builders/builder-vite/` |
| Vue story typing and rendering | `code/renderers/vue3/src/` and `code/renderers/vue3/template/stories_vue3-vite-default-ts/` |
| Autodocs and component metadata | `docs/writing-docs/autodocs.mdx` and `code/frameworks/vue3-vite/src/plugins/vue-component-meta.ts` |
| Theme-by-class behavior | `code/addons/themes/docs/api.md` and `code/addons/themes/src/` |
| Accessibility behavior | `docs/writing-tests/accessibility-testing.mdx` and `code/addons/a11y/` |
| Story-to-Vitest transformation | `docs/writing-tests/integrations/vitest-addon/index.mdx` and `code/addons/vitest/src/vitest-plugin/` |
| Embedded Test-panel startup | `code/addons/vitest/src/node/vitest-manager.ts` |
| Story hierarchy and ordering | `docs/writing-stories/naming-components-and-hierarchy.mdx` |
| Responsive preview API | `docs/essentials/viewport.mdx` |

The implementation should also register this checkout in
`.claude/references.json` as `storybook`, pinned to `pinned/10.5.7`, so future
agents receive the same source-of-truth instruction automatically.

## Goals

1. Make every shared component discoverable by atomic tier.
2. Show the actual app tokens and styling in light and dark themes.
3. Document public props, emits, slots, compound parts, and intended usage.
4. Show meaningful states, not only a default render.
5. Let interactions be run and debugged from the Storybook UI.
6. Run story smoke, interaction, and component-level accessibility checks in
   the existing Vitest 4 + Playwright Chromium infrastructure.
7. Preserve touch-first behavior by testing a genuine coarse-pointer browser
   project, not merely a narrow iframe.
8. Reuse stories as fixtures where that removes duplicated visual or component
   setup without weakening existing assertions.
9. Keep Storybook entirely out of the production dependency graph and bundle.
10. Give a future starter consumer a clear deletion path if they do not want a
    component catalog.

## Non-goals

- Replacing `src/components/` with a package or generated component library.
- Restyling the product as part of the Storybook installation.
- Adding Histoire alongside Storybook.
- Adding Chromatic or any hosted visual-testing service.
- Publishing Storybook publicly in the first implementation.
- Replacing unit, database, architecture, touch, or production E2E tests.
- Moving feature behavior into stories to make it easier to render.
- Adding mock-service infrastructure when the starter has no backend.
- Using Storybook's preview viewport as evidence that `(pointer: coarse)` or
  touch events are active.
- Adopting preview or experimental Storybook APIs merely because they exist.

## Product experience

The catalog opens on a designed welcome page rather than the first component
alphabetically. Its sidebar order is fixed:

1. `Start`
2. `Foundations`
3. `Components/Atoms`
4. `Components/Molecules`
5. `Components/Organisms`
6. `Components/Templates`
7. `Features/Notes`
8. `Screens`

The manager chrome is branded "Vue PWA Design System" with the repository's
existing purple and `public/favicon.svg`. Branding uses Storybook's supported
theme API from `storybook/theming`; it must not target Storybook's private DOM
classes from `manager-head.html`.

The preview toolbar offers:

- light and dark application themes;
- English and German locales;
- compact mobile, standard mobile, tablet, and desktop viewports;
- the built-in zoom, measure, outline, and accessibility tools.

Theme switching applies `dark` to `html`, which is the default parent of
`withThemeByClassName`. Applying it to a story wrapper is insufficient because
Reka UI portals dialog and drawer content outside the wrapper.

Viewport switching is a design aid. The touch test project separately launches
Chromium with both `hasTouch: true` and `isMobile: true`; only that combination
proves coarse-pointer branches and touch media queries.

## Technical decisions

### Versioning

All Storybook packages are exact and in lockstep at `10.5.7`, matching the
checked-out tag:

- `storybook`
- `@storybook/vue3-vite`
- `@storybook/addon-docs`
- `@storybook/addon-a11y`
- `@storybook/addon-themes`
- `@storybook/addon-vitest`

These belong in a `storybook` pnpm catalog rather than six repeated version
strings. `@storybook/addon-essentials` is not added; Storybook 10 removed that
bundle and the required maintained addons are explicit. `@storybook/test` is
not added because Storybook 10 exposes interaction utilities from
`storybook/test`.

An upgrade is one deliberate operation:

1. move every Storybook package together;
2. move the local source checkout to the matching tag and pinned branch;
3. inspect migration notes and affected source paths;
4. rerun the full verification matrix, including the real Test panel.

### Story format

Use stable CSF 3 TypeScript:

```ts
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AtomButton from './AtomButton.vue'

const meta = {
  title: 'Components/Atoms/Button',
  component: AtomButton,
  tags: ['autodocs'],
  args: {
    default: 'Save note',
  },
} satisfies Meta<typeof AtomButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
```

CSF Next offers stronger types but is still marked preview in the pinned
source. This starter chooses the stable format for its first catalog. A later
migration may adopt CSF Next after it is stable; story files must not mix the
two formats.

### Story placement

- Component stories are colocated with their component as
  `ComponentName.stories.ts`.
- A compound primitive has one story beside its barrel, such as
  `src/components/molecules/dialog/MoleculeDialog.stories.ts`. It documents
  the provider and all public parts together.
- Feature stories are colocated with feature components.
- Cross-component documentation lives under `src/stories/` as MDX or a
  docs-only Vue component plus CSF story.
- General Vitest specs remain under `src/__tests__/`; a Storybook story is a
  usage artifact with an optional `play` contract, not permission to relocate
  arbitrary tests beside source.

Explicit `title` values are used even though Storybook can infer paths. The
titles are the stable sidebar and permalink contract, while physical paths may
change during atomic-tier refactors.

### Separate Vite composition root

Storybook must not load the production `vite.config.ts` unchanged. That config
registers the PWA plugin and development Vue DevTools, neither of which belongs
in an isolated component catalog.

Add `vite.storybook.config.ts` containing only:

- `@vitejs/plugin-vue`;
- `@tailwindcss/vite`;
- the `@` alias to `src/`;
- any dependency optimization proven necessary by a real failure.

Point `framework.options.builder.viteConfigPath` at that file. Do not copy PWA,
service-worker, OTLP proxy, or DevTools configuration into it.

Use `staticDirs: ['../public']` for the existing favicon and other public
assets. Build output is `storybook-static/` and is ignored by Git.

### Vue application setup

`.storybook/preview.ts` recreates the application services stories legitimately
need:

- import `src/style.css` once;
- install the typed i18n instance;
- create a memory-history router;
- provide a fresh `AtomRegistry`;
- configure the theme decorator;
- configure viewports, backgrounds, docs, a11y, and story sorting.

The setup must follow the same composition-root rule as `src/main.ts` and
`src/__tests__/helpers/renderApp.ts`: exactly one atom registry per mounted Vue
application. It must not add a global default registry or introduce Pinia.

Stories may not silently rely on state left by the previously viewed story.
Acceptance testing must prove that switching repeatedly between stateful
stories starts each one from its declared state.

### Data and browser state

Stories fall into three state classes:

1. **Prop-driven components** receive state through args and need no reset.
2. **Shared-state components** receive a fresh atom registry and use a
   Storybook decorator or loader to seed their public store behavior.
3. **Persistence-backed screens** reset and seed the database through public
   repository APIs in a loader before rendering.

Storybook Vitest tests import `fake-indexeddb/auto`, matching the current
browser tiers. The interactive Storybook UI runs on its own Storybook origin,
but persistence-backed loaders must still reset before seeding so story order
does not matter.

No story imports `src/db/schema.ts` or a repository internal. No story writes a
Dexie table directly. The same public database boundary applies to catalog
fixtures as to production code.

PWA prompt stories use the existing browser-boundary helpers or a small
Storybook-only adapter around the public event contract. They do not register a
service worker, pretend an unavailable browser API exists globally, or leak a
synthetic install event into the next story.

## Story authoring contract

Every component story file must:

1. Name the atomic tier in its `title`.
2. Set `component` so `vue-component-meta` can generate documentation.
3. Use `satisfies Meta<typeof Component>` and `StoryObj<typeof meta>`.
4. Provide useful default args.
5. Describe non-obvious props and design intent in component JSDoc rather than
   duplicating prose in story configuration.
6. Show every supported visual variant and disabled/loading/error state that a
   consumer can intentionally request.
7. Exercise slots through an explicit Vue `render` function when args alone
   cannot express the public API.
8. Use `subcomponents` for public parts of compound primitives.
9. Use a `play` function only for an observable user interaction.
10. Query by role and accessible name with `within` from `storybook/test`.
11. Use `userEvent`; never call component methods, emitted-event internals, or
    DOM event handlers directly.
12. Assert the outcome a user perceives, not classes or implementation detail.
13. Add a short reason for every a11y rule override or `!test` tag.

For a portalled dialog or drawer, the play function scopes queries to
`canvasElement.ownerDocument.body` after opening. The portal is deliberately
outside the canvas subtree. Focus entry, containment, Escape dismissal, and
restoration to the trigger are separate observable contracts.

Stories must remain deterministic:

- no `Date.now()`, `new Date()`, or random example content;
- stable ids and timestamps are injected;
- timers are advanced or avoided rather than slept through;
- transitions settle before a screenshot or color-contrast read;
- story loaders clean up everything they seed.

## Documentation design

### Start page

`Start/Welcome` explains:

- what the starter is;
- that data stays on-device;
- the four atomic tiers;
- how to run the app, Storybook, and tests;
- how to add, document, and verify a component;
- the difference between a story, a browser spec, and a production E2E test.

The page uses the real tokens but no production component whose own story is
being documented. Documentation chrome is allowed to use semantic HTML.

### Foundations

Foundations are living views over `src/style.css`, not a second token file.
They include:

- semantic colors in light and dark themes, including foreground pairs;
- page title, section title, body, label, helper, and tabular-number styles;
- radius tokens;
- section rhythm and common spacing;
- the 44 px touch-target token and fine-pointer collapse;
- focus ring, disabled opacity, press feedback, reduced motion, and safe-area
  conventions;
- an explanation that raw CSS variables are authoritative and the catalog is
  only rendering them.

Token values must be read or rendered from CSS custom properties. Do not copy
OKLCH values into story data where they can drift from `src/style.css`.

### Autodocs

Enable `vue-component-meta` with `tsconfig.app.json`, because this repository's
root `tsconfig.json` is a references-only file. This is required for aliases and
Vue prop, emit, and slot metadata to resolve correctly.

Autodocs is enabled per component story with the `autodocs` tag. It is not
globally forced onto foundations and screen compositions where a generated
props table is meaningless. Compound primitives use MDX or `subcomponents` to
explain their public tree.

## Required story inventory

The first complete implementation includes the following. A row is complete
only when every named state exists and renders with no warning or error.

| Area | Story | Required states |
| --- | --- | --- |
| Start | Welcome | purpose, tier map, commands, contribution path |
| Foundations | Colors | semantic palette, foreground pairs, light, dark |
| Foundations | Typography | page, section, body, label, helper, tabular numbers |
| Foundations | Shape and spacing | radii, section rhythm, touch target, focus ring |
| Atoms | Badge | default, secondary, outline, destructive, link via `as-child` |
| Atoms | Button | every variant, every size, icon, disabled, `as-child` |
| Atoms | Input | default, placeholder, populated, disabled, labeled |
| Atoms | Label | field association and disabled peer |
| Atoms | Select | default, selected, disabled, long option, labeled |
| Atoms | Skeleton | text, card, list, parent `aria-busy` pattern |
| Atoms | Spinner | default, button-sized, labeled status |
| Atoms | Switch | off, on, disabled, labeled |
| Atoms | Textarea | default, populated, disabled, labeled |
| Molecules | Dialog | closed, open, form, long content, destructive confirmation, mobile sheet |
| Molecules | Numeric input | integer, decimal, custom presets, min/max, open drawer, cancel/confirm |
| Molecules | Page header | root, back, subtitle, actions, long title |
| Molecules | Toast viewport | empty, one, multiple, long message, expiry |
| Molecules | PWA update prompt | hidden and update available |
| Organisms | App shell | each selected route, center action, hidden nav, long content |
| Organisms | PWA install | Chromium prompt, iOS instructions, dismissed, unsupported |
| Templates | Page layout | root, detail, footer, scrolling, non-scrolling |
| Notes | Note card | default, pinned, long title/body, actions |
| Notes | Quick-add sheet | closed, empty, filled, disabled save, successful save |
| Screens | Notes | empty, populated, quick-add open |
| Screens | Settings | default preferences, German long-copy state |

Compound parts such as `MoleculeDialogTitle` and
`MoleculeNumericInputKeypad` do not receive isolated stories merely to raise a
count. Their contract only exists inside the provider tree, so their
documentation and controls belong to the compound story.

## Testing ownership

Storybook becomes the owner of rendered component states; it is not a new
eighth tier that repeats every existing test.

| Claim | Owner after adoption |
| --- | --- |
| Pure decisions, converters, state machines | Unit tier |
| Component renders for declared props and slots | Story smoke test |
| Component-local pointer/keyboard interaction | Story `play` function |
| Component-level axe result | Storybook a11y addon |
| Cross-component feature flow with repository assertions | Existing default browser tier |
| IndexedDB migration, import/export, persistence correctness | Existing unit/default tiers |
| Coarse-pointer behavior and 44 px geometry | Touch project/tier |
| Whole-screen ARIA structure and coverage ledger | Existing a11y/architecture tiers |
| Local screenshot baselines | Existing visual tier, optionally composed from stories |
| Service worker, real IndexedDB, offline reload, shipped bundle | Existing E2E tier |
| Import boundaries and design-system coverage | Architecture tier |

### Migration rule

No existing test is removed in the scaffolding commit. A later commit may
remove a component test only when:

1. a named story renders the same state;
2. its `play` function asserts the same user-visible contract;
3. the story passes in the CLI project and the embedded Test panel;
4. any geometry, persistence, focus, or platform assertion that Storybook does
   not cover remains in its original tier;
5. the diff states exactly which duplicate assertion was removed.

Stories should become fixtures for the existing visual tier through portable
stories where useful. The screenshot matcher and checked-in local baselines
remain the source of truth. Do not add Chromatic merely to obtain Storybook's
hosted Visual Tests panel.

## Storybook Vitest projects

Add three Storybook projects to the existing Vitest 4 project array:

- `storybook-light`: desktop Chromium, `theme: light`;
- `storybook-dark`: desktop Chromium, `theme: dark`;
- `storybook-touch`: Chromium with `{ hasTouch: true, isMobile: true }`, mobile
  viewport, `theme: light`.

Each uses `storybookTest({ configDir, initialGlobals })`, the existing
Playwright provider, the existing action timeout, and
`.storybook/vitest.setup.ts`. The setup file imports `fake-indexeddb/auto`,
installs the console-warning gate, and applies Storybook project annotations.

The touch project starts every relevant play function by proving
`matchMedia('(pointer: coarse)').matches`. A narrow viewport without that
assertion is not touch coverage.

### Embedded Test-panel collision shield

The pinned addon derives the Vitest project name as
`storybook:<normalized configDir>`. The Storybook manager launches Vitest with
that same name through `STORYBOOK_CONFIG_DIR`. Three projects sharing one
config directory therefore collide in the embedded panel even when the CLI
matrix passes.

The project factory must expose only `storybook-light` when
`STORYBOOK_CONFIG_DIR` is present. Normal CLI and CI runs retain all three
projects. Verification includes clicking Run tests in the real Storybook UI;
CLI success alone is not acceptance.

## Accessibility policy

`parameters.a11y.test` is `error` by default for component and screen stories.
Foundations documentation may opt out only when it is non-interactive
documentation chrome and includes the reason.

The addon checks rendered component markup. It does not replace:

- ARIA snapshots for intended cross-component structure;
- focus navigation and restoration assertions;
- page-level landmark checks against a full document;
- the a11y coverage ledger that detects forgotten components;
- the 44 px touch-target convention, which is stricter than axe's rule.

Both light and dark Storybook projects run a11y checks. Theme is supplied as an
initial global so axe does not inspect a transition frame between palettes.
Every incomplete axe result remains visible for manual review even when it is
not a violation.

## Files expected from implementation

```text
.storybook/
  main.ts
  manager.ts
  preview.ts
  theme.ts
  vitest.setup.ts
vite.storybook.config.ts
src/stories/
  Welcome.mdx
  foundations/
    Colors.stories.ts
    Typography.stories.ts
    ShapeAndSpacing.stories.ts
src/components/**/ComponentName.stories.ts
src/features/notes/components/*.stories.ts
src/views/*.stories.ts
docs/design-system.md
```

Expected edits outside those new files:

- `package.json`: commands and dev dependencies;
- `pnpm-workspace.yaml`: exact Storybook catalog;
- `pnpm-lock.yaml`: resolved tooling graph;
- `vitest.config.ts`: Storybook project factory and projects;
- `knip.json`: only if auto-detection does not cover the chosen globs;
- `.gitignore`: `storybook-static/` and Storybook/Vitest transient output;
- `.github/workflows/ci.yml`: a separate Storybook build/test job;
- `README.md`, `docs/index.md`, and `docs/testing-strategy.md`: commands and
  ownership boundaries;
- `.claude/references.json`: pinned Storybook source registration;
- architecture coverage rules if stories become the official component-state
  ledger.

The implementation must not create `.histoire/`, `histoire.config.*`, or
`*.story.vue` files.

## Commands

The final command surface is:

```bash
pnpm storybook                 # interactive catalog on port 6006
pnpm build:storybook           # static catalog build
pnpm test:storybook            # light + dark + touch story projects
pnpm test:storybook:touch      # touch project only
```

`pnpm check` continues to cover the fast non-browser gates. Storybook tests
remain a separate browser command and CI job, matching the existing tier
policy. The static Storybook build belongs in CI because it catches manager,
MDX, docgen, and production-build failures that the transformed story tests do
not.

## Implementation sequence

### Phase 1: Tooling skeleton

1. Add exact lockstep dependencies and scripts.
2. Add the separate Storybook Vite config.
3. Add manager branding, preview setup, providers, theme, locale, viewport, and
   story ordering.
4. Add Vitest light, dark, and touch project factories with the Test-panel
   collision shield.
5. Add a minimal smoke story and verify both UI and CLI startup paths.

Exit condition: the catalog, static build, one smoke story, all three CLI
projects, and the embedded Test panel are green before component migration
starts.

### Phase 2: Foundations and atoms

1. Build the welcome and foundations pages from the real CSS tokens.
2. Add every atom story and Autodocs page.
3. Add interaction coverage where an atom has behavior.
4. Run light/dark a11y and touch-target checks.

Exit condition: every atom is discoverable, documented, controllable, and
green in all applicable projects.

### Phase 3: Compounds and shared compositions

1. Add Dialog and Numeric Input as compound stories with documented parts.
2. Add page header, toast, PWA prompts, app shell, and page layout.
3. Verify portal theme inheritance, keyboard focus, touch behavior, and
   deterministic shared state.

Exit condition: all shared components appear exactly once in the intended
sidebar tier and no state leaks between stories.

### Phase 4: Feature and screen states

1. Add NoteCard and QuickAdd stories.
2. Add seeded Notes and Settings screen stories.
3. Prove loaders reset and seed through public boundaries.
4. Add the German long-copy state.

Exit condition: the worked example can be understood from Storybook without
opening the app, while its real persistence journeys remain in browser/E2E.

### Phase 5: Deduplication and CI

1. Inventory story assertions against existing component and visual specs.
2. Remove only proven duplicates under the migration rule.
3. Compose stories into visual tests where it deletes setup without deleting
   assertions.
4. Add separate static-build and story-test CI steps.
5. Update documentation and coverage ledgers.

Exit condition: no assertion dilution, no redundant setup state catalog, and
all legacy and Storybook gates are green.

## Verification matrix

| Verification | What it proves |
| --- | --- |
| `pnpm check` | formatting, lint, types, unit, architecture, and dead-code gates remain green |
| `pnpm build:storybook` | MDX, docgen, Vite, manager, and static catalog build together |
| `pnpm test:storybook` | every story renders and play/a11y checks pass in light, dark, and touch projects |
| Storybook UI Run tests | the embedded manager-to-Vitest startup path works |
| Theme toolbar on Dialog and Numeric Input | `dark` reaches portalled content |
| Locale toolbar plus German Settings state | i18n providers and long copy are real |
| Revisit stateful stories in different orders | no atom, database, timer, or module state leaks |
| `pnpm test:a11y` | whole-screen light/dark axe and ARIA structure remain green |
| `pnpm test:touch` | existing coarse-pointer and geometry contracts remain green |
| `pnpm test:visual` | checked-in local visual baselines remain green |
| `pnpm test:e2e` | production PWA behavior remains green |
| `pnpm build && pnpm size-limit` | Storybook has not entered the production bundle |

## Acceptance criteria

The implementation is complete only when all of the following are true:

- Storybook is pinned to the locally readable `10.5.7` source version.
- The production app has no Storybook runtime imports or dependencies.
- The static Storybook build succeeds without the PWA or DevTools plugins.
- The sidebar matches the specified hierarchy and ordering.
- Foundations render from the actual application tokens.
- Every shared component appears in the required inventory.
- Compound primitives are documented as trees, not disconnected parts.
- Autodocs resolves props, emits, slots, and `@` aliases through
  `tsconfig.app.json`.
- Light/dark switching affects portalled overlays and content.
- English/German and all named viewports are selectable.
- The CLI passes light, dark, and real touch-emulated projects.
- The actual embedded Test panel passes.
- Component and screen stories fail on a11y violations by default.
- Unexpected Vue warnings and console errors fail story tests.
- Stateful stories are order-independent.
- No existing test was removed before its story proved equivalent coverage.
- Chromatic, Histoire, and hosted services were not added.
- The production bundle remains within its existing size budget.
- README and project knowledge explain Storybook's role and deletion path.

## Risks and failure shields

| Risk | Required shield |
| --- | --- |
| Storybook packages drift across versions | Exact shared catalog version and single upgrade procedure |
| Production Vite plugins run in stories | Dedicated `vite.storybook.config.ts` |
| Docgen loses aliases/types | `vue-component-meta` explicitly pointed at `tsconfig.app.json` |
| Dark dialog remains light | Theme class applied to `html`, then verified on a portal story |
| Mobile preview mistaken for touch | Separate Playwright context with `hasTouch` and `isMobile`, plus coarse-pointer assertion |
| Stateful stories influence one another | Fresh atom registry and reset/seed loaders through public APIs |
| A11y runs only in light mode | Separate light and dark Storybook Vitest projects |
| Test panel fails while CLI passes | `STORYBOOK_CONFIG_DIR` single-project branch and real UI verification |
| Storybook duplicates the entire test suite | Explicit ownership table and per-assertion migration rule |
| Visual tests become a hosted dependency | Keep Vitest screenshots and portable-story composition; no Chromatic |
| Catalog changes production bundle | Dev dependencies only, dedicated build, production size-limit gate |
| Experimental API breaks the catalog | Stable CSF 3; defer CSF Next until stable |

## Deferred decisions

These are intentionally outside the first implementation:

- public hosting and access control for the static catalog;
- Chromatic or another remote visual-review service;
- CSF Next migration;
- replacing the architecture a11y coverage ledger with a story coverage
  ledger;
- extracting the design system into its own package;
- publishing tokens as generated JSON or design-tool artifacts.

Each requires a separate decision because it changes deployment, source
ownership, or test authority rather than merely improving the catalog.
