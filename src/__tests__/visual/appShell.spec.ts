import { describe, expect } from 'vitest'
import { it } from '../fixtures'

/**
 * Screenshot baselines live in __screenshots__/ next to this file and are
 * platform-specific. Regenerate deliberately with `pnpm test:visual:update`
 * after intentional UI changes — see docs/testing-strategy.md.
 */
describe('visual regression', () => {
  it('app shell, light', async ({ notes }) => {
    await notes.expectNoNotes()

    await expect(notes.root).toMatchScreenshot('app-shell-light')
  })

  it('app shell, dark', async ({ notes, theme }) => {
    await notes.expectNoNotes()

    await theme.dark()

    await expect(notes.root).toMatchScreenshot('app-shell-dark')
  })
})
