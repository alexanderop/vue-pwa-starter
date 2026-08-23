import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { MoleculeTabs, MoleculeTabsContent, MoleculeTabsList, MoleculeTabsTrigger } from '.'

const subcomponents = { MoleculeTabsList, MoleculeTabsTrigger, MoleculeTabsContent }

const meta = {
  title: 'Components/Molecules/Tabs',
  component: MoleculeTabs,
  subcomponents,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Panel switching within one screen — not route navigation, which is `OrganismBottomNav`. Reka supplies roving focus, arrow-key traversal and the trigger/panel ARIA pairing; the strip scrolls horizontally rather than wrapping.',
      },
    },
  },
} satisfies Meta<typeof MoleculeTabs>

export default meta
type Story = StoryObj<typeof meta>

const components = { MoleculeTabs, ...subcomponents }

/** The common case, and the only one most screens need. */
export const TwoTabs: Story = {
  render: () => ({
    components,
    template: `
      <MoleculeTabs default-value="all" class="mx-auto max-w-md">
        <MoleculeTabsList>
          <MoleculeTabsTrigger value="all">All notes</MoleculeTabsTrigger>
          <MoleculeTabsTrigger value="pinned">Pinned</MoleculeTabsTrigger>
        </MoleculeTabsList>
        <MoleculeTabsContent value="all">Every note on this device.</MoleculeTabsContent>
        <MoleculeTabsContent value="pinned">Only the pinned ones.</MoleculeTabsContent>
      </MoleculeTabs>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const all = canvas.getByRole('tab', { name: 'All notes' })
    const pinned = canvas.getByRole('tab', { name: 'Pinned' })

    await step('the selected tab says so, and owns the visible panel', async () => {
      await expect(all).toHaveAttribute('aria-selected', 'true')
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Every note on this device.')
      await expect(all).toHaveAttribute('aria-controls', canvas.getByRole('tabpanel').id)
    })

    await step('tapping switches both the state and the panel', async () => {
      await userEvent.click(pinned)
      await waitFor(() => expect(pinned).toHaveAttribute('aria-selected', 'true'))
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Only the pinned ones.')
      await expect(all).toHaveAttribute('aria-selected', 'false')
    })
  },
}

/**
 * Arrow keys, not Tab. A tab strip is one stop in the tab order and the arrows
 * move within it — the behaviour a hand-rolled strip of buttons never has.
 */
export const KeyboardTraversal: Story = {
  render: () => ({
    components,
    template: `
      <MoleculeTabs default-value="all" class="mx-auto max-w-md">
        <MoleculeTabsList>
          <MoleculeTabsTrigger value="all">All</MoleculeTabsTrigger>
          <MoleculeTabsTrigger value="pinned">Pinned</MoleculeTabsTrigger>
          <MoleculeTabsTrigger value="archived">Archived</MoleculeTabsTrigger>
        </MoleculeTabsList>
        <MoleculeTabsContent value="all">All</MoleculeTabsContent>
        <MoleculeTabsContent value="pinned">Pinned</MoleculeTabsContent>
        <MoleculeTabsContent value="archived">Archived</MoleculeTabsContent>
      </MoleculeTabs>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('the strip is a single tab stop', async () => {
      await userEvent.tab()
      await expect(canvas.getByRole('tab', { name: 'All' })).toHaveFocus()
    })

    await step('the arrows move within it', async () => {
      await userEvent.keyboard('{ArrowRight}')
      await waitFor(() => expect(canvas.getByRole('tab', { name: 'Pinned' })).toHaveFocus())

      await userEvent.keyboard('{End}')
      await waitFor(() => expect(canvas.getByRole('tab', { name: 'Archived' })).toHaveFocus())

      await userEvent.keyboard('{Home}')
      await waitFor(() => expect(canvas.getByRole('tab', { name: 'All' })).toHaveFocus())
    })
  },
}

/** A disabled tab is skipped by the arrows rather than focused and refused. */
export const DisabledTab: Story = {
  render: () => ({
    components,
    template: `
      <MoleculeTabs default-value="all" class="mx-auto max-w-md">
        <MoleculeTabsList>
          <MoleculeTabsTrigger value="all">All</MoleculeTabsTrigger>
          <MoleculeTabsTrigger value="archived" disabled>Archived</MoleculeTabsTrigger>
          <MoleculeTabsTrigger value="pinned">Pinned</MoleculeTabsTrigger>
        </MoleculeTabsList>
        <MoleculeTabsContent value="all">All</MoleculeTabsContent>
        <MoleculeTabsContent value="archived">Archived</MoleculeTabsContent>
        <MoleculeTabsContent value="pinned">Pinned</MoleculeTabsContent>
      </MoleculeTabs>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('tab', { name: 'Archived' })).toBeDisabled()

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(canvas.getByRole('tab', { name: 'Pinned' })).toHaveFocus())
  },
}

/**
 * More tabs than a phone is wide. The strip scrolls; it does not wrap to a
 * second row and it does not squeeze the labels — a tab bar that changes
 * height when a label is translated moves everything under it.
 */
export const ManyTabsOverflow: Story = {
  render: () => ({
    components,
    setup: () => ({
      // `value` is baked into the generated element ids, and an id with a
      // space in it is an invalid IDREF for `aria-controls`. Slugs here, human
      // labels in the slot — axe caught the first draft of this story.
      tabs: [
        ['all', 'Alle Notizen'],
        ['pinned', 'Angeheftet'],
        ['archived', 'Archiviert'],
        ['shared', 'Geteilt'],
        ['drafts', 'Entwürfe'],
        ['trash', 'Papierkorb'],
      ],
    }),
    template: `
      <MoleculeTabs default-value="all" class="mx-auto max-w-md">
        <MoleculeTabsList>
          <MoleculeTabsTrigger v-for="([value, label]) in tabs" :key="value" :value="value">{{ label }}</MoleculeTabsTrigger>
        </MoleculeTabsList>
        <MoleculeTabsContent v-for="([value, label]) in tabs" :key="value" :value="value">{{ label }}</MoleculeTabsContent>
      </MoleculeTabs>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const list = within(canvasElement).getByRole('tablist')
    const tabs = within(list).getAllByRole('tab')

    await step('the strip scrolls rather than wrapping', async () => {
      await expect(list.scrollWidth).toBeGreaterThan(list.clientWidth)
      // One row: every tab shares the first one's top edge.
      const top = Math.round(tabs[0]?.getBoundingClientRect().top ?? 0)
      for (const tab of tabs) {
        await expect(Math.round(tab.getBoundingClientRect().top)).toBe(top)
      }
    })

    await step('a horizontal fling does not become a page navigation', async () => {
      await expect(globalThis.getComputedStyle(list).overscrollBehaviorX).toBe('contain')
    })
  },
}
