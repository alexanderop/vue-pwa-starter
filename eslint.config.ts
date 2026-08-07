import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import oxlint from 'eslint-plugin-oxlint'
import pluginVue from 'eslint-plugin-vue'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dev-dist/**',
      '**/coverage/**',
      '**/.features-gen/**',
      '**/test-results/**',
      '**/playwright-report/**',
    ],
  },

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  // oxlint runs first (fast, Rust); this disables the ESLint rules it
  // already covers so the two don't double-report.
  ...oxlint.configs['flat/recommended'],

  // Prettier owns formatting — keep ESLint out of it.
  skipFormatting,
)
