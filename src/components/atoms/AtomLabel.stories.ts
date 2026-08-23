import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import AtomLabel from './AtomLabel.vue'

const meta = {
  title: 'Components/Atoms/Label',
  component: AtomLabel,
  tags: ['autodocs'],
  args: { for: 'label-story-field' },
} satisfies Meta<typeof AtomLabel>

export default meta
type Story = StoryObj<typeof meta>

export const FieldAssociation: Story = {
  render: (args) => ({
    components: { AtomLabel },
    setup: () => ({ args }),
    template:
      '<div class="flex items-center gap-2"><AtomLabel v-bind="args">I agree</AtomLabel><input id="label-story-field" type="checkbox" /></div>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole('checkbox', { name: 'I agree' })
    await expect(checkbox).not.toBeChecked()
    await userEvent.click(canvas.getByText('I agree'))
    await expect(checkbox).toBeChecked()
  },
}

export const DisabledPeer: Story = {
  render: () => ({
    components: { AtomLabel },
    template:
      '<div class="flex items-center gap-2"><input id="disabled-field" type="checkbox" class="peer" disabled /><AtomLabel for="disabled-field">Disabled title</AtomLabel></div>',
  }),
  play: async ({ canvasElement }) => {
    const label = within(canvasElement).getByText('Disabled title')
    await expect(getComputedStyle(label).userSelect).toBe('none')
    await expect(Number.parseFloat(getComputedStyle(label).opacity)).toBe(0.5)
  },
}
