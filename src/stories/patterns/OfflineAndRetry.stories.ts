import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { CircleAlert, WifiOff } from '@lucide/vue'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import AtomButton from '@/components/atoms/AtomButton.vue'
import MoleculeAlert from '@/components/molecules/MoleculeAlert.vue'
import { MoleculeList, MoleculeListRow } from '@/components/molecules/list'

/**
 * What "offline" and "that write failed" look like, and why they are not the
 * same screen.
 *
 * In a local-first app the two are almost unrelated, and conflating them is
 * the single biggest way this kind of product loses a user's trust:
 *
 * - **Offline** is not a failure. Every write still lands in IndexedDB, so the
 *   app is working exactly as designed. It gets a `status`, a `warning` tone,
 *   and no action — because there is nothing for the user to do.
 * - **A failed write** is a failure, and it is the one state that has to
 *   interrupt. It gets `alert`, a `destructive` tone, and a retry — and the
 *   retry has to be a real control, because "try again later" is not a plan.
 *
 * The rows keep rendering through both. A screen that empties itself because
 * the network went away is showing the user a loss that did not happen.
 */
const meta = {
  title: 'Patterns/Offline and retry',
  parameters: {
    docs: {
      description: {
        component:
          'Two states that look similar and mean opposite things. Offline is a `status` with no action; a failed write is an `alert` with a retry. The list keeps its data through both — nothing was lost.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const components = { MoleculeAlert, MoleculeList, MoleculeListRow, AtomButton }
const ROWS = ['Pack charger', 'Book the ferry', 'Water the plants']

export const Offline: Story = {
  render: () => ({
    components,
    setup: () => ({ ROWS, WifiOff }),
    template: `
      <div class="mx-auto flex max-w-md flex-col gap-4">
        <MoleculeAlert tone="warning">
          <template #icon><component :is="WifiOff" class="size-4" aria-hidden="true" /></template>
          You are offline. Your notes are on this device and everything still works.
        </MoleculeAlert>
        <MoleculeList>
          <MoleculeListRow v-for="row in ROWS" :key="row">{{ row }}</MoleculeListRow>
        </MoleculeList>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('it informs rather than interrupts', async () => {
      await expect(canvas.getByRole('status')).toHaveTextContent('You are offline')
      await expect(canvas.queryByRole('alert')).not.toBeInTheDocument()
      await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
    })

    await step('and nothing disappeared', async () => {
      await expect(canvas.getAllByRole('listitem')).toHaveLength(ROWS.length)
    })
  },
}

/**
 * A write that failed. This one interrupts, and the retry actually retries —
 * the second attempt succeeds and the alert leaves on its own.
 */
export const WriteFailedAndRetried: Story = {
  render: () => ({
    components,
    setup() {
      const failed = ref(true)
      const attempts = ref(1)

      function retry(): void {
        attempts.value += 1
        failed.value = false
      }

      return { ROWS, CircleAlert, failed, attempts, retry }
    },
    template: `
      <div class="mx-auto flex max-w-md flex-col gap-4">
        <MoleculeAlert v-if="failed" tone="destructive">
          <template #icon><component :is="CircleAlert" class="size-4" aria-hidden="true" /></template>
          <p class="font-medium">“Water the plants” was not saved</p>
          <p class="mt-1 text-footnote">Nothing else was affected. The note is still on screen.</p>
          <template #action><AtomButton size="sm" variant="outline" @click="retry">Retry</AtomButton></template>
        </MoleculeAlert>
        <p v-else class="text-footnote text-muted-foreground" data-testid="settled">Saved on attempt {{ attempts }}</p>

        <MoleculeList>
          <MoleculeListRow v-for="row in ROWS" :key="row">{{ row }}</MoleculeListRow>
        </MoleculeList>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('a failed write interrupts, and names what failed', async () => {
      await expect(canvas.getByRole('alert')).toHaveTextContent('was not saved')
      // Which note, not "an error occurred".
      await expect(canvas.getByRole('alert')).toHaveTextContent('Water the plants')
    })

    await step('the unaffected rows are still there', async () => {
      await expect(canvas.getAllByRole('listitem')).toHaveLength(ROWS.length)
    })

    await step('and the retry is a real control that really retries', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))

      await waitFor(() => expect(canvas.queryByRole('alert')).not.toBeInTheDocument())
      await expect(canvas.getByTestId('settled')).toHaveTextContent('attempt 2')
    })
  },
}
