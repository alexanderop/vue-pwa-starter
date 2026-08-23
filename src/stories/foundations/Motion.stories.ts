import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import AtomButton from '@/components/atoms/AtomButton.vue'

/**
 * Durations and easings, played back rather than described.
 *
 * Every bar animates with `duration-(--duration-…)` — the documented
 * `utility-(<custom-property>)` syntax — so what you see is the token, not a
 * number retyped into a story.
 */
const durations = [
  ['--duration-instant', 'Press feedback. The scale on every button and tab.'],
  ['--duration-fast', 'Colour, opacity, and small state changes.'],
  ['--duration-base', 'In-place layout and size changes.'],
  ['--duration-sheet-in', 'A sheet or drawer arriving.'],
  ['--duration-sheet-out', 'A sheet or drawer leaving — faster than it arrived.'],
] as const

const easings = [
  ['--ease-out-expo', 'Sheet enter. Fast out of the gate, long settle.'],
  ['--ease-drawer', 'Reka Drawer enter, so a swipe hand-off does not jump.'],
  ['--ease-standard', 'Everything else.'],
] as const

const meta = {
  title: 'Foundations/Motion',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Entrance and exit are separate tokens because they are not symmetric: a dismissal should feel faster than a presentation.',
          '`prefers-reduced-motion: reduce` overrides every duration in the app globally — not an opt-in list — so a user who asked the OS for less motion gets it here too, and these bars will simply appear.',
        ].join(' '),
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Durations: Story = {
  render: () => ({
    components: { AtomButton },
    setup() {
      const runs = ref(0)
      return { durations, runs, play: () => (runs.value += 1) }
    },
    template: `
      <section class="mx-auto max-w-2xl space-y-section">
        <button
          type="button"
          class="h-touch-target rounded-md border px-4 text-label transition-[color,background-color,scale] duration-(--duration-instant) select-none touch-manipulation active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden hover:bg-accent"
          @click="play"
        >
          Play the scale
        </button>
        <ul class="space-y-4">
          <li v-for="([token, role]) in durations" :key="token" class="space-y-1">
            <div class="flex items-baseline justify-between gap-4">
              <code class="text-caption select-text">duration-({{ token }})</code>
              <span class="text-footnote text-muted-foreground">{{ role }}</span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-muted">
              <div
                :key="token + runs"
                class="h-full w-full origin-left rounded-full bg-primary ease-standard"
                :style="{ transitionProperty: 'scale', transitionDuration: 'var(' + token + ')', scale: runs % 2 === 0 ? '0 1' : '1 1' }"
              ></div>
            </div>
          </li>
        </ul>
      </section>
    `,
  }),
}

export const Easings: Story = {
  render: () => ({
    setup: () => ({ easings }),
    template: `
      <section class="mx-auto max-w-2xl space-y-4">
        <article v-for="([token, role]) in easings" :key="token" class="rounded-lg border p-4">
          <div class="flex items-baseline justify-between gap-4">
            <code class="text-caption select-text">{{ token.replace('--ease-', 'ease-') }}</code>
            <span class="text-footnote text-muted-foreground">{{ role }}</span>
          </div>
          <p class="mt-2 font-mono text-caption text-muted-foreground select-text">var({{ token }})</p>
        </article>
      </section>
    `,
  }),
}
