import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'

/**
 * The six stacking levels, drawn as an overlapping stack.
 *
 * The classes are written out rather than looped, because Tailwind scans
 * source text: a class assembled at runtime is a class that was never
 * compiled. Each panel therefore carries its literal `z-(--z-…)` utility, and
 * the `play` function reads the resolved `z-index` back off the DOM so the
 * *ordering* — which is the actual contract — is asserted rather than
 * eyeballed.
 */
const meta = {
  title: 'Foundations/Layering',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Six levels, ten points apart, consumed through the documented `utility-(<custom-property>)` syntax because z-index is not a Tailwind theme namespace.',
          'The ordering is the contract, not the numbers. Reka portals overlay content to `<body>`, so the scrim and the surface it dims must stay adjacent and above every in-document level, and the toast has to clear both.',
        ].join(' '),
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Stack: Story = {
  render: () => ({
    template: `
      <div class="relative mx-auto h-96 w-full max-w-md rounded-xl border bg-muted/40">
        <div data-level="sticky" class="absolute top-4 left-4 z-(--z-sticky) w-48 rounded-lg border bg-card p-3 text-caption shadow-sticky">
          <code class="select-text">z-(--z-sticky)</code>
          <p class="mt-1 text-muted-foreground">Sticky page header</p>
        </div>
        <div data-level="nav" class="absolute top-16 left-10 z-(--z-nav) w-48 rounded-lg border bg-card p-3 text-caption shadow-sticky">
          <code class="select-text">z-(--z-nav)</code>
          <p class="mt-1 text-muted-foreground">Bottom tab bar</p>
        </div>
        <div data-level="floating" class="absolute top-28 left-16 z-(--z-floating) w-48 rounded-lg border bg-card p-3 text-caption shadow-floating">
          <code class="select-text">z-(--z-floating)</code>
          <p class="mt-1 text-muted-foreground">FAB, bottom prompts</p>
        </div>
        <div data-level="overlay" class="absolute top-40 left-22 z-(--z-overlay) w-48 rounded-lg border bg-card p-3 text-caption shadow-overlay">
          <code class="select-text">z-(--z-overlay)</code>
          <p class="mt-1 text-muted-foreground">Scrim behind a sheet</p>
        </div>
        <div data-level="sheet" class="absolute top-52 left-28 z-(--z-sheet) w-48 rounded-lg border bg-card p-3 text-caption shadow-sheet">
          <code class="select-text">z-(--z-sheet)</code>
          <p class="mt-1 text-muted-foreground">Sheet, drawer, dialog</p>
        </div>
        <div data-level="toast" class="absolute top-64 left-34 z-(--z-toast) w-48 rounded-full bg-foreground px-4 py-2.5 text-caption text-background shadow-overlay">
          <code class="select-text">z-(--z-toast)</code>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const order = ['sticky', 'nav', 'floating', 'overlay', 'sheet', 'toast'] as const

    // The DOM order of the panels is the declaration order, which is not the
    // thing under test — read each one by name so a reshuffled template
    // cannot make a broken ladder pass.
    const panels = new Map(
      [...canvasElement.querySelectorAll('[data-level]')].map((panel) => [
        panel.getAttribute('data-level'),
        panel,
      ]),
    )

    function resolvedLayer(level: string): number {
      const panel = panels.get(level)
      if (!panel) throw new Error(`Layering story renders no panel for --z-${level}`)

      return Number(globalThis.getComputedStyle(panel).zIndex)
    }

    await step('every level resolves to a number', async () => {
      for (const level of order) {
        await expect(Number.isFinite(resolvedLayer(level)), `--z-${level} did not resolve`).toBe(
          true,
        )
      }
    })

    await step('the ladder is strictly increasing', async () => {
      const resolved = order.map(resolvedLayer)

      await expect(resolved).toEqual([...resolved].toSorted((a, b) => a - b))
      await expect(new Set(resolved).size).toBe(order.length)
    })

    await step('the toast clears the sheet', async () => {
      await expect(resolvedLayer('toast')).toBeGreaterThan(resolvedLayer('sheet'))
      await expect(canvas.getByText('z-(--z-toast)')).toBeVisible()
    })
  },
}
