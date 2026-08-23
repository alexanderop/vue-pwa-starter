import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import AtomCard from './AtomCard.vue'

const meta = {
  title: 'Components/Atoms/Card',
  component: AtomCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The surface that owns `--elevation-raised`. One element, no parts — when the contents have a shape, that shape is `MoleculeList`.',
      },
    },
  },
} satisfies Meta<typeof AtomCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { AtomCard },
    template: `<AtomCard class="mx-auto max-w-sm">Everything stays on this device.</AtomCard>`,
  }),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('[data-slot="card"]')
    if (card === null) throw new Error('card missing')

    // The elevation is the token, not a Tailwind default that happens to look
    // similar — `designTokenUsage.test.ts` holds the other end of that rule.
    await expect(globalThis.getComputedStyle(card).boxShadow).not.toBe('none')
    await expect(within(canvasElement).getByText('Everything stays on this device.')).toBeVisible()
  },
}

/** As a link. The press and focus styling belong to the call site. */
export const AsLink: Story = {
  render: () => ({
    components: { AtomCard },
    template: `
      <AtomCard
        as="a"
        href="#card-target"
        class="mx-auto block max-w-sm transition-colors duration-(--duration-fast) hover:bg-accent active:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        Pack charger
      </AtomCard>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'Pack charger' })).toBeVisible()
  },
}

export const Stacked: Story = {
  render: () => ({
    components: { AtomCard },
    template: `
      <div class="mx-auto flex max-w-sm flex-col gap-3">
        <AtomCard>First</AtomCard>
        <AtomCard>Second</AtomCard>
        <AtomCard class="border-destructive/30 bg-destructive/10">Overridden through class</AtomCard>
      </div>
    `,
  }),
}
