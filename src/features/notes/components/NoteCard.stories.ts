import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import type { Note } from '@/db'
import NoteCard from './NoteCard.vue'

const BASE_NOTE: Note = {
  id: 'story-note-1',
  title: 'Offline ideas',
  body: 'Capture the useful thought before the network comes back.',
  pinned: false,
  createdAt: 1_777_000_000_000,
  updatedAt: 1_777_000_000_000,
}

const meta = {
  title: 'Features/Notes/Note card',
  component: NoteCard,
  tags: ['autodocs'],
  args: { note: BASE_NOTE },
} satisfies Meta<typeof NoteCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Pinned: Story = { args: { note: { ...BASE_NOTE, pinned: true } } }
export const LongTitleAndBody: Story = {
  args: {
    note: {
      ...BASE_NOTE,
      title: 'A deliberately long note title that demonstrates truncation inside a compact card',
      body: 'A long body remains selectable and is clamped after three lines. '.repeat(8),
    },
  },
}
export const Actions: Story = {
  render: (args) => ({
    components: { NoteCard },
    setup() {
      const action = ref('')
      return { action, args }
    },
    template:
      '<div><NoteCard v-bind="args" @toggle-pinned="action = \'Pinned requested\'" @delete="action = \'Delete requested\'" /><p v-if="action" role="status" class="mt-3">{{ action }}</p></div>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Pin note Offline ideas' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Pinned requested')
  },
}
