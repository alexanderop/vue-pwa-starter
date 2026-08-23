import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { MoreHorizontal } from '@lucide/vue'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AtomButton from '@/components/atoms/AtomButton.vue'
import MoleculePageHeader from './MoleculePageHeader.vue'

const meta = {
  title: 'Components/Molecules/Page header',
  component: MoleculePageHeader,
  tags: ['autodocs'],
  args: { title: 'Notes', showBack: false },
} satisfies Meta<typeof MoleculePageHeader>

export default meta
type Story = StoryObj<typeof meta>

function navigationStory(options: {
  backTo?: string
  preventNavigation?: boolean
  start?: string
}) {
  return {
    components: { MoleculePageHeader },
    setup() {
      const router = useRouter()
      const route = useRoute()
      const announced = ref(false)
      onMounted(async () => {
        await router.push('/')
        await router.push(options.start ?? '/settings')
      })
      return { announced, options, route }
    },
    template:
      '<div><MoleculePageHeader title="Navigation contract" show-back :back-to="options.backTo" :prevent-navigation="options.preventNavigation" @back="announced = true"><template #actions><button type="button">Share</button></template></MoleculePageHeader><output>{{ route.path }}|{{ announced }}</output></div>',
  }
}

export const Root: Story = {}
export const Back: Story = {
  args: { title: 'Note details', showBack: true, preventNavigation: true },
  render: (args) => ({
    components: { MoleculePageHeader },
    setup() {
      const announced = ref(false)
      return { announced, args }
    },
    template:
      '<div><MoleculePageHeader v-bind="args" @back="announced = true" /><p v-if="announced" role="status" class="p-4">Back requested</p></div>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Go back' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Back requested')
  },
}
export const HistoryBack: Story = {
  render: () => navigationStory({}),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('/settings|false'))
    await userEvent.click(canvas.getByRole('button', { name: 'Go back' }))
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('/|true'))
  },
}
export const ExplicitBackTarget: Story = {
  render: () => navigationStory({ backTo: '/settings', start: '/' }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Go back' }))
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('/settings|true'))
  },
}
export const InterceptedBack: Story = {
  render: () => navigationStory({ preventNavigation: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('/settings|false'))
    await userEvent.click(canvas.getByRole('button', { name: 'Go back' }))
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('/settings|true'))
  },
}
export const Subtitle: Story = {
  args: { title: 'Settings', subtitle: 'Stored on this device', showBack: false },
}
export const Actions: Story = {
  args: { title: 'Notes', showBack: false },
  render: (args) => ({
    components: { AtomButton, MoleculePageHeader, MoreHorizontal },
    setup: () => ({ args }),
    template:
      '<MoleculePageHeader v-bind="args"><template #actions><AtomButton size="icon" variant="ghost" aria-label="More actions"><MoreHorizontal /></AtomButton></template></MoleculePageHeader>',
  }),
}
export const LongTitle: Story = {
  args: {
    title: 'A deliberately long page title that truncates before actions collide',
    subtitle: 'Long subtitles remain readable on narrow screens',
    showBack: true,
    preventNavigation: true,
  },
  render: (args) => ({
    components: { MoleculePageHeader },
    setup: () => ({ args }),
    template:
      '<MoleculePageHeader v-bind="args"><template #actions><button type="button">Share</button></template></MoleculePageHeader>',
  }),
  play: async ({ canvasElement }) => {
    const share = within(canvasElement).getByRole('button', { name: 'Share' })
    const box = share.getBoundingClientRect()
    await expect(box.left).toBeGreaterThanOrEqual(0)
    await expect(box.right).toBeLessThanOrEqual(window.innerWidth)
  },
}
