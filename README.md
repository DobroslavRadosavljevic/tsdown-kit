<div align="center">

# 📦 tsdown-kit

**Start a TypeScript npm package in one command: a library, a CLI, or both.**

[![TypeScript 7](https://img.shields.io/badge/TypeScript-7.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Bun 1.4](https://img.shields.io/badge/Bun-1.4-14151A?logo=bun&logoColor=white)](https://bun.com)
[![tsdown 0.23](https://img.shields.io/badge/tsdown-0.23-FF7E17)](https://tsdown.dev)
[![Vitest 5](https://img.shields.io/badge/Vitest-5.0-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)
[![oxlint](https://img.shields.io/badge/lint-oxlint-00A3FF)](https://oxc.rs/docs/guide/usage/linter)
[![Docs: Blume](https://img.shields.io/badge/docs-Blume-8B5CF6)](https://useblume.dev)
<br>
[![Node.js 22.12+](https://img.shields.io/badge/Node.js-%E2%89%A522.12-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![ESM only](https://img.shields.io/badge/module-ESM%20only-F7DF1E)](https://nodejs.org/api/esm.html)
[![npm trusted publishing](https://img.shields.io/badge/npm-trusted%20publishing-CB3837?logo=npm&logoColor=white)](https://docs.npmjs.com/trusted-publishers)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

</div>

---

## ⚡ Quick start

```sh
bun create DobroslavRadosavljevic/tsdown-kit my-package
cd my-package
bun run setup
```

`setup` asks five questions: package name, description, author, GitHub repo, and kind.
Then it does the rest:

- 🧹 Removes the files your package kind does not need.
- 📝 Writes your `README.md`, `LICENSE`, `FUNDING.yml`, and a starter agent skill in `skills/`.
- 📚 Trims the docs site to your package kind and puts your package name in every page.
- 🔛 Turns on CI, the release workflow, the docs deploy, the changeset status comment, autofix, and Dependabot.
- 🏗️ Rebuilds, writes fresh API snapshots, fills in the README, then deletes itself.

Skip the questions with flags:

```sh
bun run setup --name @me/tool --kind cli --repo me/tool --yes
```

| Kind      | You get                                                    |
| --------- | ---------------------------------------------------------- |
| `library` | `src/index.ts` → the `"."` import path, with `.d.ts` types |
| `cli`     | `src/cli.ts` → a `bin` command                             |
| `both`    | Both of the above, in one package                          |

## 🎯 Make it yours

The kit ships a small `slugify` function and a CLI around it, so every tool has real code to check.
After `setup`, swap in your own code:

1. ✏️ Replace `src/slugify.ts` and the tests in `test/` with your code.
2. 🔷 Update the type tests in `test/index.test-d.ts` for your exports.
3. 📸 Run `bun run build`. The API snapshot changes, so the build fails once. Review the diff in
   `__snapshots__/tsnapi/` and commit it.
4. 🤖 **Rewrite the agent skill** in `skills/<your-package>/SKILL.md`. `setup` writes only a stub
   with TODOs. Coding agents in your users' projects read this file to learn your API.
   If you forget, their agents will try to slugify everything. 🙃
5. 📝 Add JSDoc to your exports, then run `bun run readme` to update the API section of the README.
6. 📚 Rewrite the pages in `docs/content/` for your API, then check them with `bun run docs:dev`.
7. ✅ Run `bun run check` and `bun run docs:check`, then commit.
8. 🚀 Before the first publish, follow [First release](./CONTRIBUTING.md#first-release).

## ✨ What you get

- 🧩 **One build for every package kind.** tsdown builds `src/index.ts` and `src/cli.ts` when they exist.
  Delete one, and the build adapts.
- 🪄 **Package fields you never edit by hand.** tsdown writes `exports` from your entry files and `bin`
  from the file with a shebang. CI fails if the committed `package.json` is out of date.
- 🟢 **ESM only, for Node.js 22.12 and newer.** CommonJS code can still load your package with `require()`.
- ⚡ **Fast type files.** `isolatedDeclarations` lets tsdown write `.d.ts` files with Oxc instead of `tsc`.
- 🔒 **Strict TypeScript 7.** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and
  `.ts` extensions in imports.
- 🧹 **Strict lint.** Ultracite's presets, every oxlint category as an error, type-aware rules, and all
  bellona `bl-js` rules. Each rule that is off has a reason in `oxlint.config.ts`.
- 🧪 **Tests on the runtime your users have.** Vitest runs on Node.js, with 90% coverage thresholds.
  oxlint blocks Bun-only APIs in `src/`.
- 🔷 **Type tests for the public API.** `*.test-d.ts` files check your exported types with
  `expectTypeOf`, so a type change cannot ship by accident.
- 📸 **API snapshots.** tsnapi writes each export and its types to `__snapshots__/tsnapi/`. If the public
  API changes, the build fails and you review the diff.
- 💨 **A smoke test on the real tarball.** It packs the package, installs it in an empty project,
  then imports it, requires it, and runs its bin. CI runs it on Node.js 22, 24, and 26, on Windows
  and macOS, and on Bun.
- 🖥️ **A CLI you can test.** The CLI logic takes its input and output as arguments and returns an
  exit code. It uses `node:util` `parseArgs`, so it has no runtime dependencies.
- 🚀 **Releases without npm tokens.** Changesets opens a release pull request. When you merge it, the
  workflow publishes to npm with trusted publishing and provenance.
- 💬 **Changeset reminders.** A bot comment on each pull request shows the version bump it causes,
  or warns that it has no changeset.
- 🛡️ **Supply-chain guards.** Bun installs only versions that are 3 days old or older. Actions are
  pinned to commit SHAs. zizmor and actionlint check every workflow in CI.
- 🧽 **Autofix on pull requests.** The autofix.ci bot runs the lint and format fixers and pushes the fixes.
- 📝 **A README that updates itself.** automd fills in npm badges, install commands, and API docs from
  your JSDoc comments.
- 📋 **Repo files ready to go.** `SECURITY.md`, issue forms, a pull request template, `FUNDING.yml`,
  `.node-version`, and `devEngines` in `package.json`.
- 📚 **A docs site.** [Blume](https://useblume.dev) builds it from Markdown in `docs/content/`: search,
  guides, an API reference generated from your JSDoc, a changelog from your GitHub releases, `llms.txt`,
  and a Markdown copy of each page. A workflow deploys it to GitHub Pages.
- 🤖 **Ready for coding agents.** `AGENTS.md` lists the commands, rules, and limits for AI agents
  that work on your package. The package also ships an agent skill in `skills/`, so agents in
  projects that install it learn your API. The smoke test checks that the skill is in the tarball.

## 🧰 Stack

| Tool                                                                        | Version | Job                                                          |
| --------------------------------------------------------------------------- | ------- | ------------------------------------------------------------ |
| [Bun](https://bun.com)                                                      | 1.4     | Installs packages and runs scripts                           |
| [tsdown](https://tsdown.dev)                                                | 0.23    | Builds `dist/`, writes `.d.ts` files, `exports`, and `bin`   |
| [TypeScript](https://www.typescriptlang.org)                                | 7.0     | Checks types with the native compiler                        |
| [Vitest](https://vitest.dev)                                                | 5.0     | Runs unit tests on Node.js, with v8 coverage                 |
| [oxlint](https://oxc.rs/docs/guide/usage/linter)                            | 1.86    | Lints, with type-aware rules from `oxlint-tsgolint`          |
| [Ultracite](https://www.ultracite.ai)                                       | 7.12    | Gives the base oxlint rules (core and vitest presets)        |
| [bellona](https://www.npmjs.com/package/bellona)                            | 0.5     | Adds 19 `bl-js` rules: typed JSON, no unsafe casts, and more |
| [oxfmt](https://oxc.rs/docs/guide/usage/formatter)                          | 0.71    | Formats code, sorts imports and `package.json`               |
| [knip](https://knip.dev)                                                    | 6       | Finds unused files, exports, and dependencies                |
| [tsnapi](https://github.com/antfu/tsnapi)                                   | 1.5     | Snapshots the public API and fails the build when it changes |
| [automd](https://automd.unjs.io)                                            | 0.4     | Fills in README badges, install commands, and API docs       |
| [publint](https://publint.dev) + [attw](https://arethetypeswrong.github.io) | latest  | Check the package and its types on every build               |
| [Changesets](https://changesets.dev)                                        | 3       | Bumps versions, writes the changelog, opens release PRs      |
| [Blume](https://useblume.dev)                                               | 2.0     | Builds the docs site in `docs/` (on Astro)                   |

## 🏃 Commands

| Command                    | What it does                                                  |
| -------------------------- | ------------------------------------------------------------- |
| `bun run dev`              | Rebuilds `dist/` when a file in `src/` changes                |
| `bun run test`             | Runs the tests and type tests with Vitest (not `bun test`)    |
| `bun run test:coverage`    | Runs the tests with a coverage report                         |
| `bun run lint:fix`         | Fixes what oxlint can fix                                     |
| `bun run check`            | Runs format check, lint, types, tests, build, and knip        |
| `bun run smoke`            | Tests the packed tarball on Node.js                           |
| `bun run build:update-api` | Accepts an intended public API change (updates the snapshots) |
| `bun run readme`           | Updates the automd blocks in `README.md`                      |
| `bun run docs:dev`         | Starts the docs site at `localhost:4321`                      |
| `bun run docs:check`       | Checks the docs config, content, and links                    |
| `bun run changeset`        | Records a change for the next release                         |

[CONTRIBUTING.md](./CONTRIBUTING.md) has all scripts and the release setup.

## 🗂️ What's inside

```text
src/
  index.ts             Public API: the "." import path
  cli.ts               CLI entry with a shebang: the `bin` command
  run-cli.ts           CLI logic that tests can call
  slugify.ts           Example code: replace it
test/                  Vitest tests and type tests (*.test-d.ts)
skills/<name>/         Agent skill shipped in the package: rewrite it for your API
__snapshots__/tsnapi/  Public API snapshots: the build writes them, you commit them
scripts/               setup (runs once), smoke test, package.json reader
.github/               CI, release, docs deploy, changeset status, autofix, Dependabot, issue forms
docs/                  Docs site (Blume): pages in docs/content/, a separate project
AGENTS.md              Rules and commands for coding agents
```

## 🚦 CI in the kit repo

CI, the release workflow, the docs deploy, the changeset status comment, autofix, and Dependabot are
**off** in this repo.
A push starts nothing.
You can still start a workflow by hand from the GitHub **Actions** tab.

`bun run setup` turns them all on in your new package.

## 🛠️ Common changes

<details>
<summary><b>Add a subpath export</b></summary>

Add the file to `entry` in `tsdown.config.ts`, for example `src/format.ts`.
The next build adds `"./format"` to `exports`.

</details>

<details>
<summary><b>Add a runtime dependency</b></summary>

Run `bun add <name>`. tsdown keeps `dependencies` and `peerDependencies` out of the bundle.
It bundles a `devDependency` only if your code imports it.

</details>

<details>
<summary><b>Run in browsers or edge runtimes</b></summary>

1. Set `platform: 'neutral'` in `tsdown.config.ts`.
2. Set `types` to `[]` in `src/tsconfig.json`.
3. Turn on oxlint's `import/no-nodejs-modules` rule for `src/**`.

</details>

<details>
<summary><b>Ship CommonJS too</b></summary>

Set `format: ['esm', 'cjs']` in `tsdown.config.ts`, and change the attw profile to `'node16'`.
Most packages do not need this, because Node.js 22.12 and newer can `require()` ESM.

</details>

<details>
<summary><b>Ship a single executable</b></summary>

tsdown can build a standalone binary with [`exe`](https://tsdown.dev/options/exe) and `@tsdown/exe`.

</details>

## 📄 License

[MIT](./LICENSE)
