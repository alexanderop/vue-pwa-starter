import { useDark, useToggle } from '@vueuse/core'

/**
 * Dark mode via VueUse: persists the choice in localStorage, applies the
 * `.dark` class on <html> (which the Tailwind `dark:` variant and the token
 * block in style.css react to), and falls back to the OS preference.
 */
export function useTheme() {
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  return { isDark, toggleDark }
}
