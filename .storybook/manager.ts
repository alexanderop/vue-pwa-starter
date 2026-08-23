import { addons } from 'storybook/manager-api'
import { vuePwaTheme } from './theme'

addons.setConfig({
  theme: vuePwaTheme,
})
