import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import AtomSlider from './AtomSlider.vue'

const meta = {
  title: 'Components/Atoms/Slider',
  component: AtomSlider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A 20px thumb with a 44px hit area, produced by an `::after` pseudo-element rather than by a bigger circle. A 20px drag target is the most common touch-target failure in a web app and it is invisible under a mouse.',
      },
    },
  },
} satisfies Meta<typeof AtomSlider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { AtomSlider },
    setup: () => ({ value: ref([40]) }),
    template: `<AtomSlider v-model="value" class="mx-auto max-w-sm" :max="100" :step="1" :aria-label="'Font size'" />`,
  }),
  play: async ({ canvasElement }) => {
    const thumb = within(canvasElement).getByRole('slider', { name: 'Font size' })

    await expect(thumb).toHaveAttribute('aria-valuenow', '40')

    thumb.focus()
    await userEvent.keyboard('{ArrowRight}')
    await waitFor(() => expect(thumb).toHaveAttribute('aria-valuenow', '41'))
  },
}

export const Range: Story = {
  render: () => ({
    components: { AtomSlider },
    setup: () => ({ value: ref([20, 70]) }),
    template: `<AtomSlider v-model="value" class="mx-auto max-w-sm" :max="100" :aria-label="'Range'" />`,
  }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('slider')).toHaveLength(2)
  },
}

export const Disabled: Story = {
  render: () => ({
    components: { AtomSlider },
    template: `<AtomSlider :model-value="[40]" disabled class="mx-auto max-w-sm" :aria-label="'Disabled'" />`,
  }),
}

/**
 * The 44px floor, measured. The thumb is 20px of paint and 44px of target, so
 * this asserts the pseudo-element rather than the box.
 */
export const TouchTargetContract: Story = {
  tags: ['touch'],
  render: () => ({
    components: { AtomSlider },
    setup: () => ({ value: ref([40]) }),
    template: `<AtomSlider v-model="value" class="mx-auto max-w-sm" :max="100" :aria-label="'Font size'" />`,
  }),
  play: async ({ canvasElement }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)

    const thumb = within(canvasElement).getByRole('slider', { name: 'Font size' })

    // The visible circle stays small…
    await expect(Math.round(thumb.getBoundingClientRect().width)).toBe(20)
    // …and the target does not.
    const target = globalThis.getComputedStyle(thumb, '::after')
    await expect(Number.parseFloat(target.width)).toBeGreaterThanOrEqual(44)
    await expect(Number.parseFloat(target.height)).toBeGreaterThanOrEqual(44)
  },
}
