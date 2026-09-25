import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/.next/**',
      '**/.output/**',
      '**/dist/**',
      'apps/admin/payload-types.ts',
      'apps/admin/scripts/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // Payload/Nuxt/Vue interop leans on loosely-typed objects (request bodies,
      // Payload doc shapes, block/theme data) throughout this codebase.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // migrate:generate scaffolds up(/down)({ payload, req }) for every migration;
    // most don't use both params and we don't hand-edit generated files for lint.
    files: ['apps/admin/src/migrations/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // 'essential' = correctness rules only. 'recommended' layers on ~30 pure HTML
  // formatting rules (attribute wrapping, indentation, quote style) that would
  // just be noise without a project formatting convention (no Prettier here).
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.browser,
        // Nuxt/Vue auto-imports (no explicit import statements) + this app's
        // own auto-imported composables/utils (apps/web/app/composables,
        // apps/web/app/utils). No @nuxt/eslint module — hand-maintained list;
        // extend it if a new auto-import shows up as a false no-undef.
        ref: 'readonly',
        reactive: 'readonly',
        computed: 'readonly',
        defineProps: 'readonly',
        useHead: 'readonly',
        useSeoMeta: 'readonly',
        useRoute: 'readonly',
        useRuntimeConfig: 'readonly',
        useAsyncData: 'readonly',
        useError: 'readonly',
        createError: 'readonly',
        $fetch: 'readonly',
        useSite: 'readonly',
        mediaUrl: 'readonly',
      },
    },
    rules: {
      'vue/no-v-html': 'warn',
      // File names are Nuxt's page-routing convention (index.vue, [slug].vue, 404.vue)
      // or this project's PascalCase-variant-id convention for block components
      // (blocks/<type>/Default.vue, Split.vue — see docs/developer.md §4) — not
      // freely chosen component names, so the single-word check doesn't apply.
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    files: ['apps/admin/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.flat.recommended.rules,
      // Only the two long-established hooks rules — react-hooks v7's "recommended"
      // also bundles newer React Compiler diagnostics (set-state-in-effect, etc.)
      // that are a separate policy decision, not part of "add lint to CI".
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
    settings: { react: { version: 'detect' } },
  },
)
