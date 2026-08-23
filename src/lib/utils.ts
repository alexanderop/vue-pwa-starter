import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * The design system's own scale names, taught to tailwind-merge.
 *
 * tailwind-merge classifies an unknown `text-*` by shape, and a name that is
 * not a t-shirt size or a length falls into the **colour** group. So
 * `cn('text-primary-foreground', 'text-label')` dropped the colour and left
 * the button's label inheriting `--foreground` — white text on the primary
 * fill became near-black on it, at 3.6:1. Nothing about the class list looked
 * wrong; axe found it.
 *
 * The same reasoning covers `--shadow-*`: an unregistered `shadow-sheet` reads
 * as a shadow *colour*, so it would stack with `shadow-raised` instead of
 * replacing it.
 *
 * These lists are the `--text-*` and `--shadow-*` namespaces in
 * `src/style.css`. A token added there and not here is a silent merge bug, so
 * `src/__tests__/architecture/tokenCoverage.test.ts` holds the two in step.
 */
const FONT_SIZES = [
  'page-title',
  'section-title',
  'body',
  'callout',
  'label',
  'footnote',
  'caption',
] as const

const SHADOWS = ['raised', 'sticky', 'floating', 'sheet', 'overlay'] as const

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...FONT_SIZES] }],
      shadow: [{ shadow: [...SHADOWS] }],
    },
  },
})

export function cn(...inputs: Array<ClassValue>): string {
  return twMerge(clsx(inputs))
}
