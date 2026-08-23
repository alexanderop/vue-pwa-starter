import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { usePwaUpdate } from '@/composables/usePwaUpdate'
import MoleculePwaUpdatePrompt from './MoleculePwaUpdatePrompt.vue'

const meta = {
  title: 'Components/Molecules/PWA update prompt',
  component: MoleculePwaUpdatePrompt,
  tags: ['autodocs'],
} satisfies Meta<typeof MoleculePwaUpdatePrompt>

export default meta
type Story = StoryObj<typeof meta>

export const Hidden: Story = {}
export const UpdateAvailable: Story = {
  loaders: [
    () => {
      usePwaUpdate().needRefresh.value = true
    },
  ],
}
