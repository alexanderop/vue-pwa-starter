import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ChevronLeft, NotebookPen } from '@lucide/vue'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { nextTick, ref } from 'vue'
import AtomButton from '@/components/atoms/AtomButton.vue'
import MoleculeEmptyState from '@/components/molecules/MoleculeEmptyState.vue'
import { MoleculeList, MoleculeListRow } from '@/components/molecules/list'

/**
 * List → detail → back, on one screen.
 *
 * A phone has no room for a master-detail split, so the detail *replaces* the
 * list and the back control is what the user relies on. Two things make the
 * difference between this feeling native and feeling like a web page:
 *
 * - Focus moves to the detail's heading when it opens, and back to the row
 *   that opened it when it closes. Without the return, a keyboard user is
 *   dropped at the top of the document and has to walk the whole list again to
 *   find where they were.
 * - The back control is a real button with a real label, not a chevron with an
 *   `aria-label` of "back". "Back to notes" is what a screen reader should
 *   say, because "back" alone does not say back to what.
 *
 * The list scroll position is deliberately preserved by keeping the list
 * mounted and hidden rather than unmounting it — a detail view that returns
 * you to the top of a 200-row list is the single most common regression in
 * this pattern.
 */
const meta = {
  title: 'Patterns/List detail',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'List, detail, and the way back — composed from `MoleculeList` and `AtomButton`. What a single component story cannot show is the part that goes wrong: where focus lands, and whether the list keeps its scroll position.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const NOTES = [
  { id: 'charger', title: 'Pack charger', body: 'The 65W one, not the travel brick.' },
  { id: 'ferry', title: 'Book the ferry', body: 'Wednesday morning, before the 09:40.' },
  { id: 'plants', title: 'Water the plants', body: 'Ask next door if it goes past Friday.' },
]

export const Default: Story = {
  render: () => ({
    components: { MoleculeList, MoleculeListRow, MoleculeEmptyState, AtomButton, ChevronLeft },
    setup() {
      const openId = ref<string | undefined>(undefined)
      const selected = ref<HTMLElement | undefined>(undefined)
      const heading = ref<HTMLElement | null>(null)

      async function open(id: string, event: MouseEvent): Promise<void> {
        if (event.currentTarget instanceof HTMLElement) selected.value = event.currentTarget
        openId.value = id
        // Focus the detail's heading, so the next Tab starts inside the thing
        // that just appeared rather than at the top of the document.
        await new Promise((resolve) => globalThis.requestAnimationFrame(resolve))
        heading.value?.focus()
      }

      async function close(): Promise<void> {
        openId.value = undefined
        // …and hand it back to the row that opened it — after Vue has shown
        // the list again. `focus()` on a `display: none` element is ignored,
        // and the list is still hidden in the tick the flag flips.
        await nextTick()
        selected.value?.focus()
      }

      const note = () => NOTES.find((entry) => entry.id === openId.value)

      return { NOTES, openId, open, close, note, heading, NotebookPen }
    },
    template: `
      <div class="mx-auto flex h-96 max-w-md flex-col overflow-hidden border">
        <div v-show="openId === undefined" class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-gutter">
          <h1 class="text-page-title font-bold tracking-tight">Notes</h1>
          <MoleculeList>
            <MoleculeListRow
              v-for="entry in NOTES"
              :key="entry.id"
              as="button"
              type="button"
              @click="open(entry.id, $event)"
            >
              {{ entry.title }}
              <template #description>{{ entry.body }}</template>
              <template #trailing><ChevronLeft class="size-4 rotate-180" aria-hidden="true" /></template>
            </MoleculeListRow>
          </MoleculeList>
        </div>

        <div v-if="openId !== undefined" class="flex min-h-0 flex-1 flex-col">
          <div class="flex items-center gap-2 border-b px-gutter py-2">
            <AtomButton variant="ghost" size="sm" @click="close">
              <ChevronLeft aria-hidden="true" />
              Back to notes
            </AtomButton>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto p-gutter">
            <h1 ref="heading" tabindex="-1" class="text-page-title font-bold tracking-tight focus-visible:outline-hidden">{{ note()?.title }}</h1>
            <p class="mt-2 select-text">{{ note()?.body }}</p>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('opening a row shows the detail and moves focus into it', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Book the ferry/ }))

      const heading = await waitFor(() =>
        canvas.getByRole('heading', { name: 'Book the ferry', level: 1 }),
      )
      await waitFor(() => expect(heading).toHaveFocus())
    })

    await step('the way back says back to what', async () => {
      await expect(canvas.getByRole('button', { name: 'Back to notes' })).toBeVisible()
    })

    await step('and closing returns focus to the row that opened it', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Back to notes' }))

      await waitFor(() =>
        expect(canvas.getByRole('button', { name: /Book the ferry/ })).toHaveFocus(),
      )
    })
  },
}
