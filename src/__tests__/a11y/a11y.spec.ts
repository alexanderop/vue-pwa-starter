import { describe } from 'vitest'
import { it } from '../fixtures'
import { assertNoViolations, assertNoPageLevelViolations } from '../helpers/a11y'
import { stubInstallPromptAvailable } from '../helpers/installEvent'

describe('accessibility', () => {
  it('notes home has no violations', async ({ notes }) => {
    await assertNoViolations(notes.container)
  })

  it('settings has no violations', async ({ settings }) => {
    await assertNoViolations(settings.container)
  })

  it('quick-add sheet has no violations while open', async ({ notes }) => {
    // openQuickAdd waits for the lazy-loaded sheet, so axe gets it mounted.
    await notes.openQuickAdd()

    await assertNoViolations(notes.quickAdd.root.element())
  })

  it('the install banner has no violations', async ({ notes }) => {
    stubInstallPromptAvailable()
    await notes.install.expectVisible()

    await assertNoViolations(notes.container)
  })

  it('the install dialog has no violations while open', async ({ notes }) => {
    stubInstallPromptAvailable()
    await notes.install.expectVisible()
    // openDialog waits for the lazy-loaded dialog, so axe gets it mounted.
    await notes.install.openDialog()

    await assertNoViolations(notes.install.dialog.element())
  })

  // Container-scoped sweeps skip every rule axe classifies as page-level —
  // landmark structure, heading-one, region. These run against the document
  // so they actually execute; see the helper for what is and isn't included.
  it('notes home has a sound page structure', async ({ notes }) => {
    await assertNoPageLevelViolations(notes)
  })

  it('settings has a sound page structure', async ({ settings }) => {
    await assertNoPageLevelViolations(settings)
  })
})
