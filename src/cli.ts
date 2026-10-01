#!/usr/bin/env node
// Executable entry. Keep it thin: all behavior lives in `run-cli.ts`, where tests can reach it.
// tsdown finds the shebang above and writes the `bin` field in package.json.
import process from 'node:process'
import { text } from 'node:stream/consumers'

import { runCli } from './run-cli.ts'

process.exitCode = await runCli(process.argv.slice(2), {
  stdout: (output) => {
    process.stdout.write(output)
  },
  stderr: (output) => {
    process.stderr.write(output)
  },
  readStdin: async () => (process.stdin.isTTY ? undefined : await text(process.stdin)),
})
