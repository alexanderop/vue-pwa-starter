import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import AtomLabel from './AtomLabel.vue'
import AtomCheckbox from './AtomCheckbox.vue'

const meta = {
  title: 'Components/Atoms/Checkbox',
  component: AtomCheckbox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Three states, not two. `indeterminate` is a real model value here rather than a DOM property set after mount, which is how a native checkbox loses it in a `v-for`.',
      },
    },
  },
} satisfies Meta<typeof AtomCheckbox>

export default meta
type Story = StoryObj<typeof meta>

const components = { AtomCheckbox, AtomLabel }

export const States: Story = {
  render: () => ({
    components,
    template: `
      <div class="mx-auto flex max-w-sm flex-col gap-4">
        <AtomLabel class="flex min-h-touch-target items-center gap-3" for="cb-unchecked">
          <AtomCheckbox id="cb-unchecked" :model-value="false" /> Unchecked
        </AtomLabel>
        <AtomLabel class="flex min-h-touch-target items-center gap-3" for="cb-checked">
          <AtomCheckbox id="cb-checked" :model-value="true" /> Checked
        </AtomLabel>
        <AtomLabel class="flex min-h-touch-target items-center gap-3" for="cb-mixed">
          <AtomCheckbox id="cb-mixed" model-value="indeterminate" /> Indeterminate
        </AtomLabel>
        <AtomLabel class="flex min-h-touch-target items-center gap-3" for="cb-disabled">
          <AtomCheckbox id="cb-disabled" disabled /> Disabled
        </AtomLabel>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('checkbox', { name: 'Unchecked' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    await expect(canvas.getByRole('checkbox', { name: 'Checked' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    // The state a native checkbox cannot carry in markup.
    await expect(canvas.getByRole('checkbox', { name: 'Indeterminate' })).toHaveAttribute(
      'aria-checked',
      'mixed',
    )
    await expect(canvas.getByRole('checkbox', { name: 'Disabled' })).toBeDisabled()
  },
}

/** The label is the hit area, which is what makes it usable with a thumb. */
export const LabelIsTheTarget: Story = {
  render: () => ({
    components,
    setup: () => ({ checked: ref(false) }),
    template: `
      <AtomLabel class="mx-auto flex min-h-touch-target max-w-sm items-center gap-3" for="cb-toggle">
        <AtomCheckbox id="cb-toggle" v-model="checked" /> Keep notes on this device only
      </AtomLabel>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const box = canvas.getByRole('checkbox')

    await userEvent.click(canvas.getByText('Keep notes on this device only'))
    await waitFor(() => expect(box).toHaveAttribute('aria-checked', 'true'))

    await userEvent.keyboard(' ')
    await waitFor(() => expect(box).toHaveAttribute('aria-checked', 'false'))
  },
}
