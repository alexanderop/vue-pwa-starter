import { computed, shallowRef } from 'vue'
import type { InstallPlatform } from '../src/lib/installPlatform'

const directPrompt = shallowRef(false)
const installed = shallowRef(false)
const hintVisible = shallowRef(false)
let platform: InstallPlatform = 'other'
let outcome: 'accepted' | 'dismissed' = 'accepted'

export interface StoryInstallState {
  directPrompt?: boolean
  hintVisible?: boolean
  installed?: boolean
  outcome?: 'accepted' | 'dismissed'
  platform?: InstallPlatform
}

/** Configure the public install contract before a PWA story renders. */
export function setStoryInstallState(state: StoryInstallState): void {
  directPrompt.value = state.directPrompt ?? false
  installed.value = state.installed ?? false
  hintVisible.value = state.hintVisible ?? false
  platform = state.platform ?? 'other'
  outcome = state.outcome ?? 'accepted'
}

export function resetInstallPromptState(): void {
  setStoryInstallState({})
}

export function useInstallPrompt() {
  return {
    canInstall: computed(() => directPrompt.value || platform === 'ios'),
    canPromptDirectly: computed(() => directPrompt.value),
    isInstalled: computed(() => installed.value),
    platform,
    hintVisible,
    promptInstall: async (): Promise<'accepted' | 'dismissed' | null> => {
      if (!directPrompt.value) return null
      directPrompt.value = false
      if (outcome === 'accepted') installed.value = true
      return outcome
    },
    dismissHint: (): void => {
      hintVisible.value = false
    },
  }
}
