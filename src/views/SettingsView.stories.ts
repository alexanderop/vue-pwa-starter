import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, waitFor, within } from 'storybook/test'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import App from '@/App.vue'
import SettingsView from './SettingsView.vue'

const meta = {
  title: 'Screens/Settings',
  component: SettingsView,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SettingsView>

export default meta
type Story = StoryObj<typeof meta>

function settingsStory() {
  return {
    components: { App },
    setup() {
      const router = useRouter()
      onMounted(() => router.replace('/settings'))
    },
    template: '<App />',
  }
}

export const DefaultPreferences: Story = {
  render: settingsStory,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(within(canvasElement).getByRole('heading', { name: 'Settings' })).toBeVisible(),
    )
  },
}
export const GermanLongCopy: Story = {
  globals: { locale: 'de' },
  render: settingsStory,
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(within(canvasElement).getByRole('heading', { name: 'Einstellungen' })).toBeVisible(),
    )
    await expect(
      within(canvasElement).getByText(
        'Alle Daten leben in diesem Browser. Exportiere sie jederzeit — sie gehören dir.',
      ),
    ).toBeVisible()
  },
}
