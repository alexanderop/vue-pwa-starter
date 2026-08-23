import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NotebookPen, Plus } from '@lucide/vue'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import AtomButton from '@/components/atoms/AtomButton.vue'
import MoleculeEmptyState from '@/components/molecules/MoleculeEmptyState.vue'
import { MoleculeList, MoleculeListRow } from '@/components/molecules/list'

/**
 * The first screen a local-first app ever shows: nothing, and a way to start.
 *
 * This is the state most apps treat as an edge case and every user sees first,
 * so it is worth being deliberate about three things:
 *
 * - It says where the data lives. "Everything stays on this device" is the
 *   product, and the empty screen is the only place anyone will read it.
 * - It has exactly one action, and that action is the thing the app is for.
 *   An onboarding carousel is a screen between the user and their first note.
 * - The action is real, not a picture of the FAB. A user who taps the
 *   illustration and gets nothing has learned that the app ignores them.
 *
 * Once there is one row, the empty state is gone for good — there is no
 * "getting started" panel that lingers.
 */
const meta = {
  title: 'Patterns/First run',
  parameters: {
    docs: {
      description: {
        component:
          'Nothing yet, and one way to start. The state most apps treat as an edge case and every user sees first.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MoleculeEmptyState, MoleculeList, MoleculeListRow, AtomButton },
    setup() {
      const notes = ref<Array<string>>([])

      function create(): void {
        notes.value = [...notes.value, `Note ${notes.value.length + 1}`]
      }

      return { notes, create, NotebookPen, Plus }
    },
    template: `
      <div class="mx-auto flex min-h-72 max-w-md flex-col gap-4">
        <h1 class="text-page-title font-bold tracking-tight">Notes</h1>

        <MoleculeEmptyState v-if="notes.length === 0" title-as="h2" class="rounded-lg border border-dashed">
          <template #icon><component :is="NotebookPen" class="size-6" aria-hidden="true" /></template>
          No notes yet
          <template #description>Everything you write stays on this device. No account, no sync, no server.</template>
          <template #action>
            <AtomButton @click="create">
              <component :is="Plus" aria-hidden="true" />
              Write your first note
            </AtomButton>
          </template>
        </MoleculeEmptyState>

        <MoleculeList v-else>
          <MoleculeListRow v-for="note in notes" :key="note">{{ note }}</MoleculeListRow>
        </MoleculeList>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('it says where the data lives', async () => {
      await expect(canvas.getByText(/stays on this device/)).toBeVisible()
    })

    await step('there is exactly one action, and it is the point of the app', async () => {
      await expect(canvas.getAllByRole('button')).toHaveLength(1)
      await expect(canvas.getByRole('button', { name: /Write your first note/ })).toBeVisible()
    })

    await step('and it works — the empty state is replaced, not decorated', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Write your first note/ }))

      await waitFor(() => expect(canvas.getByRole('list')).toBeVisible())
      await expect(canvas.queryByText('No notes yet')).not.toBeInTheDocument()
    })
  },
}
