import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { setStoryInstallState } from '../../../.storybook/install-prompt'
import OrganismPwaInstallPrompt from './OrganismPwaInstallPrompt.vue'

const meta = {
  title: 'Components/Organisms/PWA install prompt',
  component: OrganismPwaInstallPrompt,
  tags: ['autodocs'],
} satisfies Meta<typeof OrganismPwaInstallPrompt>

export default meta
type Story = StoryObj<typeof meta>

export const ChromiumPrompt: Story = {
  loaders: [() => setStoryInstallState({ directPrompt: true, hintVisible: true })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Install this app')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Install' }))
    await waitFor(() =>
      expect(
        within(canvasElement.ownerDocument.body).getByRole('dialog', { name: 'Install this app' }),
      ).toBeVisible(),
    )
  },
}
export const Dismissed: Story = {
  loaders: [() => setStoryInstallState({ directPrompt: true, hintVisible: false })],
}
export const Unsupported: Story = { loaders: [() => setStoryInstallState({ platform: 'other' })] }
