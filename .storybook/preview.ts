import type { Decorator, Preview } from '@storybook/vue3-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import { AtomRegistry, registryKey } from '@effect/atom-vue'
import { setup } from '@storybook/vue3-vite'
import { watchEffect } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { i18n, type SupportedLocale } from '../src/i18n'
import { resetAppState } from '../src/__tests__/helpers/reset'
import { createAppRouter } from '../src/router'
import { withDeviceFrame } from './decorators/withDeviceFrame'
import { withKeyboard } from './decorators/withKeyboard'
import '../src/style.css'

setup(async (app, context) => {
  const router = createAppRouter(createMemoryHistory())
  await router.push('/')
  await router.isReady()

  app.provide(registryKey, AtomRegistry.make())
  app.use(i18n)
  app.use(router)

  const locale = context?.globals.locale
  i18n.global.locale.value = locale === 'de' ? 'de' : 'en'
})

const withLocale: Decorator = (_story, context) => ({
  template: '<story />',
  setup() {
    watchEffect(() => {
      const locale: SupportedLocale = context.globals.locale === 'de' ? 'de' : 'en'
      i18n.global.locale.value = locale
    })
  },
})

const preview: Preview = {
  tags: ['test'],
  initialGlobals: {
    locale: 'en',
    theme: 'light',
    // The catalog opens where the product lives, and where CI grades it. Until
    // this line existed the two disagreed: `vitest.config.ts` ran the touch
    // project at 390px while a human browsing the catalog saw desktop width.
    viewport: { value: 'mobile', isRotated: false },
    // Both design aids default to off — see the decorators for why that is a
    // requirement rather than a preference.
    frame: 'off',
    keyboard: 'closed',
  },
  globalTypes: {
    locale: {
      description: 'Application locale',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'de', title: 'Deutsch' },
        ],
        dynamicTitle: true,
      },
    },
    frame: {
      description: 'Phone bezel with notched safe-area insets (a design aid, not proof)',
      toolbar: {
        icon: 'mobile',
        items: [
          { value: 'off', title: 'No frame' },
          { value: 'phone', title: 'Phone frame' },
        ],
        dynamicTitle: true,
      },
    },
    keyboard: {
      description: 'Simulated on-screen keyboard height (a design aid, not proof)',
      toolbar: {
        icon: 'edit',
        items: [
          { value: 'closed', title: 'Keyboard closed' },
          { value: 'open', title: 'Keyboard open' },
        ],
        dynamicTitle: true,
      },
    },
  },
  loaders: [async () => resetAppState()],
  decorators: [
    withThemeByClassName({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
      parentSelector: 'html',
    }),
    withLocale,
    // Outside-in: the keyboard writes a variable on <html> and must be in
    // place before the frame measures anything, and the frame has to wrap the
    // story rather than the other way round.
    withKeyboard,
    withDeviceFrame,
  ],
  parameters: {
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      codePanel: true,
    },
    a11y: {
      test: 'error',
    },
    viewport: {
      options: {
        compactMobile: {
          name: 'Compact mobile',
          styles: { width: '320px', height: '568px' },
          type: 'mobile',
        },
        mobile: {
          name: 'Standard mobile',
          styles: { width: '390px', height: '844px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '834px', height: '1112px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1280px', height: '800px' },
          type: 'desktop',
        },
      },
    },
    options: {
      storySort: {
        order: [
          'Start',
          'Foundations',
          'Guidelines',
          'Components',
          ['Atoms', 'Molecules', 'Organisms', 'Templates'],
          'Patterns',
          'Features',
          ['Notes'],
          'Screens',
        ],
      },
    },
  },
}

export default preview
