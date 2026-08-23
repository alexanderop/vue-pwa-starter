import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { element } from '../../../stories/support/dom'
import { ref } from 'vue'
import { MoleculeChip, MoleculeChipRow } from '.'

const subcomponents = { MoleculeChip }

const meta = {
  title: 'Components/Molecules/Chip row',
  component: MoleculeChipRow,
  subcomponents,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A horizontally scrolling row of independent filters. Toggles, not tabs — any number can be on, and each announces its own `aria-pressed`. Native scrolling rather than a custom scroll area, so the platform keeps its momentum and rubber-banding.',
      },
    },
  },
} satisfies Meta<typeof MoleculeChipRow>

export default meta
type Story = StoryObj<typeof meta>

const components = { MoleculeChipRow, ...subcomponents }

const FILTERS = ['Pinned', 'Today', 'This week', 'Shared', 'Archived', 'Has attachments']

export const Filters: Story = {
  render: () => ({
    components,
    setup: () => ({ filters: FILTERS, active: ref<Record<string, boolean>>({ Pinned: true }) }),
    template: `
      <MoleculeChipRow aria-label="Filter notes">
        <MoleculeChip
          v-for="filter in filters"
          :key="filter"
          v-model="active[filter]"
          :aria-label="filter"
        >{{ filter }}</MoleculeChip>
      </MoleculeChipRow>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step('each chip carries its own pressed state', async () => {
      await expect(canvas.getByRole('button', { name: 'Pinned' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      await expect(canvas.getByRole('button', { name: 'Today' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })

    await step('turning one on leaves the others alone — these are not tabs', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Today' }))
      await waitFor(() =>
        expect(canvas.getByRole('button', { name: 'Today' })).toHaveAttribute(
          'aria-pressed',
          'true',
        ),
      )
      await expect(canvas.getByRole('button', { name: 'Pinned' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
  },
}

export const Disabled: Story = {
  render: () => ({
    components,
    template: `
      <MoleculeChipRow aria-label="Filter notes">
        <MoleculeChip aria-label="Pinned">Pinned</MoleculeChip>
        <MoleculeChip disabled aria-label="Archived">Archived</MoleculeChip>
      </MoleculeChipRow>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Archived' })).toBeDisabled()
  },
}

/**
 * The two contracts that make this a mobile component rather than a flex row.
 *
 * `overscroll-x-contain` is the load-bearing one: without it a horizontal
 * fling that reaches the end continues into the browser's back gesture and the
 * user loses the screen. `touch-action: pan-x` is the other half — a
 * mostly-vertical drag keeps scrolling the page instead of being captured
 * here, which is the "must not trap vertical scroll" requirement.
 */
export const OverflowContract: Story = {
  tags: ['touch'],
  render: () => ({
    components,
    setup: () => ({ filters: FILTERS }),
    template: `
      <MoleculeChipRow aria-label="Filter notes" data-testid="row">
        <MoleculeChip v-for="filter in filters" :key="filter" :aria-label="filter">{{ filter }}</MoleculeChip>
      </MoleculeChipRow>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)

    const row = element(canvasElement, '[data-testid="row"]')

    const style = globalThis.getComputedStyle(row)

    await step('it overflows rather than shrinking its chips', async () => {
      await expect(row.scrollWidth).toBeGreaterThan(row.clientWidth)

      const chips = within(canvasElement).getAllByRole('button')
      const top = Math.round(chips[0]?.getBoundingClientRect().top ?? 0)
      for (const chip of chips) {
        await expect(Math.round(chip.getBoundingClientRect().top)).toBe(top)
        await expect(chip.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
      }
    })

    await step('a fling cannot become a back-navigation', async () => {
      await expect(style.overscrollBehaviorX).toBe('contain')
    })

    await step('a vertical drag still belongs to the page', async () => {
      await expect(style.touchAction).toBe('pan-x')
    })
  },
}
