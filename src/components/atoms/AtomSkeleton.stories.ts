import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect } from 'storybook/test'
import AtomSkeleton from './AtomSkeleton.vue'

const meta = {
  title: 'Components/Atoms/Skeleton',
  component: AtomSkeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof AtomSkeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Text: Story = {
  render: () => ({ components: { AtomSkeleton }, template: '<AtomSkeleton class="h-4 w-2/3" />' }),
}
export const LayoutContract: Story = {
  render: () => ({
    components: { AtomSkeleton },
    template: '<AtomSkeleton class="h-24 w-full" />',
  }),
  play: async ({ canvasElement }) => {
    const skeleton = canvasElement.querySelector('[data-slot="skeleton"]')
    if (!(skeleton instanceof HTMLElement)) throw new Error('skeleton not found')
    await expect(Math.round(skeleton.getBoundingClientRect().height)).toBe(96)
    await expect(skeleton.getAnimations()).not.toHaveLength(0)
    await expect(skeleton).toHaveAttribute('aria-hidden', 'true')
  },
}
export const Card: Story = {
  render: () => ({
    components: { AtomSkeleton },
    template: '<AtomSkeleton class="h-28 w-full max-w-md rounded-xl" />',
  }),
}
export const List: Story = {
  render: () => ({
    components: { AtomSkeleton },
    template:
      '<div class="max-w-md space-y-3"><AtomSkeleton v-for="item in 3" :key="item" class="h-20 rounded-lg" /></div>',
  }),
}
export const BusyRegionPattern: Story = {
  render: () => ({
    components: { AtomSkeleton },
    template:
      '<section aria-busy="true" aria-label="Notes" class="max-w-md space-y-3"><AtomSkeleton v-for="item in 3" :key="item" class="h-20 rounded-lg" /></section>',
  }),
}
