import type { Decorator } from '@storybook/vue3-vite'
import { onScopeDispose, watchEffect } from 'vue'

/**
 * Simulates an open on-screen keyboard by writing `--keyboard-inset` onto
 * `<html>` — the same variable `useKeyboardInset` writes from `visualViewport`,
 * and the same one a sheet reads through `bottom: var(--keyboard-inset, 0px)`.
 *
 * Writing the variable is all this does. It does not shrink the visual
 * viewport, does not move focus, and does not reproduce the iOS pan case that
 * `useKeyboardInset` exists to handle — so, like the device frame, it is a way
 * to *see* the layout, never evidence that the layout is right. Real keyboards
 * stay on the manual device checklist.
 *
 * The height is a representative portrait iPhone keyboard rather than a
 * measurement, and the property is removed on teardown so a story that turned
 * the global on cannot leak it into the next one.
 */
const KEYBOARD_INSET = '336px'

export const withKeyboard: Decorator = (_story, context) => ({
  setup() {
    const root = globalThis.document.documentElement

    watchEffect(() => {
      if (context.globals.keyboard === 'open') {
        root.style.setProperty('--keyboard-inset', KEYBOARD_INSET)
      } else {
        root.style.removeProperty('--keyboard-inset')
      }
    })

    onScopeDispose(() => root.style.removeProperty('--keyboard-inset'))
  },
  template: '<story />',
})
