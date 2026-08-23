import type { Ref, ShallowRef } from 'vue'
import { shallowRef, watch } from 'vue'

/**
 * The `tabindex` a scroll region should carry: `0` when nothing inside it can
 * take focus, and nothing otherwise.
 *
 * A scrollable box with no focusable content cannot be scrolled from a
 * keyboard at all — the arrow keys need something focused to act on — so it
 * has to be focusable itself. That is axe's `scrollable-region-focusable`, and
 * a sheet of prose or a list of plain rows is exactly the case it catches.
 *
 * But the condition matters as much as the rule. A region that is *always*
 * focusable becomes the first tabbable node inside a sheet, so autofocus lands
 * on an empty div instead of the first field and every keyboard user pays a
 * stop to get past it. That regression is real and
 * `features/notes/quickAddFocus.spec.ts` is what caught it.
 *
 * Watched on the element rather than read once at mount: a portalled region
 * does not exist when its owner mounts, and reading it there answers "no" for
 * every sheet in the app. Re-read whenever the element appears, which is once
 * per open — content that gains its first focusable child while already on
 * screen is not handled, and does not happen here.
 */
const FOCUSABLE =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable]:not([contenteditable="false"])'

export function useScrollRegionTabIndex(
  element: Readonly<ShallowRef<HTMLElement | null>> | Ref<HTMLElement | null>,
): Readonly<Ref<0 | undefined>> {
  const tabIndex = shallowRef<0 | undefined>(undefined)

  watch(
    element,
    (found) => {
      tabIndex.value = found !== null && found.querySelector(FOCUSABLE) === null ? 0 : undefined
    },
    { immediate: true, flush: 'post' },
  )

  return tabIndex
}
