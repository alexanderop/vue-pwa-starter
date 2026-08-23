import type { Meta, StoryObj } from '@storybook/vue3-vite'

const colorPairs = [
  ['Background', 'background', 'foreground'],
  ['Card', 'card', 'card-foreground'],
  ['Popover', 'popover', 'popover-foreground'],
  ['Primary', 'primary', 'primary-foreground'],
  ['Secondary', 'secondary', 'secondary-foreground'],
  ['Muted', 'muted', 'muted-foreground'],
  ['Accent', 'accent', 'accent-foreground'],
  ['Destructive', 'destructive', 'destructive-foreground'],
  ['Success', 'success', 'success-foreground'],
  ['Warning', 'warning', 'warning-foreground'],
] as const

const meta = {
  title: 'Foundations/Colors',
  parameters: {
    docs: {
      description: {
        component:
          'Every swatch resolves the live CSS custom properties from src/style.css. The catalog contains names and compositions, never copied OKLCH values.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function palette(themeClass: string) {
  return {
    setup: () => ({ colorPairs, themeClass }),
    template: `
      <section :class="[themeClass, 'rounded-xl border bg-background p-6 text-foreground']">
        <h2 class="text-section-title font-semibold">{{ themeClass ? 'Dark palette' : 'Light palette' }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">Resolved from the active semantic CSS variables.</p>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="([label, background, foreground]) in colorPairs"
            :key="background"
            class="overflow-hidden rounded-lg border"
          >
            <div
              class="flex min-h-24 items-end p-4"
              :style="{ backgroundColor: 'var(--' + background + ')', color: 'var(--' + foreground + ')' }"
            >
              <strong>{{ label }}</strong>
            </div>
            <code class="block bg-background p-3 text-xs text-foreground select-text">--{{ background }} / --{{ foreground }}</code>
          </article>
        </div>
      </section>
    `,
  }
}

export const Light: Story = { render: () => palette('') }
export const Dark: Story = { render: () => palette('dark') }

export const SideBySide: Story = {
  render: () => ({
    components: {},
    setup: () => ({ colorPairs }),
    template: `
      <div class="grid gap-4 lg:grid-cols-2">
        <section
          v-for="themeClass in ['', 'dark']"
          :key="themeClass || 'light'"
          :class="[themeClass, 'rounded-xl border bg-background p-5 text-foreground']"
        >
          <h2 class="text-section-title font-semibold">{{ themeClass ? 'Dark' : 'Light' }}</h2>
          <div class="mt-4 space-y-2">
            <div
              v-for="([label, background, foreground]) in colorPairs"
              :key="background"
              class="flex min-h-touch-target items-center justify-between rounded-md border px-3"
              :style="{ backgroundColor: 'var(--' + background + ')', color: 'var(--' + foreground + ')' }"
            >
              <span class="font-medium">{{ label }}</span><code class="text-xs">{{ background }}</code>
            </div>
          </div>
        </section>
      </div>
    `,
  }),
}
