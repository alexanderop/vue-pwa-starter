import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import AtomInput from './AtomInput.vue'
import AtomLabel from './AtomLabel.vue'

const meta = {
  title: 'Components/Atoms/Input',
  component: AtomInput,
  tags: ['autodocs'],
} satisfies Meta<typeof AtomInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({ components: { AtomInput }, template: '<AtomInput aria-label="Title" />' }),
}
export const Placeholder: Story = {
  render: () => ({
    components: { AtomInput },
    template: '<AtomInput aria-label="Title" placeholder="What do you want to remember?" />',
  }),
}
export const Populated: Story = {
  render: () => ({
    components: { AtomInput },
    template: '<AtomInput aria-label="Title" model-value="Buy oat milk" />',
  }),
}
export const Disabled: Story = {
  render: () => ({
    components: { AtomInput },
    template: '<AtomInput aria-label="Title" model-value="Read only" disabled />',
  }),
}
export const Labeled: Story = {
  render: () => ({
    components: { AtomInput, AtomLabel },
    setup: () => ({ value: ref('') }),
    template:
      '<div class="flex max-w-sm flex-col gap-2"><AtomLabel for="story-title">Title</AtomLabel><AtomInput id="story-title" v-model="value" /><output>{{ value }}</output></div>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Title' })
    await userEvent.type(field, 'Buy milk')
    await expect(canvas.getByRole('status')).toHaveTextContent('Buy milk')
    await expect(Number.parseFloat(getComputedStyle(field).fontSize)).toBeGreaterThanOrEqual(16)
    await expect(Math.round(field.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
    field.blur()
    await userEvent.tab()
    await expect(field).toHaveFocus()
    await expect(field.matches(':focus-visible')).toBe(true)
  },
}
