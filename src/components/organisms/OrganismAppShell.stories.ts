import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NotebookPen, Plus, Settings } from '@lucide/vue'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import type { NavItem } from '@/types/navigation'
import OrganismAppShell from './OrganismAppShell.vue'

const items: ReadonlyArray<NavItem> = [
  { routeName: 'notes', icon: NotebookPen, label: 'Notes' },
  { routeName: 'settings', icon: Settings, label: 'Settings' },
]

const meta = {
  title: 'Components/Organisms/App shell',
  component: OrganismAppShell,
  tags: ['autodocs'],
  args: { items },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OrganismAppShell>

export default meta
type Story = StoryObj<typeof meta>

function shellStory(
  path: '/' | '/settings',
  options: { center?: boolean; hidden?: boolean; long?: boolean } = {},
) {
  return {
    components: { OrganismAppShell, Plus },
    setup() {
      const router = useRouter()
      const removeHiddenRoute = options.hidden
        ? router.addRoute({
            path: '/storybook-hidden-navigation',
            name: 'storybook-hidden-navigation',
            component: { template: '<div />' },
            meta: { hideNav: true },
          })
        : undefined
      onMounted(async () => {
        await router.replace(options.hidden ? '/storybook-hidden-navigation' : path)
      })
      onUnmounted(() => {
        removeHiddenRoute?.()
      })
      return { items, options }
    },
    template: `
      <OrganismAppShell :items="items">
        <div class="mx-auto max-w-lg space-y-4 p-4"><h1 id="shell-heading" class="text-page-title font-bold">{{ options.long ? 'Long content' : 'App shell' }}</h1><p v-for="item in (options.long ? 30 : 1)" :key="item" class="select-text">Scrollable route content {{ item }}</p><a v-if="options.long" href="#shell-heading" class="inline-flex min-h-touch-target items-center text-primary underline">Back to top</a></div>
        <template v-if="options.center" #center-action><button type="button" class="flex min-h-touch-target flex-1 items-center justify-center" aria-label="Add a note"><span class="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><Plus /></span></button></template>
      </OrganismAppShell>
    `,
  }
}

export const NotesSelected: Story = { render: () => shellStory('/') }
export const SettingsSelected: Story = {
  render: () => shellStory('/settings'),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(within(canvasElement).getByRole('button', { name: 'Settings' })).toHaveAttribute(
        'aria-current',
        'page',
      ),
    )
  },
}
export const CenterAction: Story = {
  render: () => shellStory('/', { center: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation')
    await expect(
      [...nav.querySelectorAll('button')].map((button) => button.textContent?.trim()),
    ).toEqual(['Notes', '', 'Settings'])
    await userEvent.click(canvas.getByRole('button', { name: 'Settings' }))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Settings' })).toHaveAttribute(
        'aria-current',
        'page',
      ),
    )
  },
}
export const HiddenNavigation: Story = {
  render: () => shellStory('/', { hidden: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Scrollable route content 1')).toBeVisible()
    await waitFor(() => expect(canvas.queryByRole('navigation')).not.toBeInTheDocument())
  },
}
export const LongContent: Story = { render: () => shellStory('/', { long: true }) }
export const TouchNavigationContract: Story = {
  tags: ['touch'],
  render: () => shellStory('/', { center: true }),
  play: async ({ canvasElement }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)
    const canvas = within(canvasElement)
    for (const name of ['Notes', 'Add a note', 'Settings']) {
      await expect(
        canvas.getByRole('button', { name }).getBoundingClientRect().height,
      ).toBeGreaterThanOrEqual(44)
    }
  },
}
