# Contributing

## Requirements

- [Bun](https://bun.com) 1.4 or newer: installs packages and runs scripts.
- [Node.js](https://nodejs.org) 24, as set in `.node-version`. fnm, mise, and nodenv read that file.
  tsdown, Vitest, and the scripts run on Node.js. They need 22.18 or newer, although users of the
  package need only 22.12.

```sh
bun install
```

## Scripts

| Command                    | What it does                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `bun run dev`              | Rebuilds `dist/` when a file in `src/` changes.                                                          |
| `bun run build`            | Builds `dist/`, updates `exports` and `bin` in package.json, runs publint and attw.                      |
| `bun run test`             | Runs the unit tests and the type tests (`*.test-d.ts`) once with Vitest. `test:watch` reruns on change.  |
| `bun run test:coverage`    | Runs the tests with v8 coverage and the thresholds in `vitest.config.ts`.                                |
| `bun run typecheck`        | Type-checks tool files, `src/`, and `test/` with TypeScript 7.                                           |
| `bun run lint`             | Lints with oxlint: Ultracite core, all categories, type-aware rules, bellona `bl-js`.                    |
| `bun run format`           | Formats with oxfmt. `format:check` only checks.                                                          |
| `bun run knip`             | Finds unused files, exports, and dependencies.                                                           |
| `bun run build:update-api` | Updates the API snapshots after an intended API change. Breaking changes need `TSNAPI_ALLOW_BREAKING=1`. |
| `bun run docs`             | Fills in the automd blocks in `README.md`: badges, install commands, API docs from JSDoc.                |
| `bun run smoke`            | Packs the tarball, installs it in an empty project, imports it, runs its bin.                            |
| `bun run check`            | Runs format check, lint, typecheck, tests, build, and knip. Run it before you push.                      |
| `bun run changeset`        | Records a change for the next release.                                                                   |

## Project layout

```text
src/index.ts              Public API (the "." export). Delete it for a CLI-only package.
src/cli.ts                Executable entry with a shebang. Delete it for a library-only package.
src/run-cli.ts            CLI logic, kept apart from src/cli.ts so tests can call it.
src/slugify.ts            Example code. Replace it.
src/tsconfig.json         Rules for published code (isolatedDeclarations).
test/                     Vitest files. Run them with `bun run test`, never `bun test`.
scripts/smoke.ts          Tests the packed tarball on the runtime that runs it.
scripts/package-json.ts   Typed package.json reader used by the scripts.
scripts/setup.ts          One-time template setup. It deletes itself.
skills/                   Agent skill shipped in the package (`skills/<name>/SKILL.md`).
__snapshots__/tsnapi/     Public API snapshots. The build writes them; commit them.
```

Code in `src/` must run on Node.js. oxlint blocks `Bun.*` and `bun:*` imports there.

bellona reports have four lines: **Problem**, **Why**, **Fix**, **Avoid**. Apply the **Fix**.
Parse JSON and other untyped input at the boundary (see `scripts/package-json.ts`) instead of using `as`.

## Releasing

Releases use [Changesets](https://changesets.dev) and npm
[trusted publishing](https://docs.npmjs.com/trusted-publishers). No npm token is stored in GitHub.

1. In your pull request, run `bun run changeset`. Pick the bump type and write a short summary
   for the changelog. Commit the new file in `.changeset/`.
2. When the pull request is merged, the **Release** workflow opens a "Version Packages" pull request.
   It bumps the version and updates `CHANGELOG.md`.
3. When you merge "Version Packages", the workflow builds, packs, and publishes to npm with
   provenance. It also creates a git tag and a GitHub release.

### First release

The package is `"private": true` until you do these steps once, so no workflow publishes it by accident.

1. **GitHub:** Settings → Actions → General → enable
   "Allow GitHub Actions to create and approve pull requests".
   Then Settings → Advanced Security → enable "Private vulnerability reporting" (`SECURITY.md` uses it).
   Install the [autofix.ci app](https://github.com/apps/autofix-ci) on the repo for the autofix workflow.
   For the Sponsor button (`FUNDING.yml`), join [GitHub Sponsors](https://github.com/sponsors), or delete the file.
2. **package.json:** remove `"private": true` and set `version` to your first version, for example `0.1.0`.
3. **npm:** npm adds trusted publishers in the package settings, so the package must exist first.
   Publish the first version from your machine (`prepack` builds it):

   ```sh
   npm login
   npm publish --access public
   ```

4. **npm:** open the package on npmjs.com → Settings → Trusted publishing → GitHub Actions:
   - Organization or user, and repository: your GitHub `owner` and `name`
   - Workflow filename: `release.yml`
   - Environment name: `npm`
   - Allowed actions: allow `npm publish`
5. Commit and push. From now on, releases go through changesets as described above.
6. **npm (recommended):** after the first automated release works, set
   Settings → Publishing access → "Require two-factor authentication and disallow tokens".
7. **GitHub (optional):** Settings → Environments → `npm` → add required reviewers, so a person
   approves each publish.
