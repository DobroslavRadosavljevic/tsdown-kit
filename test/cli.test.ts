import { describe, expect, it } from 'vitest'

import { version } from '../package.json' with { type: 'json' }
import { runCli } from '../src/run-cli.ts'

async function run(argv: readonly string[], stdin?: string) {
  let stdout = ''
  let stderr = ''
  const code = await runCli(argv, {
    stdout: (text) => {
      stdout += text
    },
    stderr: (text) => {
      stderr += text
    },
    readStdin: async () => stdin,
  })
  return { code, stdout, stderr }
}

describe('cli', () => {
  it('slugifies positional arguments as one text', async () => {
    await expect(run(['Hello', 'World'])).resolves.toStrictEqual({ code: 0, stdout: 'hello-world\n', stderr: '' })
  })

  it('slugifies each piped line', async () => {
    const result = await run([], 'First line\n\nSecond Line\r\n')
    expect(result).toStrictEqual({ code: 0, stdout: 'first-line\nsecond-line\n', stderr: '' })
  })

  it('applies options', async () => {
    const result = await run(['-s', '_', '--max-length', '9', '--keep-case', 'Hello Big World'])
    expect(result.stdout).toBe('Hello_Big\n')
  })

  it('prints help and version', async () => {
    const help = await run(['--help'])
    expect(help.stdout).toContain('Usage:')
    await expect(run(['-v'])).resolves.toStrictEqual({ code: 0, stdout: `${version}\n`, stderr: '' })
  })

  it('exits with 2 on usage errors', async () => {
    const unknown = await run(['--nope'])
    expect(unknown.code).toBe(2)
    expect(unknown.stderr).toContain('--help')

    const noInput = await run([])
    expect(noInput.code).toBe(2)
    const badLength = await run(['-m', 'ten', 'text'])
    expect(badLength.code).toBe(2)
  })

  it.each(['', ' 5', '1e2', '0x10', '-1', '1.5'])('rejects --max-length %j', async (value) => {
    const result = await run(['--max-length', value, 'text'])
    expect(result.code).toBe(2)
    expect(result.stdout).toBe('')
  })
})
