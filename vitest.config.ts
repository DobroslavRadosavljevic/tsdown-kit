import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    // Type tests (`*.test-d.ts`) check the public API types with `tsc`. They need the test tsconfig:
    // the root one does not include `test/`, so every type test would pass without a check.
    typecheck: {
      enabled: true,
      include: ['test/**/*.test-d.ts'],
      tsconfig: './test/tsconfig.json',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // The CLI entry only wires `process` to `runCli`; the smoke test covers it.
      exclude: ['src/cli.ts'],
      reporter: ['text', 'lcov'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
})
