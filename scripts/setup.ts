/**
 * One-time setup: turns the kit into your package, then deletes itself.
 *
 *   bun run setup
 *   bun run setup --name @me/tool --kind cli --repo me/tool --yes
 *
 * Flags: --name, --description, --author, --repo (owner/name), --kind (library | cli | both), --yes
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'

import { isJsonObject, readPackageJson } from './package-json.ts'

type Kind = 'library' | 'cli' | 'both'

interface Answers {
  readonly name: string
  readonly description: string
  readonly author: string
  readonly repo: string
  readonly kind: Kind
}

const root = path.resolve(import.meta.dirname, '..')
const KINDS: readonly Kind[] = ['library', 'cli', 'both']
// https://github.com/npm/validate-npm-package-name
const NPM_NAME = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/u
const REPO = /^[\w.-]+\/[\w.-]+$/u

function file(relative: string): string {
  return path.join(root, relative)
}

function tryCommand(command: string, args: readonly string[]): string {
  try {
    return execFileSync(command, args, { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

function repoFromGitRemote(): string {
  const url = tryCommand('git', ['remote', 'get-url', 'origin'])
  return /github\.com[:/](?<repo>[\w.-]+\/[\w.-]+?)(?:\.git)?$/u.exec(url)?.groups?.['repo'] ?? ''
}

function isKind(value: string): value is Kind {
  return KINDS.some((kind) => kind === value)
}

function validate(answers: Answers): string[] {
  const errors: string[] = []
  if (!NPM_NAME.test(answers.name) || answers.name.length > 214) errors.push(`invalid npm name '${answers.name}'`)
  if (answers.repo !== '' && !REPO.test(answers.repo)) errors.push(`--repo must look like owner/name`)
  return errors
}

async function collectAnswers(): Promise<Answers> {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      description: { type: 'string' },
      author: { type: 'string' },
      repo: { type: 'string' },
      kind: { type: 'string' },
      yes: { type: 'boolean', short: 'y', default: false },
    },
  })

  const folder = path.basename(root).toLowerCase()
  const defaults = {
    name: values.name ?? (NPM_NAME.test(folder) ? folder : 'my-package'),
    description: values.description ?? '',
    author: values.author ?? tryCommand('git', ['config', 'user.name']),
    repo: values.repo ?? repoFromGitRemote(),
    kind: values.kind ?? 'both',
  }

  if (values.yes || !process.stdin.isTTY) {
    if (!isKind(defaults.kind)) throw new Error(`--kind must be one of ${KINDS.join(', ')}`)
    return { ...defaults, kind: defaults.kind }
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const ask = async (question: string, fallback: string): Promise<string> => {
    const reply = await rl.question(`${question}${fallback === '' ? '' : ` (${fallback})`}: `)
    const answer = reply.trim()
    return answer === '' ? fallback : answer
  }
  try {
    const name = await ask('Package name', defaults.name)
    const description = await ask('Description', defaults.description)
    const author = await ask('Author', defaults.author)
    const repo = await ask('GitHub repo, owner/name', defaults.repo)
    const askKind = async (question: string): Promise<Kind> => {
      const kind = await ask(question, defaults.kind)
      return isKind(kind) ? kind : await askKind(`Please type ${KINDS.join(', ')}`)
    }
    const kind = await askKind(`Kind: ${KINDS.join(' | ')}`)
    return { name, description, author, repo, kind }
  } finally {
    rl.close()
  }
}

function updatePackageJson(answers: Answers): void {
  const pkg = readPackageJson(file('package.json'))
  pkg['name'] = answers.name
  pkg['version'] = '0.0.0'
  pkg['description'] = answers.description
  pkg['keywords'] = []
  pkg['author'] = answers.author
  // `private` stays until the first release (see CONTRIBUTING.md), so nothing is published by accident.
  pkg['private'] = true
  if (answers.repo === '') {
    delete pkg['repository']
    delete pkg['homepage']
    delete pkg['bugs']
  } else {
    pkg['homepage'] = `https://github.com/${answers.repo}#readme`
    pkg['bugs'] = { url: `https://github.com/${answers.repo}/issues` }
    pkg['repository'] = { type: 'git', url: `git+https://github.com/${answers.repo}.git` }
  }
  // Sponsor links point at the repo owner. Without a repo, there is no one to point at.
  const owner = answers.repo.split('/')[0] ?? ''
  if (owner === '') delete pkg['funding']
  else pkg['funding'] = `https://github.com/sponsors/${owner}`
  // tsdown rewrites these on the next build.
  delete pkg['exports']
  delete pkg['bin']
  const { scripts } = pkg
  if (isJsonObject(scripts)) delete scripts['setup']
  writeFileSync(file('package.json'), `${JSON.stringify(pkg, null, 2)}\n`)
}

const UNUSED_FILES: Readonly<Record<Kind, readonly string[]>> = {
  library: ['src/cli.ts', 'src/run-cli.ts', 'test/cli.test.ts'],
  cli: ['src/index.ts', 'test/index.test-d.ts'],
  both: [],
}

function removeUnusedSources(kind: Kind): void {
  for (const relative of UNUSED_FILES[kind]) rmSync(file(relative), { force: true })
}

/** Turns on CI, Release, and Dependabot, which are off in the kit repo. */
function enableWorkflows(): void {
  for (const workflow of ['ci', 'release', 'changeset-status', 'autofix'].map(
    (name) => `.github/workflows/${name}.yml`,
  )) {
    const lines = readFileSync(file(workflow), 'utf-8').split('\n')
    const enabled = lines
      .filter((line) => !line.includes('`bun run setup` removes the `#off ` prefixes'))
      .map((line) => line.replace(/^(?<indent>\s*)#off /u, '$<indent>'))
    writeFileSync(file(workflow), enabled.join('\n'))
  }
  const dependabotPath = file('.github/dependabot.yml')
  const dependabot = readFileSync(dependabotPath, 'utf-8').split('\n')
  const kept = dependabot.filter((line) => !line.includes('`bun run setup` removes this line'))
  writeFileSync(dependabotPath, kept.join('\n'))
}

/** Removes the lines of the agent and contributor docs that name a deleted file. */
function pruneDocs(kind: Kind): void {
  const removed = [...UNUSED_FILES[kind], 'scripts/setup.ts']
  for (const doc of ['AGENTS.md', 'CONTRIBUTING.md']) {
    const lines = readFileSync(file(doc), 'utf-8').split('\n')
    const kept = lines.filter((line) => !removed.some((relative) => line.includes(relative)))
    writeFileSync(file(doc), kept.join('\n'))
  }
}

function updateFunding(repo: string): void {
  const owner = repo.split('/')[0] ?? ''
  if (owner === '') rmSync(file('.github/FUNDING.yml'), { force: true })
  else writeFileSync(file('.github/FUNDING.yml'), `github: [${owner}]\n`)
}

function updateChangesetConfig(repo: string): void {
  const configPath = file('.changeset/config.json')
  const config = readFileSync(configPath, 'utf-8')
  writeFileSync(configPath, config.replace('OWNER/REPO', repo === '' ? 'OWNER/REPO' : repo))
}

function writeLicense(author: string): void {
  const license = readFileSync(file('LICENSE'), 'utf-8')
  const holder = author === '' ? 'the authors' : author
  writeFileSync(
    file('LICENSE'),
    license.replace(/^Copyright \(c\) .*$/mu, `Copyright (c) ${new Date().getFullYear()} ${holder}`),
  )
}

/** Agent Skills names: lowercase letters, digits, and hyphens, and the same as the folder name. */
function skillName(packageName: string): string {
  return packageName
    .replace(/^@[^/]+\//u, '')
    .replaceAll(/[^a-z0-9]+/gu, '-')
    .replaceAll(/^-|-$/gu, '')
}

function skill(answers: Answers, name: string): string {
  const hasLibrary = answers.kind !== 'cli'
  const hasCli = answers.kind !== 'library'
  const bin = answers.name.replace(/^@[^/]+\//u, '')
  const sections = [
    `---\nname: ${name}\ndescription: Use the ${answers.name} package. TODO: say what it does and when an agent should use it.\n---`,
    `# ${answers.name}`,
    `TODO: tell coding agents how to use ${answers.name}: the main API, the options, the errors, and the limits.`,
    `Install it with \`npm install ${answers.name}\`. It is ESM only and needs Node.js 22.12 or newer.`,
  ]
  if (hasLibrary) {
    sections.push(
      '## Library',
      `\`\`\`ts\nimport { slugify } from '${answers.name}'\n\nslugify('Héllo, Wörld!') // 'hello-world'\n\`\`\``,
    )
  }
  if (hasCli) {
    sections.push('## CLI', `\`\`\`sh\nnpx ${answers.name} "Héllo, Wörld!"   # hello-world\n${bin} --help\n\`\`\``)
  }
  return `${sections.join('\n\n')}\n`
}

/** Replaces the kit's agent skill with one named after the new package. */
function writeSkill(answers: Answers): void {
  const name = skillName(answers.name)
  rmSync(file('skills'), { recursive: true, force: true })
  mkdirSync(file(`skills/${name}`), { recursive: true })
  writeFileSync(file(`skills/${name}/SKILL.md`), skill(answers, name))
}

/**
 * The package README. Blocks between `<!-- automd:… -->` markers are filled in by `bun run docs`
 * (automd): npm badges, install commands for each package manager, and API docs from JSDoc.
 */
function readme(answers: Answers): string {
  const bin = answers.name.replace(/^@[^/]+\//u, '')
  const hasLibrary = answers.kind !== 'cli'
  const hasCli = answers.kind !== 'library'
  const ciBadge =
    answers.repo === ''
      ? ''
      : `\n[![CI](https://github.com/${answers.repo}/actions/workflows/ci.yml/badge.svg)](https://github.com/${answers.repo}/actions/workflows/ci.yml)`

  const sections = [
    `# ${answers.name}`,
    `<!-- automd:badges license -->\n<!-- /automd -->${ciBadge}`,
    answers.description === '' ? 'TODO: describe the package.' : answers.description,
    '## Install',
    '<!-- automd:pm-install auto=false -->\n<!-- /automd -->',
  ]
  if (hasLibrary) {
    sections.push(
      '## Usage',
      `\`\`\`ts\nimport { slugify } from '${answers.name}'\n\nslugify('Héllo, Wörld!') // 'hello-world'\n\`\`\``,
      '## API',
      '<!-- automd:jsdocs src="./src/index.ts" -->\n<!-- /automd -->',
    )
  }
  if (hasCli) {
    sections.push('## CLI', `\`\`\`sh\nnpx ${answers.name} "Héllo, Wörld!"   # hello-world\n${bin} --help\n\`\`\``)
  }
  sections.push(
    '## Requirements',
    hasLibrary
      ? 'Node.js 22.12 or newer. The package is ESM-only; CommonJS code can still load it with `require()`.'
      : 'Node.js 22.12 or newer.',
    '## Contributing',
    'See [CONTRIBUTING.md](./CONTRIBUTING.md) for the development setup and the release process.',
    '## License',
    `[MIT](./LICENSE)${answers.author === '' ? '' : ` © ${answers.author}`}`,
  )
  return `${sections.join('\n\n')}\n`
}

function run(command: string, args: readonly string[]): void {
  console.log(`\n$ ${command} ${args.join(' ')}`)
  execFileSync(command, args, { cwd: root, stdio: 'inherit' })
}

const answers = await collectAnswers()
const errors = validate(answers)
if (errors.length > 0) {
  console.error(`Setup stopped:\n${errors.map((error) => `  - ${error}`).join('\n')}`)
  process.exit(1)
}

updatePackageJson(answers)
removeUnusedSources(answers.kind)
pruneDocs(answers.kind)
enableWorkflows()
updateChangesetConfig(answers.repo)
updateFunding(answers.repo)
writeLicense(answers.author)
writeFileSync(file('README.md'), readme(answers))
writeSkill(answers)
rmSync(import.meta.filename)

// The API snapshots name the package, so the next build writes them again.
rmSync(file('__snapshots__'), { recursive: true, force: true })

// Refresh the lockfile (it stores the package name), regenerate exports/bin, sort package.json.
run('bun', ['install'])
run('bun', ['run', 'build'])
run('bun', ['run', 'docs'])
run('bun', ['run', 'format'])

console.log(`
Done. ${answers.name} is ready (${answers.kind}).

Next steps:
  1. Replace the slugify example in src/ and test/ with your code.
  2. Rewrite the agent skill in skills/ for your API. It is only a stub now.
  3. bun run check
  4. git add -A && git commit -m "chore: initial commit"
  5. The package is "private" until you follow "First release" in CONTRIBUTING.md.
`)
if (!existsSync(file('.git'))) console.log('Tip: run `git init` first, the release workflow needs a GitHub repo.')
