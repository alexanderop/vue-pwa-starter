import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Effect } from 'effect'
import { expect, waitFor, within } from 'storybook/test'
import { onMounted } from 'vue'
import App from '@/App.vue'
import { importData, runDb } from '@/db'
import { useQuickAddStore } from '@/stores/quickAdd'
import NotesView from './NotesView.vue'

const SEEDED_BACKUP = {
  app: 'vue-pwa-starter',
  version: 2,
  exportedAt: '2026-08-23T10:00:00.000Z',
  notes: [
    {
      id: 'story-note-pinned',
      title: 'Pack charger',
      body: 'USB-C cable and adapter',
      pinned: true,
      createdAt: 1_777_000_000_000,
      updatedAt: 1_777_000_000_000,
    },
    {
      id: 'story-note-plain',
      title: 'Buy oat milk',
      body: 'Unsweetened',
      pinned: false,
      createdAt: 1_776_000_000_000,
      updatedAt: 1_776_000_000_000,
    },
  ],
} as const

const meta = {
  title: 'Screens/Notes',
  component: NotesView,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NotesView>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  render: () => ({ components: { App }, template: '<App />' }),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(within(canvasElement).getByRole('heading', { name: 'No notes yet' })).toBeVisible(),
    )
  },
}
export const Populated: Story = {
  loaders: [async () => runDb(importData(SEEDED_BACKUP).pipe(Effect.orDie))],
  render: () => ({ components: { App }, template: '<App />' }),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(within(canvasElement).getByRole('heading', { name: 'Pack charger' })).toBeVisible(),
    )
  },
}
export const QuickAddOpen: Story = {
  render: () => ({
    components: { App },
    setup() {
      const quickAdd = useQuickAddStore()
      onMounted(quickAdd.open)
    },
    template: '<App />',
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement.ownerDocument.body).getByRole('dialog', { name: 'New note' }),
      ).toBeVisible(),
    )
  },
}
