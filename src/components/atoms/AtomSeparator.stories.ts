import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import AtomSeparator from './AtomSeparator.vue'

const meta = {
  title: 'Components/Atoms/Separator',
  component: AtomSeparator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A rule between things. `decorative` decides whether assistive technology hears about it — a purely visual divider that announces itself is noise on every pass.',
      },
    },
  },
} satisfies Meta<typeof AtomSeparator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => ({
    components: { AtomSeparator },
    template: `
      <div class="mx-auto max-w-sm space-y-4">
        <p>Above</p>
        <AtomSeparator />
        <p>Below</p>
      </div>
    `,
  }),
}

export const Vertical: Story = {
  render: () => ({
    components: { AtomSeparator },
    template: `
      <div class="mx-auto flex h-10 max-w-sm items-center gap-4">
        <span>Notes</span>
        <AtomSeparator orientation="vertical" />
        <span>Settings</span>
      </div>
    `,
  }),
}

/**
 * The contract worth asserting: a decorative separator is invisible to
 * assistive technology, and a meaningful one is a `separator`.
 */
export const DecorativeAndMeaningful: Story = {
  render: () => ({
    components: { AtomSeparator },
    template: `
      <div class="mx-auto max-w-sm space-y-4">
        <AtomSeparator data-testid="decorative" decorative />
        <AtomSeparator data-testid="meaningful" :decorative="false" />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getAllByRole('separator')).toHaveLength(1)
    await expect(canvas.getByTestId('decorative')).toHaveAttribute('role', 'none')
    await expect(canvas.getByTestId('meaningful')).toHaveAttribute('role', 'separator')
  },
}
