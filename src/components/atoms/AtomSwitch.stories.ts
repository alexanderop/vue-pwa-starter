import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import AtomLabel from './AtomLabel.vue'
import AtomSwitch from './AtomSwitch.vue'

const meta = {
  title: 'Components/Atoms/Switch',
  component: AtomSwitch,
  tags: ['autodocs'],
  args: { modelValue: false },
} satisfies Meta<typeof AtomSwitch>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {
  render: () => ({ components: { AtomSwitch }, template: '<AtomSwitch aria-label="Dark mode" />' }),
}
export const On: Story = {
  render: () => ({
    components: { AtomSwitch },
    template: '<AtomSwitch :model-value="true" aria-label="Dark mode" />',
  }),
}
export const Disabled: Story = {
  render: () => ({
    components: { AtomSwitch },
    template: '<AtomSwitch aria-label="Dark mode" disabled />',
  }),
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole('switch', { name: 'Dark mode' })
    await userEvent.click(control)
    await expect(control).not.toBeChecked()
  },
}
export const Labeled: Story = {
  render: (args) => ({
    components: { AtomLabel, AtomSwitch },
    setup: () => ({ args, value: ref(args.modelValue ?? false) }),
    template:
      '<div class="flex items-center gap-3"><AtomSwitch id="theme-story" v-model="value" /><AtomLabel for="theme-story">Dark mode</AtomLabel></div>',
  }),
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole('switch', { name: 'Dark mode' })
    const thumb = control.querySelector('[data-slot="switch-thumb"]')
    if (thumb === null) throw new Error('switch thumb not found')
    const off = thumb.getBoundingClientRect().left
    await expect(control).not.toBeChecked()
    await userEvent.click(control)
    await expect(control).toBeChecked()
    await waitFor(() => expect(thumb.getBoundingClientRect().left).toBeGreaterThan(off))
    await expect(
      canvasElement.querySelectorAll('[role="switch"][aria-checked="true"]'),
    ).toHaveLength(1)
  },
}

export const KeyboardInteraction: Story = {
  render: () => ({
    components: { AtomLabel, AtomSwitch },
    setup: () => ({ value: ref(false) }),
    template:
      '<div class="flex items-center gap-3"><AtomSwitch id="keyboard-switch" v-model="value" /><AtomLabel for="keyboard-switch">Notifications</AtomLabel></div>',
  }),
  play: async ({ canvasElement }) => {
    const control = within(canvasElement).getByRole('switch', { name: 'Notifications' })
    await userEvent.tab()
    await expect(control).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(control).toBeChecked()
  },
}
