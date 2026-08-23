import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import {
  MoleculeNumericInput,
  MoleculeNumericInputBody,
  MoleculeNumericInputCancel,
  MoleculeNumericInputConfirm,
  MoleculeNumericInputContent,
  MoleculeNumericInputControls,
  MoleculeNumericInputDescription,
  MoleculeNumericInputDisplay,
  MoleculeNumericInputHandle,
  MoleculeNumericInputHeader,
  MoleculeNumericInputKeypad,
  MoleculeNumericInputPresets,
  MoleculeNumericInputTitle,
  MoleculeNumericInputTrigger,
} from '.'

const subcomponents = {
  MoleculeNumericInputTrigger,
  MoleculeNumericInputContent,
  MoleculeNumericInputHandle,
  MoleculeNumericInputHeader,
  MoleculeNumericInputTitle,
  MoleculeNumericInputDescription,
  MoleculeNumericInputBody,
  MoleculeNumericInputDisplay,
  MoleculeNumericInputPresets,
  MoleculeNumericInputKeypad,
  MoleculeNumericInputControls,
  MoleculeNumericInputCancel,
  MoleculeNumericInputConfirm,
}

const meta = {
  title: 'Components/Molecules/Numeric input',
  component: MoleculeNumericInput,
  subcomponents,
  tags: ['autodocs'],
  args: {
    modelValue: 25,
    open: false,
    options: {
      min: 0,
      max: 100,
      maximumFractionDigits: 2,
      presetStep: 5,
      presetRange: 10,
    },
  },
} satisfies Meta<typeof MoleculeNumericInput>

export default meta
type Story = StoryObj<typeof meta>
type StoryArgs = NonNullable<Story['args']>

function numericStory(args: StoryArgs) {
  return {
    components: { MoleculeNumericInput, ...subcomponents },
    setup() {
      const value = ref(Number(args.modelValue ?? 25))
      const open = ref(Boolean(args.open))
      return { args, open, value }
    },
    template: `
      <MoleculeNumericInput v-model="value" v-model:open="open" :options="args.options" :presets="args.presets">
        <MoleculeNumericInputTrigger unit="kg" class="w-48" />
        <MoleculeNumericInputContent>
          <MoleculeNumericInputHandle />
          <MoleculeNumericInputBody>
            <MoleculeNumericInputHeader>
              <MoleculeNumericInputCancel />
              <MoleculeNumericInputTitle>Target weight</MoleculeNumericInputTitle>
              <MoleculeNumericInputConfirm class="justify-self-end" />
            </MoleculeNumericInputHeader>
            <MoleculeNumericInputDescription>Choose a target weight with presets or the keypad.</MoleculeNumericInputDescription>
            <MoleculeNumericInputDisplay unit="kg" />
            <MoleculeNumericInputControls>
              <MoleculeNumericInputPresets unit="kg" />
              <MoleculeNumericInputKeypad />
            </MoleculeNumericInputControls>
          </MoleculeNumericInputBody>
        </MoleculeNumericInputContent>
      </MoleculeNumericInput>
    `,
  }
}

function numericParts(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  const body = within(canvasElement.ownerDocument.body)
  return {
    body,
    canvas,
    get cancel() {
      return body.getByRole('button', { name: 'Cancel' })
    },
    get confirm() {
      return body.getByRole('button', { name: 'Confirm value' })
    },
    dialog: () => body.queryByRole('dialog', { name: 'Target weight' }),
    get display() {
      return body.getByRole('status', { name: 'Current value' })
    },
    trigger: canvas.getByRole('button', { name: /kg/ }),
  }
}

async function openNumeric(canvasElement: HTMLElement) {
  const parts = numericParts(canvasElement)
  await userEvent.click(parts.trigger)
  await expect(parts.body.getByRole('dialog', { name: 'Target weight' })).toBeVisible()
  return parts
}

async function enterWithKeypad(body: ReturnType<typeof within>, value: string): Promise<void> {
  for (const character of value) {
    const name = character === '.' ? 'Add decimal separator' : character
    await userEvent.click(body.getByRole('button', { name }))
  }
}

async function expectClosed(canvasElement: HTMLElement): Promise<void> {
  const body = within(canvasElement.ownerDocument.body)
  await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
  await waitFor(() => expect(canvasElement).not.toHaveAttribute('aria-hidden'))
}

export const Integer: Story = { render: (args) => numericStory(args) }
export const Decimal: Story = {
  args: {
    modelValue: 72.5,
    options: { min: 40, max: 200, maximumFractionDigits: 1, presetStep: 2.5, presetRange: 5 },
  },
  render: (args) => numericStory(args),
}
export const CustomPresets: Story = {
  args: { modelValue: 20, presets: [5, 10, 15, 20, 30, 50] },
  render: (args) => numericStory(args),
}
export const Minimum: Story = { args: { modelValue: 0 }, render: (args) => numericStory(args) }
export const Maximum: Story = { args: { modelValue: 100 }, render: (args) => numericStory(args) }
export const OpenDrawer: Story = {
  args: { open: true },
  render: (args) => numericStory(args),
  play: async ({ canvasElement }) => {
    const dialog = within(canvasElement.ownerDocument.body).getByRole('dialog', {
      name: 'Target weight',
    })
    await expect(dialog).toHaveAccessibleDescription(
      'Choose a target weight with presets or the keypad.',
    )
  },
}

export const Confirm: Story = {
  render: (args) => numericStory(args),
  play: async ({ canvasElement }) => {
    let parts = await openNumeric(canvasElement)
    await enterWithKeypad(parts.body, '85.5')
    await expect(parts.display).toHaveTextContent('85.5kg')
    await userEvent.click(parts.cancel)
    await expectClosed(canvasElement)
    await expect(parts.trigger).toHaveTextContent('25kg')

    parts = await openNumeric(canvasElement)
    await enterWithKeypad(parts.body, '85.5')
    await userEvent.click(parts.confirm)
    await expectClosed(canvasElement)
    await expect(parts.trigger).toHaveTextContent('85.5kg')
    await expect(parts.trigger).toHaveFocus()
  },
}

export const Cancel: Story = {
  render: (args) => numericStory(args),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: '25 kg' }))
    await userEvent.click(body.getByRole('button', { name: '4' }))
    await userEvent.click(body.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(canvasElement).not.toHaveAttribute('aria-hidden'))
    await expect(canvas.getByRole('button', { name: '25 kg' })).toBeVisible()
  },
}

export const PresetSelectionIsTransactional: Story = {
  args: { modelValue: 20, presets: [17.5, 20, 22.5] },
  render: (args) => numericStory(args),
  play: async ({ canvasElement }) => {
    const parts = await openNumeric(canvasElement)
    await userEvent.click(parts.body.getByRole('button', { name: '22.5 kg' }))
    await expect(parts.display).toHaveTextContent('22.5kg')
    await userEvent.click(parts.cancel)
    await expectClosed(canvasElement)
    await expect(parts.trigger).toHaveTextContent('20kg')
  },
}

export const PhysicalKeyboard: Story = {
  args: { modelValue: 20 },
  render: (args) => numericStory(args),
  play: async ({ canvasElement }) => {
    const parts = await openNumeric(canvasElement)
    const dialog = parts.body.getByRole('dialog', { name: 'Target weight' })
    dialog.focus()
    await userEvent.keyboard('72,5{Enter}')
    await expectClosed(canvasElement)
    await expect(parts.trigger).toHaveTextContent('72.5kg')
  },
}

export const CancelWithKeyboard: Story = {
  render: (args) => numericStory(args),
  play: async ({ canvasElement }) => {
    const parts = await openNumeric(canvasElement)
    await enterWithKeypad(parts.body, '99')
    parts.cancel.focus()
    await expect(parts.cancel).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expectClosed(canvasElement)
    await expect(parts.trigger).toHaveTextContent('25kg')
  },
}

export const EscapeCancels: Story = {
  render: (args) => numericStory(args),
  play: async ({ canvasElement }) => {
    const parts = await openNumeric(canvasElement)
    await enterWithKeypad(parts.body, '99')
    await userEvent.keyboard('{Escape}')
    await expectClosed(canvasElement)
    await expect(parts.trigger).toHaveTextContent('25kg')
  },
}

export const TouchDrawer: Story = {
  tags: ['touch'],
  args: { open: true },
  render: (args) => numericStory(args),
  play: async ({ canvasElement }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)
    const body = within(canvasElement.ownerDocument.body)
    const dialog = body.getByRole('dialog', { name: 'Target weight' })
    await expect(dialog).toBeVisible()
    await expect(dialog.querySelector('input')).not.toBeInTheDocument()
    await expect(dialog).toHaveAttribute('data-swipe-direction', 'down')
    await expect(dialog.querySelector('[data-slot="numeric-input-handle"]')).toBeInTheDocument()

    const undersized = [...dialog.querySelectorAll('button')]
      .map((button) => ({
        height: Math.round(button.getBoundingClientRect().height),
        name: button.getAttribute('aria-label') ?? button.textContent?.trim() ?? '',
        width: Math.round(button.getBoundingClientRect().width),
      }))
      .filter(({ height, width }) => height < 44 || width < 44)
    await expect(undersized).toEqual([])

    for (const element of [
      body.getByRole('status', { name: 'Current value' }),
      body.getByRole('button', { name: 'Confirm value' }),
    ]) {
      await waitFor(() => {
        const box = element.getBoundingClientRect()
        expect(box.top).toBeGreaterThanOrEqual(0)
        expect(box.bottom).toBeLessThanOrEqual(window.innerHeight)
      })
    }
  },
}
