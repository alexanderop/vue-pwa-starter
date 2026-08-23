import type { Meta, StoryObj } from '@storybook/vue3-vite'

const meta = {
  title: 'Foundations/Shape and spacing',
  parameters: {
    docs: {
      description: {
        component:
          'Radius, spacing, touch, focus, disabled, press, safe-area, and motion conventions are rendered from the application stylesheet.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const TokensAndStates: Story = {
  render: () => ({
    template: `
      <div class="mx-auto max-w-3xl space-y-section text-foreground">
        <section class="space-y-3">
          <h2 class="text-section-title font-semibold">Radius tokens</h2>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div v-for="radius in ['sm', 'md', 'lg', 'xl']" :key="radius" :class="'rounded-' + radius" class="border bg-card p-5 text-center text-sm">rounded-{{ radius }}</div>
          </div>
        </section>
        <section class="space-y-3">
          <h2 class="text-section-title font-semibold">Section rhythm</h2>
          <div class="space-y-section rounded-xl border p-4">
            <div class="h-8 rounded-md bg-muted"></div><div class="h-8 rounded-md bg-muted"></div><div class="h-8 rounded-md bg-muted"></div>
          </div>
        </section>
        <section class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-xl border p-4"><h2 class="font-semibold">Touch target</h2><div class="mt-3 flex h-touch-target items-center justify-center rounded-md bg-primary px-4 text-primary-foreground pointer-fine:h-10">44 px, then fine-pointer collapse</div></div>
          <div class="rounded-xl border p-4"><h2 class="font-semibold">Interaction states</h2><button class="mt-3 h-touch-target rounded-md border px-4 transition-[color,background-color,scale] active:scale-[0.97] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">Tab or press me</button></div>
        </section>
        <section class="rounded-xl border p-4"><h2 class="font-semibold">Platform conventions</h2><p class="mt-2 text-sm text-muted-foreground">Safe-area utilities clamp environment insets, reduced-motion shortens every animation and transition, and disabled controls use 50% opacity without accepting pointer input.</p></section>
      </div>
    `,
  }),
}
