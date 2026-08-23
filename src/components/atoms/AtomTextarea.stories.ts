import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import AtomLabel from './AtomLabel.vue'
import AtomTextarea from './AtomTextarea.vue'

const meta = {
  title: 'Components/Atoms/Textarea',
  component: AtomTextarea,
  tags: ['autodocs'],
} satisfies Meta<typeof AtomTextarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { AtomTextarea },
    template: '<AtomTextarea aria-label="Details" placeholder="Add details…" />',
  }),
}
export const Populated: Story = {
  render: () => ({
    components: { AtomTextarea },
    template: '<AtomTextarea aria-label="Details" model-value="This note stays on this device." />',
  }),
}
export const Disabled: Story = {
  render: () => ({
    components: { AtomTextarea },
    template: '<AtomTextarea aria-label="Details" model-value="Read only details" disabled />',
  }),
}
export const Labeled: Story = {
  render: () => ({
    components: { AtomLabel, AtomTextarea },
    setup: () => ({ submitted: ref(false), value: ref('') }),
    template:
      '<form class="flex max-w-sm flex-col gap-2" @submit.prevent="submitted = true"><AtomLabel for="body-story">Note</AtomLabel><AtomTextarea id="body-story" v-model="value" /><output>{{ submitted ? \'submitted\' : \'editing\' }}</output></form>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Note' })
    await userEvent.type(field, 'first line{Enter}second line')
    await expect(field).toHaveValue('first line\nsecond line')
    await expect(canvas.getByRole('status')).toHaveTextContent('editing')
    await expect(Number.parseFloat(getComputedStyle(field).fontSize)).toBeGreaterThanOrEqual(16)
    await expect(Math.round(field.getBoundingClientRect().height)).toBeGreaterThanOrEqual(96)
  },
}
