import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { MoreHorizontal } from '@lucide/vue'
import { expect, waitFor, within } from 'storybook/test'
import AtomButton from '@/components/atoms/AtomButton.vue'
import TemplatePageLayout from './TemplatePageLayout.vue'

const meta = {
  title: 'Components/Templates/Page layout',
  component: TemplatePageLayout,
  tags: ['autodocs'],
  args: { title: 'Settings', showBack: false, scrollable: true },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TemplatePageLayout>

export default meta
type Story = StoryObj<typeof meta>
type StoryArgs = NonNullable<Story['args']>

const content =
  '<div class="mx-auto max-w-lg space-y-4 p-4"><section v-for="item in count" :key="item" class="rounded-lg border p-4"><h2 :id="item === 1 ? \'layout-start\' : undefined" class="font-semibold">Section {{ item }}</h2><p class="mt-2 text-sm text-muted-foreground select-text">Page content belongs in the template slots.</p></section><a v-if="count > 2" href="#layout-start" class="inline-flex min-h-touch-target items-center text-primary underline">Back to first section</a></div>'

function layoutStory(
  args: StoryArgs,
  options: { count?: number; footer?: boolean; actions?: boolean } = {},
) {
  return {
    components: { AtomButton, MoreHorizontal, TemplatePageLayout },
    setup: () => ({ args, count: options.count ?? 2, options }),
    template: `<div class="h-dvh"><TemplatePageLayout v-bind="args">
      <template v-if="options.actions" #header-actions><AtomButton size="icon" variant="ghost" aria-label="More actions"><MoreHorizontal /></AtomButton></template>
      ${content}
      <template v-if="options.footer" #footer><div class="p-4"><AtomButton class="w-full">Continue</AtomButton></div></template>
    </TemplatePageLayout></div>`,
  }
}

function contentRegion(canvasElement: HTMLElement): HTMLElement {
  const region = canvasElement.querySelector('.overflow-y-auto, .overflow-hidden')
  if (!(region instanceof HTMLElement)) throw new Error('page content region not found')
  return region
}

export const Root: Story = {
  render: (args) => layoutStory(args),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('contentinfo')).not.toBeInTheDocument()
  },
}
export const Detail: Story = {
  args: {
    title: 'Note details',
    subtitle: 'Edited just now',
    showBack: true,
    preventNavigation: true,
  },
  render: (args) => layoutStory(args, { actions: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Note details' })).toBeVisible()
    await expect(canvas.getByText('Edited just now')).toBeVisible()
    const action = canvas.getByRole('button', { name: 'More actions' })
    const box = action.getBoundingClientRect()
    await expect(box.left).toBeGreaterThanOrEqual(0)
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth)
  },
}
export const Footer: Story = {
  render: (args) => layoutStory(args, { footer: true }),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Continue' })).toBeVisible()
  },
}
export const Scrolling: Story = {
  render: (args) => layoutStory(args, { count: 16, footer: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const region = contentRegion(canvasElement)
    await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight)
    const headerTop = canvas.getByRole('banner').getBoundingClientRect().top
    const footerTop = canvas.getByRole('contentinfo').getBoundingClientRect().top
    region.scrollTop = region.scrollHeight
    await waitFor(() => expect(region.scrollTop).toBeGreaterThan(0))
    await expect(canvas.getByRole('banner').getBoundingClientRect().top).toBe(headerTop)
    await expect(canvas.getByRole('contentinfo').getBoundingClientRect().top).toBe(footerTop)
    await expect(getComputedStyle(region).overscrollBehaviorY).toBe('contain')
  },
}
export const NonScrolling: Story = {
  args: { scrollable: false },
  render: (args) => layoutStory(args, { footer: true }),
  play: async ({ canvasElement }) => {
    await expect(getComputedStyle(contentRegion(canvasElement)).overflowY).toBe('hidden')
  },
}
