import { renderApp } from '../helpers/renderApp'
import { AppScreen } from './appScreen'

/**
 * The settings screen (`SettingsView.vue`). Only the a11y tier sweeps it
 * today, so it carries nothing beyond the mount — the door exists so a
 * settings spec starts from `SettingsScreen.open()` like every other tier,
 * and so its controls have an obvious home when one is written.
 */
export class SettingsScreen extends AppScreen {
  static async open(): Promise<SettingsScreen> {
    const app = await renderApp('/settings')
    return new SettingsScreen(app.container, app.cleanup)
  }
}
