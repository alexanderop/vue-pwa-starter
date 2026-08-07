import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { requestPersistentStorage } from './lib/persistentStorage'
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

// IndexedDB holds the only copy of the user's data — ask the browser not to
// evict it. Fire-and-forget: the answer never gates the UI.
void requestPersistentStorage()
