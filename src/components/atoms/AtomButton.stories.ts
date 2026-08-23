import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ExternalLink, Plus } from '@lucide/vue'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import AtomButton from './AtomButton.vue'

const meta = {
  title: 'Components/Atoms/Button',
  component: AtomButton,
  tags: ['autodocs'],
  args: { default: 'Save note', variant: 'default', size: 'default' },
  render: (args) => ({
    components: { AtomButton },
    setup: () => ({ args }),
    template: '<AtomButton v-bind="args">{{ args.default }}</AtomButton>',
  }),
} satisfies Meta<typeof AtomButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  render: (args) => ({
    components: { AtomButton },
    setup() {
      const saved = ref(false)
      return { args, saved }
    },
    template:
      '<div><AtomButton v-bind="args" @click="saved = true">{{ args.default }}</AtomButton><p v-if="saved" role="status" class="mt-3">Note saved</p></div>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Save note' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Note saved')
    await expect(
      getComputedStyle(canvas.getByRole('button', { name: 'Save note' })).transitionProperty,
    ).toContain('scale')
  },
}

export const Variants: Story = {
  render: () => ({
    components: { AtomButton },
    template: `<div class="flex flex-wrap gap-3">
      <AtomButton>Default</AtomButton><AtomButton variant="secondary">Secondary</AtomButton>
      <AtomButton variant="outline">Outline</AtomButton><AtomButton variant="ghost">Ghost</AtomButton>
      <AtomButton variant="destructive">Destructive</AtomButton>
    </div>`,
  }),
}

export const SizesAndIcon: Story = {
  render: () => ({
    components: { AtomButton, Plus },
    template: `<div class="flex flex-wrap items-center gap-3">
      <AtomButton size="sm">Small</AtomButton><AtomButton>Default</AtomButton><AtomButton size="lg">Large</AtomButton>
      <AtomButton size="icon" aria-label="Add note"><Plus /></AtomButton>
    </div>`,
  }),
  play: async ({ canvasElement }) => {
    const icon = within(canvasElement)
      .getByRole('button', { name: 'Add note' })
      .querySelector('svg')
    if (icon === null) throw new Error('no icon inside the icon button')
    await expect(Math.round(icon.getBoundingClientRect().width)).toBe(16)
  },
}

export const Disabled: Story = {
  render: () => ({
    components: { AtomButton },
    template: '<AtomButton disabled>Saving disabled</AtomButton>',
  }),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Saving disabled' })
    const box = button.getBoundingClientRect()
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    await expect(hit).not.toBe(button)
  },
}

export const AsChildLink: Story = {
  args: { asChild: true, variant: 'outline', default: 'Documentation' },
  render: (args) => ({
    components: { AtomButton, ExternalLink },
    setup: () => ({ args }),
    template:
      '<AtomButton v-bind="args"><a href="#documentation"><ExternalLink />{{ args.default }}</a></AtomButton>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', { name: 'Documentation' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('data-slot', 'button')
    await expect(canvasElement.querySelectorAll('[data-slot="button"]')).toHaveLength(1)
  },
}

export const TouchTargetContract: Story = {
  tags: ['touch'],
  args: { default: 'Touch target' },
  play: async ({ canvasElement }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)
    const button = within(canvasElement).getByRole('button', { name: 'Touch target' })
    await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  },
}
