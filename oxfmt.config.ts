import { defineConfig } from 'oxfmt'

export default defineConfig({
  printWidth: 120,
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'always',
  sortImports: {},
  sortPackageJson: true,
  ignorePatterns: [
    'dist/**',
    'coverage/**',
    '__snapshots__/**',
    'docs/.blume/**',
    'docs/.blume-verify/**',
    'docs/dist/**',
    'docs/bun.lock',
    'bun.lock',
    'CHANGELOG.md',
    '.changeset/*.md',
  ],
})
