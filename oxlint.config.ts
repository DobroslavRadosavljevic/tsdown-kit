import { defineConfig } from 'oxlint'
import core from 'ultracite/oxlint/core'
import vitest from 'ultracite/oxlint/vitest'

/**
 * Lint policy: Ultracite's core and vitest presets, then every Oxlint category as an error, then every
 * bellona `bl-js` rule. Rules are only switched off when they contradict another enabled rule,
 * oxfmt, or how an npm package works. Each exception states why.
 */
export default defineConfig({
  extends: [core, vitest],
  jsPlugins: ['bellona/js'],
  categories: {
    correctness: 'error',
    suspicious: 'error',
    perf: 'error',
    pedantic: 'error',
    style: 'error',
    restriction: 'error',
    nursery: 'off',
  },
  options: { typeAware: true },
  // Published code runs on Node.js, not in browsers (Ultracite's core turns `browser` on).
  env: { browser: false, node: true, es2024: true },
  ignorePatterns: [...(core.ignorePatterns ?? []), 'dist/**', 'coverage/**', '__snapshots__/**'],
  rules: {
    // ---- bellona: all bl-js rules ----------------------------------------------------------------
    'bl-js/no-chained-type-assertions': 'error',
    'bl-js/no-generic-module-names': 'error',
    'bl-js/no-inline-import-type': 'error',
    'bl-js/no-known-value-widening': 'error',
    'bl-js/no-module-mocking': 'error',
    'bl-js/no-object-keys-assertion': 'error',
    'bl-js/no-object-parameters': 'error',
    'bl-js/no-runtime-typeof': ['error', { allowInTypeGuards: true }],
    'bl-js/no-shape-in-symbol-names': 'error',
    'bl-js/no-unknown-parameters': 'error',
    'bl-js/no-unknown-returns': 'error',
    'bl-js/no-unknown-type-aliases': 'error',
    'bl-js/no-unsafe-dictionary-type': 'error',
    'bl-js/no-untyped-json': 'error',
    // The package entry point is the public API barrel.
    'bl-js/no-useless-reexport': ['error', { allow: ['src/index.ts'] }],
    'bl-js/no-widen-then-assert': 'error',
    'bl-js/require-file-layout': 'error',
    'bl-js/require-own-key-lookup': 'error',
    'bl-js/require-safety-comment-for-type-assertion': 'error',

    // ---- tuned to the codebase style -------------------------------------------------------------
    // Named function declarations; arrow functions for callbacks (Ultracite prefers expressions).
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    // Braces are optional for one-line bodies; oxfmt keeps them on one line.
    curly: ['error', 'multi-line'],
    // Keys follow semantic order (options, package.json fields), not alphabetical order.
    'sort-keys': 'off',

    // ---- contradictory pairs: keep one side ------------------------------------------------------
    // `typescript/promise-function-async` requires `async` on every promise-returning function;
    // the base rule then rejects the ones without `await`. typescript-eslint says to turn it off.
    'require-await': 'off',
  },
  overrides: [
    {
      // Published code runs on Node.js. Bun-only APIs would break consumers.
      // Library code must not print: only the CLI entry talks to the terminal.
      files: ['src/**'],
      rules: {
        'no-console': 'error',
        'no-restricted-globals': [
          'error',
          { name: 'Bun', message: 'Use Node.js APIs. Published code must run on Node.js.' },
        ],
        'no-restricted-imports': [
          'error',
          { patterns: [{ group: ['bun', 'bun:*'], message: 'Use Node.js APIs. Published code must run on Node.js.' }] },
        ],
      },
    },
  ],
})
