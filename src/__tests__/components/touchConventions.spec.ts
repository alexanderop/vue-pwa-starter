import { describe, expect } from 'vitest'
import { it } from '../fixtures'

/**
 * The touch conventions that are measurable in this tier's browser
 * (docs/touch-conventions.md).
 *
 * Every assertion here is on a *computed effect* — what scrolls, what a
 * double-click selects — never on a class string. A class-string assertion
 * goes red on a harmless rename and stays green when the CSS is broken; it is
 * a change detector aimed at the wrong thing. The conventions that no browser
 * we can afford to run will show (press transforms, reduced motion, the
 * insets themselves) get a static tripwire in the arch tier instead —
 * `architecture/touchConventions.test.ts`.
 */

/**
 * The elements that actually scroll, asked of the DOM rather than named.
 *
 * The bug this exists for was a *correct declaration on an element that never
 * scrolls*: `body` carried `overscroll-behavior-y: none` while `<main>` was
 * the real scroller. A test naming `<main>` would have missed both that
 * instance and the next one.
 */
function scrollContainers(root: Element): Array<Element> {
  return [...root.querySelectorAll('*')].filter((element) => {
    const { overflowY } = getComputedStyle(element)
    return overflowY === 'auto' || overflowY === 'scroll'
  })
}

describe('touch conventions', () => {
  it('contains overscroll on every scroll container in the shell', async ({ notes }) => {
    await notes.expectNoNotes()

    const containers = scrollContainers(notes.root.element())

    // Without this the test passes when the shell has no scroller at all —
    // the a11yCoverage lesson: a green check means nothing until you know it
    // would go red.
    expect(
      containers.length,
      'no scroll container found — this test proves nothing',
    ).toBeGreaterThan(0)

    for (const container of containers) {
      expect(
        getComputedStyle(container).overscrollBehaviorY,
        `<${container.tagName.toLowerCase()}> scrolls but lets the gesture chain out of it — add overscroll-contain`,
      ).toBe('contain')
    }
  })
})
