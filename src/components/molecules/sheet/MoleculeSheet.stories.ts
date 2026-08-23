import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { element } from '../../../stories/support/dom'
import AtomButton from '@/components/atoms/AtomButton.vue'
import AtomInput from '@/components/atoms/AtomInput.vue'
import AtomLabel from '@/components/atoms/AtomLabel.vue'
import {
  MoleculeSheet,
  MoleculeSheetClose,
  MoleculeSheetContent,
  MoleculeSheetDescription,
  MoleculeSheetFooter,
  MoleculeSheetHandle,
  MoleculeSheetHeader,
  MoleculeSheetTitle,
  MoleculeSheetTrigger,
} from '.'

const subcomponents = {
  MoleculeSheetTrigger,
  MoleculeSheetContent,
  MoleculeSheetHeader,
  MoleculeSheetTitle,
  MoleculeSheetDescription,
  MoleculeSheetFooter,
  MoleculeSheetHandle,
  MoleculeSheetClose,
}

const meta = {
  title: 'Components/Molecules/Sheet',
  component: MoleculeSheet,
  subcomponents,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A bottom sheet on Reka `Drawer`, with a drag handle that actually drags. Use it when the surface is a sheet on every screen; use `MoleculeDialog` when it is a dialog on a wide screen and a sheet only because the screen is narrow. See Guidelines/Sheet or dialog.',
      },
    },
  },
} satisfies Meta<typeof MoleculeSheet>

export default meta
type Story = StoryObj<typeof meta>

const components = { MoleculeSheet, ...subcomponents, AtomButton, AtomInput, AtomLabel }

function sheetStory(options: { open?: boolean; form?: boolean; long?: boolean } = {}) {
  return {
    components,
    setup: () => ({ options }),
    template: `
      <MoleculeSheet :open="options.open">
        <MoleculeSheetTrigger as-child><AtomButton variant="outline">Open sheet</AtomButton></MoleculeSheetTrigger>
        <MoleculeSheetContent>
          <template #header>
            <MoleculeSheetHeader>
              <MoleculeSheetTitle>{{ options.form ? 'Rename note' : 'Stored on this device' }}</MoleculeSheetTitle>
              <MoleculeSheetDescription>Drag the handle down to dismiss.</MoleculeSheetDescription>
            </MoleculeSheetHeader>
          </template>

          <div v-if="options.form" class="flex flex-col gap-2">
            <AtomLabel for="sheet-name">Name</AtomLabel>
            <AtomInput id="sheet-name" model-value="Offline ideas" />
          </div>
          <div v-else-if="options.long" class="space-y-3 select-text">
            <p v-for="paragraph in 30" :key="paragraph">Long content paragraph {{ paragraph }} demonstrates the bounded, scrollable sheet body.</p>
          </div>
          <p v-else class="select-text">The portal, scrim and handle are part of the compound primitive.</p>

          <template #footer>
            <MoleculeSheetFooter>
              <MoleculeSheetClose as-child><AtomButton variant="outline">Cancel</AtomButton></MoleculeSheetClose>
              <MoleculeSheetClose as-child><AtomButton>Save</AtomButton></MoleculeSheetClose>
            </MoleculeSheetFooter>
          </template>
        </MoleculeSheetContent>
      </MoleculeSheet>
    `,
  }
}

/** Closed, then opened from its trigger, then dismissed back to it. */
export const Closed: Story = {
  render: () => sheetStory(),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const trigger = within(canvasElement).getByRole('button', { name: 'Open sheet' })

    await userEvent.click(trigger)
    await waitFor(() =>
      expect(body.getByRole('dialog', { name: 'Stored on this device' })).toBeVisible(),
    )

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
    await expect(trigger).toHaveFocus()
  },
}

export const Open: Story = {
  render: () => sheetStory({ open: true }),
  play: async ({ canvasElement }) => {
    const sheet = within(canvasElement.ownerDocument.body).getByRole('dialog', {
      name: 'Stored on this device',
    })

    await expect(sheet).toHaveAccessibleDescription('Drag the handle down to dismiss.')
    // The scrim is mounted by the content, not by the call site — that is the
    // whole reason it cannot be forgotten.
    await expect(
      canvasElement.ownerDocument.querySelector('[data-slot="sheet-overlay"]'),
    ).not.toBeNull()
  },
}

export const WithForm: Story = { render: () => sheetStory({ open: true, form: true }) }

/**
 * The bounded body. The sheet never grows past the keyboard-adjusted viewport;
 * the content scrolls inside it and the footer stays put.
 */
export const LongContent: Story = {
  render: () => sheetStory({ open: true, long: true }),
  play: async ({ canvasElement, step }) => {
    const document_ = canvasElement.ownerDocument
    const sheet = within(document_.body).getByRole('dialog')
    const scroller = element(document_, '[data-slot="sheet-body"]')
    const footer = element(document_, '[data-slot="sheet-footer"]')

    await step('the body scrolls rather than the sheet growing', async () => {
      await expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight)
      await expect(sheet.getBoundingClientRect().height).toBeLessThanOrEqual(
        document_.defaultView?.innerHeight ?? 0,
      )
    })

    await step('the footer stays inside the sheet at every scroll position', async () => {
      scroller.scrollTop = scroller.scrollHeight
      await waitFor(() =>
        expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(
          sheet.getBoundingClientRect().bottom + 1,
        ),
      )
    })
  },
}

/**
 * Above the keyboard. Driven through `--keyboard-inset` — the same variable
 * `useKeyboardInset` writes from `visualViewport` — because a real on-screen
 * keyboard is not something a browser test can raise.
 */
export const AboveKeyboard: Story = {
  render: () => sheetStory({ open: true, form: true }),
  play: async ({ canvasElement }) => {
    const document_ = canvasElement.ownerDocument
    const root = document_.documentElement
    const sheet = within(document_.body).getByRole('dialog')

    try {
      const closed = sheet.getBoundingClientRect().bottom
      root.style.setProperty('--keyboard-inset', '260px')

      await waitFor(() => expect(sheet.getBoundingClientRect().bottom).toBeLessThan(closed - 200))
      await expect(within(document_.body).getByLabelText('Name')).toBeVisible()
    } finally {
      root.style.removeProperty('--keyboard-inset')
    }
  },
}

/**
 * The gesture, and the reason this component exists rather than another
 * dialog: a drag past the threshold dismisses the sheet. Tagged `touch`, and
 * it asserts the coarse pointer before it asserts the branch.
 *
 * The last step is not decoration. A dismissal reachable only by dragging is
 * unreachable for keyboard and switch users, so the non-gesture equivalent is
 * asserted here rather than left to a reviewer to notice — docs/design-system.md.
 */
export const SwipeDismiss: Story = {
  tags: ['touch'],
  render: () => sheetStory({ open: true }),
  play: async ({ canvasElement, step }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)

    const document_ = canvasElement.ownerDocument
    const body = within(document_.body)
    const handle = element(document_, '[data-slot="sheet-handle"]')
    const content = element(document_, '[data-slot="sheet-content"]')

    await step('the grip is decoration, not the affordance', async () => {
      // The pointer listener is on the content, not the bar — so a drag that
      // starts anywhere on the sheet works, and the bar is hidden from
      // assistive technology because it is a picture of a gesture.
      await expect(handle).toHaveAttribute('aria-hidden', 'true')
      await expect(handle).toHaveAttribute('data-state', 'open')
    })

    await step('dragging the sheet down dismisses it', async () => {
      const start = content.getBoundingClientRect()

      await userEvent.pointer([
        {
          keys: '[MouseLeft>]',
          target: content,
          coords: { clientX: 195, clientY: start.top + 10 },
        },
        { target: content, coords: { clientX: 195, clientY: start.top + 80 } },
        { target: content, coords: { clientX: 195, clientY: start.top + 200 } },
        { target: content, coords: { clientX: 195, clientY: start.top + 340 } },
        { keys: '[/MouseLeft]' },
      ])

      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
    })

    await step('and so does Escape, so the gesture is never the only way out', async () => {
      await userEvent.click(within(canvasElement).getByRole('button', { name: 'Open sheet' }))
      await waitFor(() => expect(body.getByRole('dialog')).toBeVisible())

      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
    })
  },
}
