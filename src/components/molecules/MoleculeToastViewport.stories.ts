import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { onMounted } from 'vue'
import {
  MoleculeSheet,
  MoleculeSheetContent,
  MoleculeSheetDescription,
  MoleculeSheetHeader,
  MoleculeSheetTitle,
} from '@/components/molecules/sheet'
import { useToastStore } from '@/stores/toast'
import MoleculeToastViewport from './MoleculeToastViewport.vue'

const meta = {
  title: 'Components/Molecules/Toast viewport',
  component: MoleculeToastViewport,
  tags: ['autodocs'],
} satisfies Meta<typeof MoleculeToastViewport>

export default meta
type Story = StoryObj<typeof meta>

function toastStory(messages: ReadonlyArray<string>, duration = 60_000) {
  return {
    components: { MoleculeToastViewport },
    setup() {
      const toast = useToastStore()
      onMounted(() => {
        for (const message of messages) toast.showToast(message, duration)
      })
    },
    template:
      '<div class="min-h-40 rounded-xl border bg-muted/30 p-4"><p class="text-sm text-muted-foreground">Toasts portal to the bottom of the preview.</p><MoleculeToastViewport /></div>',
  }
}

export const Empty: Story = { render: () => toastStory([]) }
export const One: Story = { render: () => toastStory(['Note saved']) }
export const Multiple: Story = {
  render: () => toastStory(['Note saved', 'Backup exported', 'Theme updated']),
}
export const LongMessage: Story = {
  render: () =>
    toastStory([
      'This is a deliberately long confirmation message that truncates rather than escaping the viewport',
    ]),
}
export const Expiry: Story = {
  render: () => toastStory(['This toast expires using the production timer'], 150),
  parameters: {
    docs: {
      description: {
        story:
          'The toast uses the public store’s production expiry path; no timer is duplicated in story code.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const region = within(canvasElement.ownerDocument.body).getByRole('status')
    await expect(region).toHaveTextContent('This toast expires using the production timer')
    await waitFor(() => expect(region).toHaveTextContent(''), { timeout: 1000 })
  },
}

/**
 * A toast over an open sheet — the one layering claim that a stacking-order
 * diagram cannot settle.
 *
 * Both the sheet and the toast are portalled to `<body>`, so their order in the
 * DOM is whatever mounted last and the only thing deciding what a user sees is
 * `--z-toast` being above `--z-sheet`. A toast confirming a save that lands
 * *behind* the sheet the save came from is invisible at exactly the moment it
 * matters, and it is the failure mode a single-component story cannot catch.
 */
export const AboveAnOpenSheet: Story = {
  render: () => ({
    components: {
      MoleculeToastViewport,
      MoleculeSheet,
      MoleculeSheetContent,
      MoleculeSheetHeader,
      MoleculeSheetTitle,
      MoleculeSheetDescription,
    },
    setup() {
      const toast = useToastStore()
      onMounted(() => toast.showToast('Note saved', 60_000))
    },
    template: `
      <div class="min-h-40">
        <MoleculeSheet :open="true">
          <MoleculeSheetContent>
            <template #header>
              <MoleculeSheetHeader>
                <MoleculeSheetTitle>New note</MoleculeSheetTitle>
                <MoleculeSheetDescription>The toast has to clear this.</MoleculeSheetDescription>
              </MoleculeSheetHeader>
            </template>
            <p class="select-text">Both surfaces are portalled to the body.</p>
          </MoleculeSheetContent>
        </MoleculeSheet>
        <MoleculeToastViewport />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const document_ = canvasElement.ownerDocument
    const body = within(document_.body)

    const sheet = await waitFor(() => body.getByRole('dialog'))
    const viewport = document_.querySelector('[data-slot="toast-viewport"]')
    if (viewport === null) throw new Error('toast viewport missing')

    await step('the toast is on screen while the sheet is open', async () => {
      await expect(viewport).toHaveTextContent('Note saved')
    })

    await step('and it is layered above it', async () => {
      const above = Number(globalThis.getComputedStyle(viewport).zIndex)
      const below = Number(globalThis.getComputedStyle(sheet).zIndex)

      await expect(above).toBeGreaterThan(below)
    })

    await step('which is what a hit test on the toast actually reports', async () => {
      // The assertion the z-index numbers only imply: whatever the DOM order
      // of two portals, this is the element a finger would land on. Tested on
      // the toast rather than on the viewport, because the viewport is
      // `pointer-events-none` by design — it must not swallow taps meant for
      // whatever is behind it.
      const toast = document_.querySelector('[data-slot="toast"]')
      if (toast === null) throw new Error('no toast on screen')

      const box = toast.getBoundingClientRect()
      const hit = document_.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)

      await expect(toast.contains(hit)).toBe(true)
    })
  },
}

export const InteractionContract: Story = {
  render: () => ({
    components: { MoleculeToastViewport },
    setup() {
      const toast = useToastStore()
      return { toast }
    },
    template: `<div class="min-h-40">
      <button type="button" @click="toast.showToast('Note saved', 5000)">Notify</button>
      <button type="button" @click="toast.showToast('Backup written', 5000)">Notify again</button>
      <button type="button" style="position: fixed; bottom: 0; left: 0; right: 0; height: 120px">Underneath</button>
      <MoleculeToastViewport />
    </div>`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const region = body.getByRole('status')
    await expect(document.body.contains(region)).toBe(true)
    await expect(canvasElement.contains(region)).toBe(false)

    await userEvent.click(canvas.getByRole('button', { name: 'Notify' }))
    const focused = document.activeElement
    await expect(region).toHaveTextContent('Note saved')
    await expect(region).toHaveAttribute('aria-live', 'polite')
    await expect(document.activeElement).toBe(focused)

    const box = region.getBoundingClientRect()
    const hit = document.elementFromPoint(box.left + 8, box.bottom - 8)
    await expect(region.contains(hit)).toBe(false)
    await expect(canvas.getByRole('button', { name: 'Underneath' })).toBeVisible()

    await userEvent.click(canvas.getByRole('button', { name: 'Notify again' }))
    await expect(region).toHaveTextContent('Note saved')
    await expect(region).toHaveTextContent('Backup written')
  },
}
