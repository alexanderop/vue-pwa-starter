import { useEventListener } from '@vueuse/core'

/**
 * Tracks the on-screen keyboard height as a `--keyboard-inset` CSS variable
 * on <html>. Bottom sheets position themselves above the keyboard with
 * `bottom: var(--keyboard-inset, 0px)` — see MobileDialogContent.vue.
 *
 * Call once from App.vue.
 */
export function useKeyboardInset(): void {
  const viewport = globalThis.visualViewport
  if (!viewport) return

  const update = (): void => {
    const inset = Math.max(0, globalThis.innerHeight - viewport.height - viewport.offsetTop)
    document.documentElement.style.setProperty('--keyboard-inset', `${Math.round(inset)}px`)
  }

  useEventListener(viewport, 'resize', update)
  update()
}
