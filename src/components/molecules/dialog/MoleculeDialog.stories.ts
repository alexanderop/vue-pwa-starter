import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import AtomButton from '@/components/atoms/AtomButton.vue'
import AtomInput from '@/components/atoms/AtomInput.vue'
import AtomLabel from '@/components/atoms/AtomLabel.vue'
import {
  MoleculeDialog,
  MoleculeDialogClose,
  MoleculeDialogContent,
  MoleculeDialogDescription,
  MoleculeDialogFooter,
  MoleculeDialogHeader,
  MoleculeDialogOverlay,
  MoleculeDialogTitle,
  MoleculeDialogTrigger,
} from '.'

const subcomponents = {
  MoleculeDialogTrigger,
  MoleculeDialogContent,
  MoleculeDialogOverlay,
  MoleculeDialogHeader,
  MoleculeDialogTitle,
  MoleculeDialogDescription,
  MoleculeDialogFooter,
  MoleculeDialogClose,
}

const meta = {
  title: 'Components/Molecules/Dialog',
  component: MoleculeDialog,
  subcomponents,
  tags: ['autodocs'],
} satisfies Meta<typeof MoleculeDialog>

export default meta
type Story = StoryObj<typeof meta>

function referenced(element: Element, attribute: string): Element {
  const id = element.getAttribute(attribute)
  if (id === null) throw new Error(`${attribute} is not set`)
  const target = element.ownerDocument.getElementById(id)
  if (target === null) throw new Error(`${attribute}="${id}" points at nothing`)
  return target
}

function dialogStory(options: {
  defaultOpen?: boolean
  destructive?: boolean
  form?: boolean
  long?: boolean
}) {
  return {
    components: { AtomButton, AtomInput, AtomLabel, ...subcomponents, MoleculeDialog },
    setup: () => ({ options }),
    template: `
      <MoleculeDialog :default-open="options.defaultOpen">
        <MoleculeDialogTrigger as-child><AtomButton variant="outline">Open dialog</AtomButton></MoleculeDialogTrigger>
        <MoleculeDialogContent>
          <MoleculeDialogHeader>
            <MoleculeDialogTitle>{{ options.destructive ? 'Delete all local notes?' : options.form ? 'Rename note' : 'Stored on this device' }}</MoleculeDialogTitle>
            <MoleculeDialogDescription>{{ options.destructive ? 'This action cannot be undone.' : 'Dialogs keep focus contained and return it to their trigger.' }}</MoleculeDialogDescription>
          </MoleculeDialogHeader>
          <div v-if="options.form" class="flex flex-col gap-2"><AtomLabel for="dialog-name">Name</AtomLabel><AtomInput id="dialog-name" model-value="Offline ideas" /></div>
          <div v-else-if="options.long" class="space-y-3 select-text"><p v-for="paragraph in 30" :key="paragraph">Long content paragraph {{ paragraph }} demonstrates the bounded, scrollable dialog body.</p></div>
          <p v-else class="select-text">The overlay and portalled content are part of the compound primitive.</p>
          <MoleculeDialogFooter>
            <MoleculeDialogClose as-child><AtomButton variant="outline">Cancel</AtomButton></MoleculeDialogClose>
            <MoleculeDialogClose as-child><AtomButton :variant="options.destructive ? 'destructive' : 'default'">{{ options.destructive ? 'Delete notes' : 'Confirm' }}</AtomButton></MoleculeDialogClose>
          </MoleculeDialogFooter>
        </MoleculeDialogContent>
      </MoleculeDialog>
    `,
  }
}

export const Closed: Story = {
  render: () => dialogStory({}),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const trigger = within(canvasElement).getByRole('button', { name: 'Open dialog' })
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
  render: () => dialogStory({ defaultOpen: true }),
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement.ownerDocument.body).getByRole('dialog', {
      name: 'Stored on this device',
    })
    await expect(dialog).toHaveAccessibleDescription(
      'Dialogs keep focus contained and return it to their trigger.',
    )
    await expect(referenced(dialog, 'aria-labelledby')).toHaveTextContent('Stored on this device')
    await expect(referenced(dialog, 'aria-describedby')).toHaveTextContent(
      'Dialogs keep focus contained and return it to their trigger.',
    )
  },
}
export const Form: Story = { render: () => dialogStory({ defaultOpen: true, form: true }) }
export const LongContent: Story = {
  render: () => dialogStory({ defaultOpen: true, long: true }),
  play: async ({ canvasElement }) => {
    const root = document.documentElement
    root.style.setProperty('--keyboard-inset', `${Math.max(0, window.innerHeight - 200)}px`)
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      const body = canvasElement.ownerDocument.querySelector('[data-slot="dialog-body"]')
      const sheet = canvasElement.ownerDocument.querySelector('[data-slot="dialog-content"]')
      if (!(body instanceof HTMLElement) || !(sheet instanceof HTMLElement)) {
        throw new Error('dialog layout contract not found')
      }
      const confirm = within(canvasElement.ownerDocument.body).getByRole('button', {
        name: 'Confirm',
      })
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight)
      await expect(confirm.getBoundingClientRect().bottom).toBeGreaterThan(
        body.getBoundingClientRect().bottom,
      )
      body.scrollTop = body.scrollHeight
      await waitFor(() =>
        expect(confirm.getBoundingClientRect().bottom).toBeLessThanOrEqual(
          body.getBoundingClientRect().bottom,
        ),
      )
      await expect(
        sheet.getBoundingClientRect().bottom - confirm.getBoundingClientRect().bottom,
      ).toBeGreaterThanOrEqual(24)
    } finally {
      root.style.removeProperty('--keyboard-inset')
    }
  },
}
/**
 * The footer's mobile order, at the width the catalog opens at.
 *
 * `flex-col-reverse` stacks the destructive action above the dismissive one,
 * so Cancel is the button closest to the thumb — the iOS action-sheet order,
 * and the reason the footer is column-*reversed* rather than a plain column.
 * It is only observable below `sm`.
 */
export const DestructiveConfirmation: Story = {
  render: () => dialogStory({ defaultOpen: true, destructive: true }),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const cancel = body.getByRole('button', { name: 'Cancel' })
    const confirm = body.getByRole('button', { name: 'Delete notes' })
    await expect(cancel.getBoundingClientRect().top).toBeGreaterThan(
      confirm.getBoundingClientRect().top,
    )
    await expect(confirm.getBoundingClientRect().left).toBe(cancel.getBoundingClientRect().left)
    await userEvent.click(cancel)
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
  },
}

/**
 * The same footer from `sm:` up, pinned rather than inherited.
 *
 * Before the catalog defaulted to mobile this contract rode on the ambient
 * viewport, which meant it silently stopped being tested the moment the
 * default changed. Naming the viewport in the story is what keeps both halves
 * of a responsive rule graded.
 */
export const DestructiveConfirmationWide: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  render: () => dialogStory({ defaultOpen: true, destructive: true }),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const cancel = body.getByRole('button', { name: 'Cancel' })
    const confirm = body.getByRole('button', { name: 'Delete notes' })
    await expect(confirm.getBoundingClientRect().left).toBeGreaterThan(
      cancel.getBoundingClientRect().left,
    )
    await expect(confirm.getBoundingClientRect().top).toBe(cancel.getBoundingClientRect().top)
  },
}
export const MobileSheet: Story = {
  tags: ['touch'],
  parameters: { viewport: { defaultViewport: 'mobile' } },
  render: () => dialogStory({ defaultOpen: true, form: true }),
  play: async ({ canvasElement }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)
    const dialog = within(canvasElement.ownerDocument.body).getByRole('dialog', {
      name: 'Rename note',
    })
    await expect(dialog).toHaveFocus()
    const body = within(canvasElement.ownerDocument.body)
    const cancel = body.getByRole('button', { name: 'Cancel' })
    const confirm = body.getByRole('button', { name: 'Confirm' })
    await expect(confirm.getBoundingClientRect().top).toBeLessThan(
      cancel.getBoundingClientRect().top,
    )
  },
}
