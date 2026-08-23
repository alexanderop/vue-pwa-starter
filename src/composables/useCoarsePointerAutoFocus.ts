import { useTouchDevice } from '@/composables/useTouchDevice'

/**
 * A `openAutoFocus` handler that keeps focus on the surface itself under a
 * coarse pointer, instead of letting it land on the first field.
 *
 * Autofocusing a field pops the on-screen keyboard while the surface is still
 * animating in — and the keyboard is exactly what `useKeyboardInset` is
 * measuring, so the surface sizes itself against a viewport moving underneath
 * it. Focus stays on the dialog; the keyboard opens when the user taps a
 * field, which is the moment they asked for it.
 *
 * One app-wide policy rather than a fact each overlay remembers separately: it
 * was written out twice, and the third Drawer surface in the repo simply did
 * not have it. Every modal surface binds this.
 *
 * The returned handler re-emits before deciding, so a consumer's own
 * `@open-auto-focus` listener still runs and can `preventDefault()` first.
 */
export function useCoarsePointerAutoFocus(emit: (event: Event) => void): (event: Event) => void {
  const isTouchDevice = useTouchDevice()

  return (event: Event): void => {
    emit(event)
    if (event.defaultPrevented || !isTouchDevice.value) return

    event.preventDefault()
    if (event.target instanceof HTMLElement) event.target.focus({ preventScroll: true })
  }
}
