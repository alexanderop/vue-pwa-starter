import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { NotebookPen, Plus, Settings, Share } from '@lucide/vue'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AtomButton from '@/components/atoms/AtomButton.vue'
import type { NavItem } from '@/types/navigation'
import OrganismBottomNav from './OrganismBottomNav.vue'

const items: ReadonlyArray<NavItem> = [
  { routeName: 'notes', icon: NotebookPen, label: 'Notes' },
  { routeName: 'settings', icon: Settings, label: 'Settings' },
]

const meta = {
  title: 'Components/Organisms/Bottom nav',
  component: OrganismBottomNav,
  tags: ['autodocs'],
  args: { items },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof OrganismBottomNav>

export default meta
type Story = StoryObj<typeof meta>

function navStory(
  path: '/' | '/settings',
  options: { center?: boolean; items?: ReadonlyArray<NavItem> } = {},
) {
  return {
    components: { OrganismBottomNav, AtomButton, Plus },
    setup() {
      const router = useRouter()
      onMounted(async () => {
        await router.replace(path)
      })
      return { items: options.items ?? items, options }
    },
    template: `
      <OrganismBottomNav :items="items">
        <template v-if="options.center" #center-action>
          <AtomButton variant="nav" class="py-2" aria-label="Add a note">
            <span class="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-floating">
              <Plus :size="26" aria-hidden="true" />
            </span>
          </AtomButton>
        </template>
      </OrganismBottomNav>
    `,
  }
}

/**
 * The selected tab. There is no `active` prop to get wrong: the `nav` variant
 * styles `aria-current="page"`, so what a reviewer sees highlighted is exactly
 * what a screen reader announces as the current page.
 */
export const NotesSelected: Story = {
  render: () => navStory('/'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const notes = canvas.getByRole('button', { name: 'Notes' })
    const settings = canvas.getByRole('button', { name: 'Settings' })

    await waitFor(() => expect(notes).toHaveAttribute('aria-current', 'page'))
    await expect(settings).not.toHaveAttribute('aria-current')

    // The highlight is the attribute, not a class the call site remembered.
    await expect(globalThis.getComputedStyle(notes).borderTopWidth).toBe('2px')
    await expect(globalThis.getComputedStyle(settings).borderTopWidth).toBe('0px')
  },
}

export const SettingsSelected: Story = {
  render: () => navStory('/settings'),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(within(canvasElement).getByRole('button', { name: 'Settings' })).toHaveAttribute(
        'aria-current',
        'page',
      ),
    )
  },
}

/** The tabs split around the slot; the slot is not a tab and claims no page. */
export const CenterAction: Story = {
  render: () => navStory('/', { center: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation')

    await expect(
      [...nav.querySelectorAll('button')].map((button) => button.textContent?.trim()),
    ).toEqual(['Notes', '', 'Settings'])
    await expect(canvas.getByRole('button', { name: 'Add a note' })).not.toHaveAttribute(
      'aria-current',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Settings' }))
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Settings' })).toHaveAttribute(
        'aria-current',
        'page',
      ),
    )
  },
}

/**
 * Four tabs and long German labels — the case where a tab bar stops working.
 * Every label stays on one line and every tab keeps an equal share of the row.
 */
export const CrowdedAndTranslated: Story = {
  render: () =>
    navStory('/', {
      items: [
        { routeName: 'notes', icon: NotebookPen, label: 'Notizen' },
        { routeName: 'settings', icon: Settings, label: 'Einstellungen' },
        { routeName: 'notes', icon: Share, label: 'Teilen' },
        { routeName: 'settings', icon: Plus, label: 'Hinzufügen' },
      ],
    }),
  play: async ({ canvasElement }) => {
    const tabs = [...within(canvasElement).getByRole('navigation').querySelectorAll('button')]
    const widths = tabs.map((tab) => Math.round(tab.getBoundingClientRect().width))

    await expect(new Set(widths).size).toBe(1)
    for (const tab of tabs) {
      await expect(globalThis.getComputedStyle(tab).whiteSpace).toBe('nowrap')
    }
  },
}

/**
 * The icon size the tab bar is built around, asserted rather than trusted.
 *
 * 24 px is a lucide `size` *attribute*, and the button base's
 * `[&_svg:not([class*='size-'])]:size-4` would silently overrule it. The `nav`
 * size is the one that never names that rule — this is the assertion that
 * fails if it is ever put back into the base.
 */
export const TouchGeometryContract: Story = {
  tags: ['touch'],
  render: () => navStory('/', { center: true }),
  play: async ({ canvasElement }) => {
    await expect(globalThis.matchMedia('(pointer: coarse)').matches).toBe(true)
    const canvas = within(canvasElement)

    for (const name of ['Notes', 'Add a note', 'Settings']) {
      await expect(
        canvas.getByRole('button', { name }).getBoundingClientRect().height,
      ).toBeGreaterThanOrEqual(44)
    }

    const icon = canvas.getByRole('button', { name: 'Notes' }).querySelector('svg')
    await expect(icon?.getBoundingClientRect().width).toBe(24)
  },
}
