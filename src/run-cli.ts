import { parseArgs } from 'node:util'

import { name, version } from '../package.json' with { type: 'json' }
import { slugify } from './slugify.ts'
import type { SlugifyOptions } from './slugify.ts'

/** Terminal access, injected so tests can run the CLI without spawning a process. */
export interface CliIo {
  readonly stdout: (text: string) => void
  readonly stderr: (text: string) => void
  /** Resolves to piped input, or `undefined` when stdin is an interactive terminal. */
  readonly readStdin: () => Promise<string | undefined>
}

const EXIT_OK = 0
const EXIT_USAGE = 2
const DIGITS = /^\d+$/u

const BIN = name.replace(/^@[^/]+\//u, '')

const HELP = `Usage: ${BIN} [options] <text...>
       echo "some text" | ${BIN} [options]

Turns text into URL-safe slugs. Piped input is read line by line.

Options:
  -s, --separator <text>  Text between words (default: "-")
  -m, --max-length <n>    Maximum slug length
      --keep-case         Keep the original letter case
  -h, --help              Show this help
  -v, --version           Show the version
`

function usageError(message: string, io: CliIo): number {
  io.stderr(`${BIN}: ${message}\nRun '${BIN} --help' for usage.\n`)
  return EXIT_USAGE
}

/**
 * Runs the CLI and resolves to the process exit code: 0 on success, 2 on a usage error.
 * Unexpected errors are thrown, so Node.js prints the stack and exits with 1.
 * It never calls `process.exit`, so it is safe to test.
 */
export async function runCli(argv: readonly string[], io: CliIo): Promise<number> {
  let parsed
  try {
    parsed = parseArgs({
      args: [...argv],
      allowPositionals: true,
      strict: true,
      options: {
        separator: { type: 'string', short: 's', default: '-' },
        'max-length': { type: 'string', short: 'm' },
        'keep-case': { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'v', default: false },
      },
    })
  } catch (error) {
    return usageError(error instanceof Error ? error.message : String(error), io)
  }

  const { values, positionals } = parsed
  if (values.help) {
    io.stdout(HELP)
    return EXIT_OK
  }
  if (values.version) {
    io.stdout(`${version}\n`)
    return EXIT_OK
  }

  const options: { -readonly [K in keyof SlugifyOptions]: SlugifyOptions[K] } = {
    separator: values.separator,
    lowercase: !values['keep-case'],
  }
  const maxLength = values['max-length']
  if (maxLength !== undefined) {
    // Digits only: `Number()` would also accept '', ' 5', '1e2', and '0x10'.
    if (!DIGITS.test(maxLength)) {
      return usageError(`--max-length must be a non-negative integer, received '${maxLength}'`, io)
    }
    options.maxLength = Number(maxLength)
  }

  const input = positionals.length > 0 ? positionals.join(' ') : await io.readStdin()
  const lines = input?.split(/\r?\n/u).filter((line) => line.trim() !== '') ?? []
  if (lines.length === 0) return usageError('no input text', io)

  for (const line of lines) io.stdout(`${slugify(line, options)}\n`)
  return EXIT_OK
}
