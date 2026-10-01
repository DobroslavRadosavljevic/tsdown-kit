/**
 * Smoke test for the published package, run against the real tarball.
 *
 * 1. `npm pack` (runs `prepack`, so the build is fresh).
 * 2. Install the tarball into an empty consumer project.
 * 3. `import()` and `require()` every subpath in `exports`.
 * 4. Run every `bin` with `--version` and `--help`.
 * 5. Check that each shipped agent skill has a valid `SKILL.md`.
 *
 * The runtime that runs this script is the runtime under test:
 * `node scripts/smoke.ts` checks Node.js, `bun scripts/smoke.ts` checks Bun.
 */
import { execFileSync, execSync } from 'node:child_process'
import type { StdioOptions } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'

import type { JsonObject } from './package-json.ts'
import { isJsonObject, readPackageJson } from './package-json.ts'

interface Manifest {
  readonly name: string
  readonly exportKeys: readonly string[]
  readonly bins: readonly (readonly [command: string, file: string])[]
}

const root = path.resolve(import.meta.dirname, '..')
const runtime = process.execPath
const isWindows = process.platform === 'win32'

function readManifest(file: string): Manifest {
  const pkg: JsonObject = readPackageJson(file)
  const { name, exports: exportMap, bin } = pkg
  if (typeof name !== 'string') throw new TypeError(`${file} has no "name"`)

  const bins: (readonly [string, string])[] = []
  if (typeof bin === 'string') bins.push([name.replace(/^@[^/]+\//u, ''), bin])
  if (isJsonObject(bin)) {
    for (const command of Object.keys(bin)) {
      const target = bin[command]
      if (typeof target === 'string') bins.push([command, target])
    }
  }
  return { name, exportKeys: isJsonObject(exportMap) ? Object.keys(exportMap) : [], bins }
}

function npm(args: readonly string[], cwd: string): void {
  const stdio: StdioOptions = ['ignore', 'inherit', 'inherit']
  if (!isWindows) {
    execFileSync('npm', args, { cwd, stdio })
    return
  }
  // On Windows npm is a .cmd shim, which needs a shell. Node.js 24 deprecates `args` with
  // `shell: true` (DEP0190), so pass one command string with each argument quoted.
  const command = ['npm', ...args].map((arg) => `"${arg.replaceAll('"', '\\"')}"`).join(' ')
  execSync(command, { cwd, stdio })
}

function run(args: readonly string[], cwd: string): string {
  return execFileSync(runtime, args, { cwd, encoding: 'utf-8' })
}

const work = mkdtempSync(path.join(tmpdir(), 'smoke-'))
try {
  const label = process.versions['bun'] === undefined ? `Node.js ${process.version}` : `Bun ${process.versions['bun']}`
  console.log(`Runtime: ${label} (${runtime})`)

  // `npm pack --json` is not used: the `prepack` build log goes to the same stdout.
  npm(['pack', '--pack-destination', work], root)
  const tarball = readdirSync(work).find((file) => file.endsWith('.tgz'))
  if (tarball === undefined) throw new Error('npm pack did not create a tarball')

  writeFileSync(path.join(work, 'package.json'), JSON.stringify({ name: 'smoke-consumer', private: true }))
  npm(['install', '--no-audit', '--no-fund', '--ignore-scripts', path.join(work, tarball)], work)

  const installedDir = path.join(work, 'node_modules', ...readManifest(path.join(root, 'package.json')).name.split('/'))
  const pkg = readManifest(path.join(installedDir, 'package.json'))

  const subpaths = pkg.exportKeys.filter((key) => !key.endsWith('.json') && !key.includes('*'))
  for (const subpath of subpaths) {
    const specifier = subpath === '.' ? pkg.name : `${pkg.name}/${subpath.slice(2)}`
    const check = `if (Object.keys(m).length === 0) throw new Error('${specifier} has no exports')`
    writeFileSync(path.join(work, 'import.mjs'), `const m = await import('${specifier}')\n${check}\n`)
    writeFileSync(path.join(work, 'require.cjs'), `const m = require('${specifier}')\n${check}\n`)
    run(['import.mjs'], work)
    run(['require.cjs'], work)
    console.log(`✔ import + require '${specifier}'`)
  }

  for (const [command, file] of pkg.bins) {
    const binPath = path.join(installedDir, file)
    const version = run([binPath, '--version'], work).trim()
    run([binPath, '--help'], work)
    console.log(`✔ bin '${command}' --version → ${version}`)
  }

  // Agent skills ship in `skills/<name>/SKILL.md`. The frontmatter `name` must match the folder.
  const skillsDir = path.join(installedDir, 'skills')
  for (const skill of existsSync(skillsDir) ? readdirSync(skillsDir) : []) {
    const lines = readFileSync(path.join(skillsDir, skill, 'SKILL.md'), 'utf-8').split('\n')
    if (lines[0] !== '---' || !lines.includes(`name: ${skill}`)) {
      throw new Error(`skills/${skill}/SKILL.md needs frontmatter with 'name: ${skill}'`)
    }
    console.log(`✔ skill '${skill}'`)
  }

  if (subpaths.length === 0 && pkg.bins.length === 0) {
    throw new Error('The package has no import paths and no bin. Nothing was tested.')
  }
  console.log('Smoke test passed.')
} finally {
  rmSync(work, { recursive: true, force: true })
}
