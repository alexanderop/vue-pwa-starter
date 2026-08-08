import { test } from 'vitest'
import { resetAppState } from './helpers/reset'
import { NotesScreen } from './pages/notesScreen'
import { SettingsScreen } from './pages/settingsScreen'

/**
 * The browser tiers' `it`, with the screen objects handed over as fixtures —
 * the counterpart of `test/e2e/fixtures.ts`, so a spec and a Gherkin step
 * declare the screen they drive rather than constructing one:
 *
 * ```ts
 * it('creates a note', async ({ notes }) => { … })
 * ```
 *
 * A fixture owns the whole lifecycle — reset the app state, mount, unmount
 * when the test ends — which is what removes the `let screen: … | undefined`
 * plus `beforeEach`/`afterEach` pair every browser spec used to carry. It is
 * also lazy: a test that never names `notes` never mounts it, so a spec file
 * can mix screens without paying for the ones it does not use.
 *
 * Written with the builder syntax (`.extend(name, fn)`, Vitest 4.1) rather
 * than the Playwright-compatible object form: the fixture type is inferred
 * from what the function returns, so there is no second copy of it to keep
 * in step. `onCleanup` may be called **once** per fixture — a fixture that
 * needs two teardowns is two fixtures.
 *
 * Only app-wide screens live here. A harness specific to one spec (the stub
 * router in `components/appShell.spec.ts`, the tall sheet in
 * `dialogContent.spec.ts`) is a fixture in that spec, extending this one.
 */
export const it = test
  .extend('notes', async ({}, { onCleanup }) => {
    // Mounting is what the fixture is for, so the reset that has to precede
    // it belongs here too — ordering by dependency rather than by hook
    // registration order.
    await resetAppState()
    const notes = await NotesScreen.open()
    onCleanup(() => notes.close())
    return notes
  })
  .extend('settings', async ({}, { onCleanup }) => {
    await resetAppState()
    const settings = await SettingsScreen.open()
    onCleanup(() => settings.close())
    return settings
  })
  /**
   * Dark mode as a fixture, so the visual tier can switch appearance without
   * an `afterEach` that remembers to switch it back. `resetAppState` returns
   * the color-scheme preference to `auto`; the class is what a test sets
   * directly, and what this puts back.
   */
  .extend('theme', async ({}, { onCleanup }) => {
    onCleanup(() => document.documentElement.classList.remove('dark'))
    return {
      dark(): void {
        document.documentElement.classList.add('dark')
      },
    }
  })
