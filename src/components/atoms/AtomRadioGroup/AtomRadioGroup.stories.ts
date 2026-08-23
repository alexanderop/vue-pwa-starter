import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import AtomLabel from '@/components/atoms/AtomLabel.vue'
import { AtomRadioGroup, AtomRadioGroupItem } from '.'

const subcomponents = { AtomRadioGroupItem }

const meta = {
  title: 'Components/Atoms/Radio group',
  component: AtomRadioGroup,
  subcomponents,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One provider-tree story, because a radio is meaningless alone. Reka supplies the roving tab index — the group is one tab stop and the arrows move within it — which a set of native inputs only gets if every one of them shares a `name`.',
      },
    },
  },
} satisfies Meta<typeof AtomRadioGroup>

export default meta
type Story = StoryObj<typeof meta>

const components = { AtomRadioGroup, ...subcomponents, AtomLabel }

function groupStory(options: { disabledItem?: boolean } = {}) {
  return {
    components,
    setup: () => ({ value: ref('system'), options }),
    template: `
      <AtomRadioGroup v-model="value" orientation="vertical" aria-label="Theme" class="mx-auto max-w-sm">
        <AtomLabel class="flex min-h-touch-target items-center gap-3" for="theme-system">
          <AtomRadioGroupItem id="theme-system" value="system" /> Follow the system
        </AtomLabel>
        <AtomLabel class="flex min-h-touch-target items-center gap-3" for="theme-light">
          <AtomRadioGroupItem id="theme-light" value="light" /> Always light
        </AtomLabel>
        <AtomLabel class="flex min-h-touch-target items-center gap-3" for="theme-dark">
          <AtomRadioGroupItem id="theme-dark" value="dark" :disabled="options.disabledItem" /> Always dark
        </AtomLabel>
      </AtomRadioGroup>
    `,
  }
}

export const Default: Story = {
  render: () => groupStory(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    // `orientation="vertical"` is not decoration: it is what makes ArrowDown
    // the key that moves between options. Without it Reka only answers the
    // horizontal arrows, and a vertical list of radios ignores the arrow a
    // user would actually press.
    await step('the group is one stop, and the arrows move within it', async () => {
      await userEvent.tab()
      await expect(canvas.getByRole('radio', { name: 'Follow the system' })).toHaveFocus()

      // Held, not tapped. Reka checks the newly focused radio from a
      // `setTimeout(0)` guarded by "an arrow key is currently down", and
      // `{ArrowDown}` releases the key in the same tick — so the guard is
      // already false when the timer runs and nothing is selected. A real
      // finger is never that fast; `{ArrowDown>}` is what models one.
      await userEvent.keyboard('{ArrowDown>}')
      await waitFor(() =>
        expect(canvas.getByRole('radio', { name: 'Always light' })).toHaveAttribute(
          'aria-checked',
          'true',
        ),
      )
      await userEvent.keyboard('{/ArrowDown}')
    })

    await step('exactly one option is ever selected', async () => {
      const checked = canvas
        .getAllByRole('radio')
        .filter((radio) => radio.getAttribute('aria-checked') === 'true')

      await expect(checked).toHaveLength(1)
    })
  },
}

export const WithDisabledOption: Story = {
  render: () => groupStory({ disabledItem: true }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('radio', { name: 'Always dark' })).toBeDisabled()
  },
}

/** Every option clears the 44px floor, because the label is the hit area. */
export const TouchTargetContract: Story = {
  tags: ['touch'],
  render: () => groupStory(),
  play: async ({ canvasElement }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)

    for (const label of within(canvasElement).getAllByText(/^(Follow|Always)/)) {
      const row = label.closest('label')
      await expect(row?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
    }
  },
}
