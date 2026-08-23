import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import MoleculeEmptyState from './MoleculeEmptyState.vue'
import MoleculeSearchField from './MoleculeSearchField.vue'

const meta = {
  title: 'Components/Molecules/Search field',
  component: MoleculeSearchField,
  tags: ['autodocs'],
  args: { label: 'Search notes' },
  parameters: {
    docs: {
      description: {
        component:
          '`type="search"` plus `enterkeyhint="search"` — the pair that gets an iOS keyboard to show a Search key. The native clear affordance is suppressed because it is a ~12px target, and replaced by a 44px button that only exists when there is something to clear.',
      },
    },
  },
} satisfies Meta<typeof MoleculeSearchField>

export default meta
type Story = StoryObj<typeof meta>

const components = { MoleculeSearchField, MoleculeEmptyState }

export const Empty: Story = {
  render: () => ({
    components,
    setup: () => ({ query: ref('') }),
    template: `<MoleculeSearchField v-model="query" label="Search notes" placeholder="Search notes" class="mx-auto max-w-sm" />`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole('searchbox', { name: 'Search notes' })

    await step('it is a search box, and it asks for the right keyboard', async () => {
      await expect(field).toHaveAttribute('type', 'search')
      await expect(field).toHaveAttribute('enterkeyhint', 'search')
    })

    await step('there is no clear button when there is nothing to clear', async () => {
      await expect(
        canvas.queryByRole('button', { name: 'Clear Search notes' }),
      ).not.toBeInTheDocument()
    })
  },
}

export const Typing: Story = {
  render: () => ({
    components,
    setup: () => ({ query: ref('') }),
    template: `<MoleculeSearchField v-model="query" label="Search notes" placeholder="Search notes" class="mx-auto max-w-sm" />`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const field = canvas.getByRole('searchbox', { name: 'Search notes' })

    await userEvent.type(field, 'grocery')

    await step('the clear button appears with the first character', async () => {
      const clear = await waitFor(() => canvas.getByRole('button', { name: 'Clear Search notes' }))
      await expect(clear).toBeVisible()

      await userEvent.click(clear)
      await waitFor(() => expect(field).toHaveValue(''))
      await expect(
        canvas.queryByRole('button', { name: 'Clear Search notes' }),
      ).not.toBeInTheDocument()
    })
  },
}

/** With a result set that is empty — the pairing this component is usually in. */
export const NoResults: Story = {
  render: () => ({
    components,
    setup: () => ({ query: ref('grocery') }),
    template: `
      <div class="mx-auto flex max-w-sm flex-col gap-4">
        <MoleculeSearchField v-model="query" label="Search notes" placeholder="Search notes" />
        <MoleculeEmptyState>
          No notes match “{{ query }}”
          <template #description>Try a shorter search, or clear it to see all 24 notes.</template>
        </MoleculeEmptyState>
      </div>
    `,
  }),
}

/** The clear button clears the 44px floor, which the native one does not. */
export const TouchTargetContract: Story = {
  tags: ['touch'],
  render: () => ({
    components,
    setup: () => ({ query: ref('grocery') }),
    template: `<MoleculeSearchField v-model="query" label="Search notes" class="mx-auto max-w-sm" />`,
  }),
  play: async ({ canvasElement }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)

    const canvas = within(canvasElement)
    const clear = canvas.getByRole('button', { name: 'Clear Search notes' })
    const field = canvas.getByRole('searchbox')

    await expect(clear.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
    await expect(field.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  },
}
