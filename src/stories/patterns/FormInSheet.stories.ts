import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { computed, ref } from 'vue'
import AtomButton from '@/components/atoms/AtomButton.vue'
import AtomInput from '@/components/atoms/AtomInput.vue'
import AtomLabel from '@/components/atoms/AtomLabel.vue'
import AtomTextarea from '@/components/atoms/AtomTextarea.vue'
import {
  MoleculeSheet,
  MoleculeSheetContent,
  MoleculeSheetDescription,
  MoleculeSheetFooter,
  MoleculeSheetHeader,
  MoleculeSheetTitle,
  MoleculeSheetTrigger,
} from '@/components/molecules/sheet'

/**
 * A form inside a bottom sheet — the shape almost every "create" flow on a
 * phone takes, and the one with the most ways to go wrong.
 *
 * Four rules, all of them visible only when you try it with a keyboard open:
 *
 * - The submit button lives in the sheet's footer, outside the scroll region,
 *   so it stays reachable when the keyboard has taken half the viewport.
 * - The sheet sits at `bottom: var(--keyboard-inset)` and caps its height
 *   against the same variable, so the keyboard pushes it up rather than
 *   burying it. Turn the **Keyboard open** toolbar control on to see it.
 * - Submit is disabled on the same rule the repository enforces, not on a
 *   restatement of it — the point is to save a round trip, not to invent a
 *   second definition of "valid".
 * - Dismissing does not destroy the draft. An accidental tap on the scrim is
 *   not a decision to throw away what someone typed.
 */
const meta = {
  title: 'Patterns/Form in a sheet',
  parameters: {
    docs: {
      description: {
        component:
          'The create flow. The submit control sits outside the scroll region so an open keyboard cannot bury it, and dismissing keeps the draft — an accidental tap on the scrim is not a decision to discard what someone typed.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const components = {
  MoleculeSheet,
  MoleculeSheetTrigger,
  MoleculeSheetContent,
  MoleculeSheetHeader,
  MoleculeSheetTitle,
  MoleculeSheetDescription,
  MoleculeSheetFooter,
  AtomButton,
  AtomInput,
  AtomLabel,
  AtomTextarea,
}

function formStory(open: boolean) {
  return {
    components,
    setup() {
      const isOpen = ref(open)
      const title = ref('')
      const body = ref('')
      const saved = ref<string | undefined>(undefined)
      const canSave = computed(() => title.value.trim().length > 0)

      function save(): void {
        if (!canSave.value) return
        saved.value = title.value
        title.value = ''
        body.value = ''
        isOpen.value = false
      }

      return { isOpen, title, body, saved, canSave, save }
    },
    template: `
      <div class="flex flex-col items-start gap-3">
        <p v-if="saved" class="text-footnote text-muted-foreground">Saved “{{ saved }}”</p>

        <MoleculeSheet v-model:open="isOpen">
          <MoleculeSheetTrigger as-child><AtomButton>New note</AtomButton></MoleculeSheetTrigger>
          <MoleculeSheetContent>
            <template #header>
              <MoleculeSheetHeader>
                <MoleculeSheetTitle>New note</MoleculeSheetTitle>
                <MoleculeSheetDescription>Saved locally, available offline.</MoleculeSheetDescription>
              </MoleculeSheetHeader>
            </template>

            <form id="new-note" class="flex flex-col gap-4" @submit.prevent="save">
              <div class="flex flex-col gap-2">
                <AtomLabel for="pattern-title">Title</AtomLabel>
                <AtomInput id="pattern-title" v-model="title" placeholder="What is this about?" />
              </div>
              <div class="flex flex-col gap-2">
                <AtomLabel for="pattern-body">Note</AtomLabel>
                <AtomTextarea id="pattern-body" v-model="body" placeholder="Write it down…" />
              </div>
            </form>

            <template #footer>
              <MoleculeSheetFooter>
                <AtomButton type="submit" form="new-note" :disabled="!canSave">Save</AtomButton>
              </MoleculeSheetFooter>
            </template>
          </MoleculeSheetContent>
        </MoleculeSheet>
      </div>
    `,
  }
}

export const Open: Story = {
  render: () => formStory(true),
  play: async ({ canvasElement, step }) => {
    const body = within(canvasElement.ownerDocument.body)

    await step('submit starts disabled, on the rule the data layer owns', async () => {
      await expect(body.getByRole('button', { name: 'Save' })).toBeDisabled()
    })

    await step('the submit control is outside the scroll region', async () => {
      const footer = canvasElement.ownerDocument.querySelector('[data-slot="sheet-footer"]')
      const scroller = canvasElement.ownerDocument.querySelector('[data-slot="sheet-body"]')

      // The button is in the footer, not in the part that scrolls — which is
      // what keeps it on screen once the keyboard has taken half the viewport.
      await expect(scroller?.contains(footer ?? null)).toBe(false)
      await expect(footer?.contains(body.getByRole('button', { name: 'Save' }))).toBe(true)
    })

    await step('typing a title enables it, and saving closes the sheet', async () => {
      await userEvent.type(body.getByLabelText('Title'), 'Pack charger')
      await waitFor(() => expect(body.getByRole('button', { name: 'Save' })).toBeEnabled())

      await userEvent.click(body.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
      await expect(within(canvasElement).getByText(/Saved/)).toHaveTextContent('Pack charger')
    })
  },
}

/** A dismissal is not a discard. */
export const DraftSurvivesDismissal: Story = {
  render: () => formStory(true),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)

    await userEvent.type(body.getByLabelText('Title'), 'Half a thought')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())

    await userEvent.click(within(canvasElement).getByRole('button', { name: 'New note' }))
    await waitFor(() => expect(body.getByLabelText('Title')).toHaveValue('Half a thought'))
  },
}

/**
 * With the keyboard up. Driven through `--keyboard-inset`, the variable
 * `useKeyboardInset` writes from `visualViewport` — a real on-screen keyboard
 * is not something a browser test can raise, and the manual device checklist
 * in docs/design-system.md is what proves the real thing.
 */
export const AboveTheKeyboard: Story = {
  render: () => formStory(true),
  play: async ({ canvasElement }) => {
    const document_ = canvasElement.ownerDocument
    const root = document_.documentElement
    const body = within(document_.body)
    const save = body.getByRole('button', { name: 'Save' })

    try {
      root.style.setProperty('--keyboard-inset', '300px')

      await waitFor(() =>
        expect(save.getBoundingClientRect().bottom).toBeLessThan(
          (document_.defaultView?.innerHeight ?? 0) - 250,
        ),
      )
      // Still on screen, which is the whole claim.
      await expect(save.getBoundingClientRect().top).toBeGreaterThan(0)
    } finally {
      root.style.removeProperty('--keyboard-inset')
    }
  },
}
