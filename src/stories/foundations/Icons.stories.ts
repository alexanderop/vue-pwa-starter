import type { Meta, StoryObj } from '@storybook/vue3-vite'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Delete,
  Download,
  ExternalLink,
  LoaderCircle,
  MoreHorizontal,
  NotebookPen,
  Pin,
  PinOff,
  Plus,
  Settings,
  Share,
  Smartphone,
  SquarePlus,
  Trash2,
  Upload,
  X,
} from '@lucide/vue'

/**
 * The sanctioned icon set and the two sizes it is drawn at.
 *
 * `@lucide/vue` is the only icon dependency (docs/ui-components.md), and the
 * two sizes below were previously written down only inside an
 * `eslint-disable` comment in the app shell. A rule that lives in a suppression
 * comment is a rule nobody can find.
 *
 * The size mechanism matters as much as the number: lucide sets `width`/
 * `height` as *attributes*, so `AtomButton`'s
 * `[&_svg:not([class*='size-'])]:size-4` wins over them unless a call site
 * says `class="size-6"`. Passing `:size="24"` alone inside a button is the bug
 * that variant exists to prevent.
 */
/**
 * One list, not two. The object-literal shorthand makes the import name the
 * key, so adding an icon is one edit and a typo in the label is not
 * expressible.
 */
const icons = {
  Check,
  ChevronDown,
  ChevronLeft,
  Delete,
  Download,
  ExternalLink,
  LoaderCircle,
  MoreHorizontal,
  NotebookPen,
  Pin,
  PinOff,
  Plus,
  Settings,
  Share,
  Smartphone,
  SquarePlus,
  Trash2,
  Upload,
  X,
}

const meta = {
  title: 'Foundations/Icons',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Two sizes: 24 px in the bottom nav, 16 px inside a button.',
          'Nothing else. A third size is a design change, and adding a second icon library is out of scope for this design system.',
          'Every icon is decorative unless it is the only content of a control — a `MoreHorizontal` button needs an `aria-label`; a `Download` beside the word "Export" needs `aria-hidden`.',
        ].join(' '),
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Set: Story = {
  render: () => ({
    setup: () => ({ icons }),
    template: `
      <ul class="grid grid-cols-3 gap-3 sm:grid-cols-5">
        <li v-for="(icon, name) in icons" :key="name" class="flex flex-col items-center gap-2 rounded-lg border p-3">
          <component :is="icon" class="size-6" aria-hidden="true" />
          <code class="text-center text-caption text-muted-foreground select-text">{{ name }}</code>
        </li>
      </ul>
    `,
  }),
}

export const Sizes: Story = {
  render: () => ({
    setup: () => ({ NotebookPen }),
    template: `
      <div class="mx-auto flex max-w-md flex-col gap-6">
        <section class="rounded-lg border p-4">
          <h2 class="text-section-title font-semibold">24 px — bottom nav</h2>
          <p class="mt-1 text-footnote text-muted-foreground">Set with the <code class="select-text">size</code> prop, on a tab that has no button-atom svg rule to fight.</p>
          <div class="mt-4 flex flex-col items-center gap-1 text-primary">
            <component :is="NotebookPen" :size="24" aria-hidden="true" />
            <span class="text-caption">Notes</span>
          </div>
        </section>
        <section class="rounded-lg border p-4">
          <h2 class="text-section-title font-semibold">16 px — inside a button</h2>
          <p class="mt-1 text-footnote text-muted-foreground">The button base already sizes an unclassed svg to 16 px. Nothing to pass.</p>
          <div class="mt-4">
            <span class="inline-flex h-touch-target items-center gap-2 rounded-md border px-4 text-label [&_svg:not([class*='size-'])]:size-4">
              <component :is="NotebookPen" aria-hidden="true" />
              New note
            </span>
          </div>
        </section>
      </div>
    `,
  }),
}
