import type { Decorator } from '@storybook/vue3-vite'
import { computed } from 'vue'

/**
 * Paints a phone bezel over the story and gives it a notched device's
 * safe-area insets.
 *
 * The insets work *because* the `safe-area-*` utilities in `src/style.css` are
 * written as `max(var(--safe-top-min, 0px), env(safe-area-inset-top))`. `env()`
 * cannot be faked from CSS or JavaScript, but the clamp floor beneath it can,
 * and setting the floor to what a notched phone reports produces exactly the
 * padding that phone would. The utilities need no change and no test double.
 *
 * The bezel is an overlay, not a box the story sits inside. A frame that added
 * padding and a fixed 844px screen looked right until the first `h-dvh`
 * component went in it: `dvh` resolves against the viewport, not against an
 * ancestor, so the app shell rendered a full viewport tall inside a shorter
 * frame and had its tab labels sliced off. Painting over the story instead
 * means the frame changes no geometry at all — which is also what makes it
 * safe to leave the toolbar control switchable in a tier that measures things.
 *
 * It is a design aid, not evidence. It proves a component reserves space when
 * told to; it cannot prove that iOS reports the inset, that the status bar
 * overlays the right strip, or that a rotated phone pays the side insets.
 * `docs/design-system.md` keeps real safe areas on the manual device
 * checklist, and nothing drawn here weakens that.
 *
 * Off by default, and left off in all three Vitest Storybook projects.
 */

/** iPhone 14 Pro, portrait: the insets the notch and home indicator reserve. */
const SAFE_TOP = '44px'
const SAFE_BOTTOM = '34px'

const BEZEL = '#0b0b0c'
const RADIUS = '40px'

const SCREEN = {
  position: 'relative',
  overflow: 'hidden',
  height: '100dvh',
  borderRadius: RADIUS,
  background: 'var(--background)',
  '--safe-top-min': SAFE_TOP,
  '--safe-bottom-min': SAFE_BOTTOM,
} as const

/** Everything below is decoration; the two floors above are the real output. */
const OVERLAY = {
  position: 'absolute',
  inset: '0',
  pointerEvents: 'none',
  borderRadius: RADIUS,
  boxShadow: `inset 0 0 0 3px ${BEZEL}`,
  zIndex: '2147483647',
} as const

const ISLAND = {
  position: 'absolute',
  top: '10px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '120px',
  height: '30px',
  borderRadius: '999px',
  background: BEZEL,
} as const

const HOME_INDICATOR = {
  position: 'absolute',
  bottom: '9px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '134px',
  height: '5px',
  borderRadius: '999px',
  background: 'currentColor',
  opacity: '0.35',
} as const

export const withDeviceFrame: Decorator = (_story, context) => ({
  setup() {
    return {
      framed: computed(() => context.globals.frame === 'phone'),
      screen: SCREEN,
      overlay: OVERLAY,
      island: ISLAND,
      homeIndicator: HOME_INDICATOR,
    }
  },
  template: `
    <div v-if="framed" :style="screen">
      <story />
      <div :style="overlay" aria-hidden="true">
        <div :style="island"></div>
        <div :style="homeIndicator"></div>
      </div>
    </div>
    <story v-else />
  `,
})
