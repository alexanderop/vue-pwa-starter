/**
 * Which a11y sweep covers which component.
 *
 * The a11y tier sweeps whole *screens*, not components in isolation, so
 * "this component has an a11y test" is not something the tier can be asked
 * directly — a component only gets swept if some sweep actually renders it,
 * and a component behind a conditional (a toast, an install banner, a note
 * card on an empty list) is not rendered by the default screen sweeps at all.
 *
 * This file is the answer written down: every component in the app names the
 * sweep that renders it, or names why it is not swept. `architecture/
 * a11yCoverage.test.ts` holds it to that — add a component without an entry
 * here and the arch tier fails, which is the whole point. Adding the entry is
 * a deliberate act; adding it dishonestly is on you.
 */

/**
 * The sweeps `a11y.spec.ts` runs, as ids so the maps below cannot name one
 * that does not exist — that check is the type system's, not a string match.
 * The values are noun phrases: the spec appends "has no violations".
 */
export const SWEEPS = {
  notesHome: 'notes home',
  notesHomeWithNote: 'a note on the notes home',
  toast: 'a toast',
  settings: 'settings',
  quickAdd: 'the quick-add sheet',
  installBanner: 'the install banner',
  installDialog: 'the install dialog',
  updateBanner: 'the update banner',
  offlineBanner: 'the offline banner',
} as const

export type SweepId = keyof typeof SWEEPS

/**
 * Component path (relative to `src/`) → the sweep that renders it.
 *
 * Where more than one sweep renders a component, name the one whose state is
 * the interesting one: `ToastViewport` is mounted in every sweep, but only
 * the `toast` sweep has a toast *in* it, and an empty live region is not what
 * anyone wants checked.
 */
export const A11Y_COVERAGE = {
  'App.vue': 'notesHome',
  'components/organisms/OrganismAppShell.vue': 'notesHome',
  'components/organisms/OrganismBottomNav.vue': 'notesHome',
  'components/molecules/MoleculePageHeader.vue': 'settings',
  'components/templates/TemplatePageLayout.vue': 'settings',
  'components/organisms/OrganismPwaInstallDialog.vue': 'installDialog',
  'components/organisms/OrganismPwaInstallPrompt.vue': 'installBanner',
  'components/molecules/MoleculePwaUpdatePrompt.vue': 'updateBanner',
  'components/molecules/MoleculeToastViewport.vue': 'toast',
  'components/molecules/MoleculeAlert.vue': 'offlineBanner',
  'components/molecules/MoleculeEmptyState.vue': 'notesHome',
  'components/organisms/OrganismOfflineBanner.vue': 'offlineBanner',
  'features/notes/components/NoteCard.vue': 'notesHomeWithNote',
  'features/notes/components/QuickAddNoteSheet.vue': 'quickAdd',
  'views/NotesView.vue': 'notesHome',
  'views/SettingsView.vue': 'settings',
} satisfies Readonly<Record<string, SweepId>>

/**
 * Components whose axe coverage is their Storybook story rather than an app
 * sweep, each naming the story that carries it.
 *
 * Not a skip. A component with no call site cannot be reached by a sweep over
 * the running app, but its story runs axe in both palettes under exactly the
 * rules this tier applies — so it is graded, just somewhere else. Filing that
 * as an absence is what makes a skip list stop meaning "ungraded", and then
 * the genuinely ungraded component hides among the excuses.
 *
 * `architecture/a11yCoverage.test.ts` checks each entry names a story file
 * that exists, so this cannot quietly become a second skip list. Delete an
 * entry the moment a view composes the component — the sweep is stronger.
 */
export const A11Y_BY_STORY = {
  'components/molecules/MoleculeSearchField.vue': 'MoleculeSearchField.stories.ts',
  'components/molecules/MoleculeSwipeableRow.vue': 'MoleculeSwipeableRow.stories.ts',
  'components/organisms/OrganismPullToRefresh.vue': 'OrganismPullToRefresh.stories.ts',
} satisfies Readonly<Record<string, string>>

/**
 * Components deliberately left out of the a11y tier altogether, each with the
 * reason.
 *
 * A reason is not "it is hard to mount", and it is not "a story covers it" —
 * that is `A11Y_BY_STORY` above. What belongs here is a component where a
 * sweep would grade something other than the shipped UI. Empty today, and kept
 * so the next one has a home that forces the reason to be written down.
 */
export const A11Y_SKIPPED = {} satisfies Readonly<Record<string, string>>
