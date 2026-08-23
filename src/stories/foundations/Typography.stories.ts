import type { Meta, StoryObj } from '@storybook/vue3-vite'

/**
 * The type scale, rendered with the same `text-*` utilities production screens
 * use.
 *
 * The rungs are named for where they belong, not for how big they are: there
 * is no `text-lg` here, because "large" does not tell the next contributor
 * whether it is a section heading or a note body. Each token also carries its
 * own line height — and, where the role implies one, its own weight — so a
 * size does not need a companion class to look right.
 */
const scale = [
  ['text-page-title', 'Route-level h1', 'Notes that stay yours'],
  ['text-section-title', 'In-page h2 or h3', 'Appearance'],
  [
    'text-body',
    'Running prose and note content',
    'Everything is available offline and stored on this device.',
  ],
  [
    'text-callout',
    'Secondary prose inside a card or row',
    'Last edited two minutes ago on this device.',
  ],
  ['text-label', 'Form labels, list-row titles, button text', 'Language'],
  ['text-footnote', 'Supporting text under a row or field', 'You can change this at any time.'],
  ['text-caption', 'Tab labels, badges, timestamps', 'Settings'],
] as const

const meta = {
  title: 'Foundations/Typography',
  parameters: {
    docs: {
      description: {
        component: [
          'Seven semantic rungs in the `--text-*` namespace, each carrying its own `--line-height` and, where the role implies one, its own `--font-weight`.',
          '`--font-sans` is a token too: the system stack is chosen here rather than inherited from a framework default the app never picked.',
        ].join(' '),
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Scale: Story = {
  render: () => ({
    setup: () => ({ scale }),
    template: `
      <div class="mx-auto max-w-2xl space-y-section rounded-xl border bg-background p-6 text-foreground select-text">
        <div v-for="([utility, role, sample]) in scale" :key="utility" class="space-y-1">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4">
            <code class="text-caption text-muted-foreground">{{ utility }}</code>
            <span class="text-footnote text-muted-foreground">{{ role }}</span>
          </div>
          <p :class="utility">{{ sample }}</p>
        </div>
      </div>
    `,
  }),
}

/**
 * Why a readout needs `tabular-nums`: proportional digits are different widths,
 * so a number that ticks reflows the line under it on every change. The pair
 * below is the same string in both settings — watch the decimal point.
 */
export const TabularNumbers: Story = {
  render: () => ({
    template: `
      <div class="mx-auto max-w-sm space-y-4 select-text">
        <div class="rounded-lg border p-4">
          <code class="text-caption text-muted-foreground">tabular-nums</code>
          <p class="mt-1 text-3xl font-semibold tabular-nums">12:48.05</p>
          <p class="text-3xl font-semibold tabular-nums">11:11.11</p>
        </div>
        <div class="rounded-lg border p-4">
          <code class="text-caption text-muted-foreground">proportional (the jitter)</code>
          <p class="mt-1 text-3xl font-semibold">12:48.05</p>
          <p class="text-3xl font-semibold">11:11.11</p>
        </div>
      </div>
    `,
  }),
}
