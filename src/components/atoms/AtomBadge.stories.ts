import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import AtomBadge from './AtomBadge.vue'

const meta = {
  title: 'Components/Atoms/Badge',
  component: AtomBadge,
  tags: ['autodocs'],
  args: { default: 'On device' },
  render: (args) => ({
    components: { AtomBadge },
    setup: () => ({ args }),
    template: '<AtomBadge v-bind="args">{{ args.default }}</AtomBadge>',
  }),
} satisfies Meta<typeof AtomBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Secondary: Story = {
  args: { variant: 'secondary', default: 'Pinned' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Pinned')).toBeVisible()
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}
export const Outline: Story = { args: { variant: 'outline', default: 'Offline' } }
export const Destructive: Story = { args: { variant: 'destructive', default: 'Delete pending' } }
export const LinkViaAsChild: Story = {
  args: { asChild: true, variant: 'outline', default: 'Open notes' },
  render: (args) => ({
    components: { AtomBadge },
    setup: () => ({ args }),
    template:
      '<AtomBadge v-bind="args"><a href="#notes" class="min-h-touch-target px-2">{{ args.default }}</a></AtomBadge>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', { name: 'Open notes' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('data-slot', 'badge')
    await expect(canvasElement.querySelectorAll('[data-slot="badge"]')).toHaveLength(1)
  },
}
