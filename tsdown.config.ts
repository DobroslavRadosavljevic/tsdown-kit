import { existsSync } from 'node:fs'

import { defineConfig } from 'tsdown'
import ApiSnapshot from 'tsnapi/rolldown'

// `src/index.ts` is the library API and `src/cli.ts` is the executable. Delete the one you
// do not need (or run `bun run setup`) and the build adapts.
const hasLibrary = existsSync('src/index.ts')
const entry = ['src/index.ts', 'src/cli.ts'].filter((file) => existsSync(file))

export default defineConfig({
  entry,
  // Holds `isolatedDeclarations`, so tsdown generates .d.ts files with Oxc.
  tsconfig: 'src/tsconfig.json',
  platform: 'node',
  // ESM only. Node >=22.12 can `require()` ESM, so CommonJS consumers still work.
  format: 'esm',
  dts: hasLibrary,
  // Writes `exports` and `bin` in package.json from the build output. Commit the result.
  exports: {
    // The CLI is an executable, not an import path.
    exclude: ['cli'],
  },
  publint: { level: 'suggestion' },
  // A CLI-only package has no types to check.
  attw: hasLibrary && { profile: 'esm-only', level: 'error' },
  failOnWarn: 'ci-only',
  // Public API snapshots in `__snapshots__/tsnapi/`. When the API changes, the build fails once
  // and writes the new snapshot. Review the diff and commit it. `bun run build:update-api` also
  // updates them, but refuses breaking changes unless `TSNAPI_ALLOW_BREAKING=1` is set.
  // The CLI entry has no exports, so it has no API to snapshot.
  plugins: [ApiSnapshot({ entryFilter: ({ entryName }) => entryName !== './cli' })],
})
