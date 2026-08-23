import type { Meta, StoryObj } from '@storybook/vue3-vite'

/**
 * The five elevation levels, rendered from the live custom properties.
 *
 * Names, never values: the swatches below read `--elevation-*` off the
 * document, so this page cannot drift from `src/style.css` the way a copied
 * box-shadow string would. `src/__tests__/architecture/tokenCoverage.test.ts`
 * holds the other half of that rule — a token declared and never shown here
 * fails the architecture tier.
 */
const levels = [
  ['Raised', 'raised', '--elevation-raised', 'A card resting on the background.'],
  ['Sticky', 'sticky', '--elevation-sticky', 'A header or tab bar with content scrolled under it.'],
  [
    'Floating',
    'floating',
    '--elevation-floating',
    'The FAB, and anything else that hovers over content.',
  ],
  ['Sheet', 'sheet', '--elevation-sheet', 'A bottom sheet or drawer. The shadow points up.'],
  ['Overlay', 'overlay', '--elevation-overlay', 'A dialog, menu, or toast.'],
] as const

const meta = {
  title: 'Foundations/Elevation',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Depth is a five-rung ladder, each rung named for the role that owns it.',
          'A sixth level is a design change and needs a reason in docs/design-system.md, not a sixth depth value typed at a call site.',
          'Two rules shape the values: the sheet shadow points *upward*, because a bottom sheet occludes the content above it; and dark mode does not elevate with shadow, because a black shadow on a near-black surface is invisible.',
        ].join(' '),
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function ladder(themeClass: string) {
  return {
    setup: () => ({ levels, themeClass }),
    template: `
      <section :class="[themeClass, 'rounded-xl border bg-background p-6 text-foreground']">
        <h2 class="text-section-title font-semibold">{{ themeClass ? 'Dark elevation' : 'Light elevation' }}</h2>
        <p class="mt-1 text-footnote text-muted-foreground">
          {{ themeClass
            ? 'A hairline light ring on the surface edge, plus an ambient shadow once the surface is genuinely above the page.'
            : 'A shadow cast onto the surface below.' }}
        </p>
        <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="([label, level, token, role]) in levels" :key="level" class="space-y-3">
            <div
              :data-elevation="level"
              class="flex min-h-24 items-center justify-center rounded-xl bg-card p-4 text-card-foreground"
              :style="{ boxShadow: 'var(' + token + ')' }"
            >
              <strong class="text-label">{{ label }}</strong>
            </div>
            <div class="space-y-1">
              <code class="block text-caption text-muted-foreground select-text">shadow-{{ level }} · {{ token }}</code>
              <p class="text-footnote text-muted-foreground">{{ role }}</p>
            </div>
          </article>
        </div>
      </section>
    `,
  }
}

export const Light: Story = { render: () => ladder('') }

/**
 * The story a reviewer has to actually look at. If dark simply reused the
 * light shadows, every card here would be a flat rectangle — which is the
 * failure this token pair exists to prevent.
 */
export const Dark: Story = { render: () => ladder('dark') }

export const SheetPointsUp: Story = {
  render: () => ({
    template: `
      <div class="mx-auto max-w-sm space-y-section">
        <p class="text-footnote text-muted-foreground">
          Same surface, two directions. The right one is what a bottom-anchored
          sheet needs: it occludes the content above it, not below it.
        </p>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <div class="h-16 rounded-md bg-muted"></div>
            <div class="rounded-t-2xl border bg-card p-4 text-center text-caption shadow-overlay">Overlay shadow</div>
          </div>
          <div class="space-y-2">
            <div class="h-16 rounded-md bg-muted"></div>
            <div class="rounded-t-2xl border bg-card p-4 text-center text-caption shadow-sheet">Sheet shadow</div>
          </div>
        </div>
      </div>
    `,
  }),
}
