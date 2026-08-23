import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { setStoryInstallState } from '../../../.storybook/install-prompt'
import OrganismPwaInstallDialog from './OrganismPwaInstallDialog.vue'

const meta = {
  title: 'Components/Organisms/PWA install dialog',
  component: OrganismPwaInstallDialog,
  tags: ['autodocs'],
  args: { open: true },
} satisfies Meta<typeof OrganismPwaInstallDialog>

export default meta
type Story = StoryObj<typeof meta>

export const ChromiumPrompt: Story = {
  loaders: [() => setStoryInstallState({ directPrompt: true })],
}
export const IosInstructions: Story = { loaders: [() => setStoryInstallState({ platform: 'ios' })] }
export const AndroidInstructions: Story = {
  loaders: [() => setStoryInstallState({ platform: 'android' })],
}
export const UnsupportedBrowser: Story = {
  loaders: [() => setStoryInstallState({ platform: 'other' })],
}
