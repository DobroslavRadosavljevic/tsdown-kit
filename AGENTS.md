# AGENTS.md

## Stack

- TypeScript 7 (native `tsc`), ESM only, published for Node.js `>=22.12`.
- Bun 1.4 is the package manager and script runner. Do not use npm, pnpm, or yarn to install.
- tsdown 0.23 builds `dist/`. Vitest 5 runs tests on Node.js.
- oxlint 1.86 (Ultracite core + vitest presets, all categories, type-aware, bellona `bl-js`) and oxfmt.

## Commands

- Install: `bun install`
- Test (all): `bun run test`
- Test (one file or name): `bunx vitest run test/slugify.test.ts -t "keeps case"`
- Coverage: `bun run test:coverage`
- Lint: `bun run lint` (fix: `bun run lint:fix`)
- Format: `bun run format`
- Types: `bun run typecheck`
- Build: `bun run build`
- Packed-tarball test on Node.js: `bun run smoke`
- Everything CI checks: `bun run check`

Never run `bun test`. It starts Bun's own test runner, not Vitest.

## Communication (ASD-STE100)

Hard rule for all agent text to humans. Also covers names in the codebase. Do not skip for tone, polish, or expertise.

**ASD-STE100 Simplified Technical English** is a controlled writing standard. Aerospace and defense groups made it. It helps people write clear technical text.

**Key rules:**

- **Use approved words only.** Treat simple common English as the word list. Each word has one meaning.
- **Use one word for one idea.** Do not use two words for the same thing.
- **Write short sentences.** Use 20 words or less for instructions. Use 25 words or less for other sentences.
- **Use active voice.** Write "Turn the switch", not "The switch must be turned".
- **Write short paragraphs.** Keep one topic in each paragraph.

**Also:**

- Prefer common verbs: `use`, `start`, `stop`, `show`, `set`, `get`, `fix`, `add`, `remove`.
- Keep exact API names, errors, paths, and code. Define a hard term in one short sentence the first time. Then reuse that term.
- Match the user’s word for a thing. Do not rename it in prose.
- Names must read like English intent. No riddles, meme names, or opaque abbreviation piles.
- Lead with the outcome or the next action. Put raw dumps last.
- Do not send a reply until the prose passes these checks.

**Goal:** The goal is easy reading. Many readers are not native English speakers. Clear text helps them do the work in a safe and correct way.

## Layout

| Path                      | Role                                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| `src/index.ts`            | Public API barrel. Every export here is a semver contract.            |
| `src/cli.ts`              | Executable entry. Its shebang makes tsdown write `bin`. Keep it thin. |
| `src/run-cli.ts`          | CLI logic. Takes I/O as arguments and returns an exit code.           |
| `src/tsconfig.json`       | `isolatedDeclarations` for published code only.                       |
| `test/`                   | Vitest files (`*.test.ts`).                                           |
| `scripts/smoke.ts`        | Packs, installs, imports, and runs the real tarball.                  |
| `scripts/package-json.ts` | Decoder for package.json. Copy its pattern for untyped input.         |
| `scripts/setup.ts`        | One-time template setup. It deletes itself after it runs.             |

## Project rules

- Code in `src/` must run on Node.js. Do not use `Bun.*` or `bun:*` there; oxlint blocks them.
- Use `.ts` extensions in relative imports (`./slugify.ts`).
- Export functions from `src/` with explicit return types (`isolatedDeclarations`).
- Do not edit `exports` or `bin` in `package.json` by hand. `bun run build` writes them; commit the result.
- A public API change fails the build once and rewrites `__snapshots__/tsnapi/`. Commit that diff only if the change is intended. Ask first before a breaking change (`TSNAPI_ALLOW_BREAKING=1`).
- When the public API or CLI changes, update `skills/*/SKILL.md` and JSDoc, then run `bun run docs`.
- Do not edit text between `<!-- automd:… -->` and `<!-- /automd -->` in `README.md`; `bun run docs` writes it.
- To add an import path, add the file to `entry` in `tsdown.config.ts`.
- Parse `JSON.parse` and other untyped data at the boundary into a named type. Do not cast with `as`.
- Each `as T` needs a `// SAFETY:` comment that explains why it is safe.
- bellona reports have four lines: Problem, Why, Fix, Avoid. Apply Fix. Obey Avoid.
- CI, Release, and Dependabot are off in the kit repo. `scripts/setup.ts` turns them on. Do not edit the `#off ` lines.
- Do not add `oxlint-disable` comments. If a rule is wrong for the project, change `oxlint.config.ts` and write the reason.
- `src/run-cli.ts` must never call `process.exit` or write to `process` directly. Use the `CliIo` argument.

## Testing

- Add or update tests in `test/` for each behavior change. Put type tests for the public API in `test/*.test-d.ts` (`expectTypeOf`).
- Coverage thresholds are 90% for lines, branches, functions, and statements (`vitest.config.ts`).
- Run `bun run check` before you finish. Run `bun run smoke` when you change the build, `exports`, `bin`, or the CLI entry.

## Releases

- Each user-visible change needs a changeset: `bun run changeset`.
- Do not edit `version` or `CHANGELOG.md` by hand. The Release workflow does it.
- The package stays `"private": true` until the owner does "First release" in `CONTRIBUTING.md`.

## Boundaries

- Always: keep `bun run check` green; keep published code free of runtime dependencies unless asked.
- Ask first: adding a dependency, lowering `minimumReleaseAge` in `bunfig.toml`, changing `engines.node`, adding CommonJS output, editing `.github/workflows/`, removing `"private": true`.
- Never: commit `dist/`, `coverage/`, or secrets; run `npm publish`; weaken lint, type, or coverage settings to make a check pass.

## Docs index

| Topic                           | Document           |
| ------------------------------- | ------------------ |
| Kit features and common changes | `README.md`        |
| Scripts, layout, release setup  | `CONTRIBUTING.md`  |
| Lint policy and rule exceptions | `oxlint.config.ts` |
| Build and package fields        | `tsdown.config.ts` |
| Reporting vulnerabilities       | `SECURITY.md`      |
