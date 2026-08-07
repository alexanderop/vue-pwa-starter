import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { reportWebVitals } from './lib/webVitals'
import { createAppRouter } from './router'
import './style.css'

const app = createApp(App)

// Surface runtime errors that would otherwise fail silently as a blank #app.
app.config.errorHandler = (error, _instance, info) => {
  console.error('[Vue error]', error, info)
}

app.use(i18n)
app.use(createAppRouter())

app.mount('#app')

reportWebVitals()
