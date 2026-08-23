import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, waitFor, within } from 'storybook/test'
import AtomAvatar from './AtomAvatar.vue'

/** A 1×1 PNG, inlined so the story never depends on the network. */
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

const meta = {
  title: 'Components/Atoms/Avatar',
  component: AtomAvatar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The fallback is the designed state, not the error state: Reka does not render the image until it has loaded, so on a flaky connection the initials are what people see. `delayMs` stops them flashing for a cached image.',
      },
    },
  },
} satisfies Meta<typeof AtomAvatar>

export default meta
type Story = StoryObj<typeof meta>

export const Fallback: Story = {
  render: () => ({
    components: { AtomAvatar },
    template: `<AtomAvatar :delay-ms="0" class="mx-auto">AO</AtomAvatar>`,
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(within(canvasElement).getByText('AO')).toBeVisible())
  },
}

export const WithImage: Story = {
  render: () => ({
    components: { AtomAvatar },
    setup: () => ({ PIXEL }),
    template: `<AtomAvatar class="mx-auto" :src="PIXEL" alt="Alexander" :delay-ms="0">AO</AtomAvatar>`,
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(within(canvasElement).getByRole('img', { name: 'Alexander' })).toBeVisible(),
    )
  },
}

/**
 * A src that will never resolve. The fallback holds, and there is no broken
 * image glyph — which is the entire point of the component.
 */
export const BrokenImage: Story = {
  render: () => ({
    components: { AtomAvatar },
    template: `<AtomAvatar class="mx-auto" src="/does-not-exist.png" alt="Alexander" :delay-ms="0">AO</AtomAvatar>`,
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(within(canvasElement).getByText('AO')).toBeVisible())
    await expect(within(canvasElement).queryByRole('img')).not.toBeInTheDocument()
  },
}

export const Sizes: Story = {
  render: () => ({
    components: { AtomAvatar },
    template: `
      <div class="flex items-end justify-center gap-4">
        <AtomAvatar :delay-ms="0" class="size-8 text-caption">AO</AtomAvatar>
        <AtomAvatar :delay-ms="0">AO</AtomAvatar>
        <AtomAvatar :delay-ms="0" class="size-14">AO</AtomAvatar>
      </div>
    `,
  }),
}
