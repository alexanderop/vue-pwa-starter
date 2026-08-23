import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, waitFor, within } from 'storybook/test'
import OrganismOfflineBanner from './OrganismOfflineBanner.vue'

/**
 * The window's own `online`/`offline` events — the public boundary `useOnline`
 * listens on, and the only one a browser test can actually reach. Nothing here
 * stubs `navigator` or touches the composable's internals: a story that sets a
 * private ref proves the ref, not the banner.
 *
 * Dispatched from `play` rather than from `setup`, because the listener does
 * not exist until the component is mounted.
 */
function goOffline(): void {
  globalThis.dispatchEvent(new Event('offline'))
}

function goOnline(): void {
  globalThis.dispatchEvent(new Event('online'))
}

const meta = {
  title: 'Components/Organisms/Offline banner',
  component: OrganismOfflineBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Going offline is not an error in a local-first app, so this is a `warning` that explains rather than a `destructive` that alarms — and it carries no action, because there is nothing for the user to do.',
      },
    },
  },
} satisfies Meta<typeof OrganismOfflineBanner>

export default meta
type Story = StoryObj<typeof meta>

const render = () => ({
  components: { OrganismOfflineBanner },
  template: '<div class="h-40"><OrganismOfflineBanner /></div>',
})

/**
 * Connected. Nothing on screen is the correct state and is worth asserting: a
 * banner that is always there stops being read within a day.
 */
export const Online: Story = {
  render,
  play: async ({ canvasElement }) => {
    goOnline()

    await waitFor(() => expect(within(canvasElement).queryByRole('status')).not.toBeInTheDocument())
  },
}

export const Offline: Story = {
  render,
  play: async ({ canvasElement, step }) => {
    goOffline()

    const banner = await waitFor(() => within(canvasElement).getByRole('status'))

    await step('it explains rather than alarms', async () => {
      await expect(banner).toHaveTextContent('You are offline')
      // `status`, not `alert`: it does not interrupt, because nothing broke.
      await expect(within(canvasElement).queryByRole('alert')).not.toBeInTheDocument()
      // And no action, because there is nothing for the user to do about it.
      await expect(within(canvasElement).queryByRole('button')).not.toBeInTheDocument()
    })
  },
}

/** And it leaves again on its own, without the user dismissing it. */
export const ReturnsOnline: Story = {
  render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    goOffline()
    await waitFor(() => expect(canvas.getByRole('status')).toBeVisible())

    goOnline()
    await waitFor(() => expect(canvas.queryByRole('status')).not.toBeInTheDocument())
  },
}

export const GermanCopy: Story = {
  globals: { locale: 'de' },
  render,
  play: async ({ canvasElement }) => {
    goOffline()

    await waitFor(() =>
      expect(within(canvasElement).getByRole('status')).toHaveTextContent('Du bist offline'),
    )
  },
}
