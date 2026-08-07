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
      '**/.vitest/**',
      '**/test-results/**',
      '**/playwright-report/**',
    ],
  },

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  {
    name: 'app/rules',
    rules: {
      // Optional props in <script setup lang="ts"> are typed as possibly
      // undefined — forcing a default on every one adds noise, not safety.
      'vue/require-default-prop': 'off',
    },
  },

  {
    name: 'app/ui-primitives',
    files: ['src/components/ui/**/*.vue'],
    rules: {
      // shadcn-style primitives are intentionally named after the element
      // they wrap (Button, Input, Label, …).
      'vue/multi-word-component-names': 'off',
    },
  },

  // oxlint runs first (fast, Rust); this disables the ESLint rules it
  // already covers so the two don't double-report.
  ...oxlint.configs['flat/recommended'],

  // Prettier owns formatting — keep ESLint out of it.
  skipFormatting,
)
