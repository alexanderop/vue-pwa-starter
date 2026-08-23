import { render } from 'vitest-browser-vue'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import AtomLabel from '@/components/atoms/AtomLabel.vue'
import AtomSwitch from '@/components/atoms/AtomSwitch.vue'

/**
 * Storybook owns the switch's rendered states, axe checks, pointer and
 * keyboard interactions, disabled state, and thumb geometry. This one test
 * remains in Vitest because Storybook's Vitest addon does not expose Vitest
 * Browser's ARIA snapshot matcher. It pins the exact semantic tree rather
 * than duplicating any interaction contract from the stories.
 */
const Harness = defineComponent({
  render: () =>
    h('div', [
      h(AtomLabel, { for: 'notifications' }, () => 'Notifications'),
      h(AtomSwitch, { id: 'notifications' }),
      h(AtomLabel, { for: 'sync' }, () => 'Background sync'),
      h(AtomSwitch, { id: 'sync', disabled: true }),
    ]),
})

describe('AtomSwitch semantic tree', () => {
  it('reports both labelled states to assistive technology', async () => {
    const mounted = render(Harness)

    await expect.element(mounted.container).toMatchAriaInlineSnapshot(`
      - text: Notifications
      - switch "Notifications"
      - text: Background sync
      - switch "Background sync" [disabled]
    `)

    await mounted.unmount()
  })
})
