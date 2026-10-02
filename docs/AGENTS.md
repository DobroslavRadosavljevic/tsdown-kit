# AGENTS.md (docs site)

The root `AGENTS.md` applies here too. This file adds what is different in `docs/`.

## Commands

Run these from the repo root:

- Preview: `bun run docs:dev` (installs `docs/` dependencies, then `blume dev`)
- Check: `bun run docs:check` (`tsc -p docs`, `blume doctor`, `blume validate`)
- Build: `bun run docs:build` (strict: a frontmatter error fails it)

While `docs:dev` runs, verify with `bun run --cwd docs build -- --isolated`. A plain build would break the dev server.

## Stack

- Blume 2.0 (`blume.config.ts`, content in `content/`). Its docs and agent skill are in `node_modules/blume/docs/` and `node_modules/blume/skills/blume/SKILL.md`. Read them before you use a feature.
- Blume 2.1 features (`variables`, `footer`, `directory`, page `mode`) are not available yet. `bunfig.toml` installs only releases that are 3 days old.

## Rules

- The site title, description, and GitHub repository come from the root `package.json`. Do not hard-code them in `blume.config.ts`.
- `agents.skills` publishes `../skills/`. The skill in the npm package and the skill on the site are the same file.
- Quote every frontmatter `description`. A value that starts with `@` or holds `: ` is invalid YAML.
- MDX components need no imports. Use Lucide names for `icon`.
- Document types with `<AutoTypeTable path="../src/<file>.ts" name="<Type>" />`, so the table follows the JSDoc. Add a `<Visibility for="agents">` table next to it: the `.md` copy for agents does not render the component.
- Link pages with root paths (`/guides/library`). Blume adds the GitHub Pages base path.
- Parts for one package kind sit between `{/* kit:library */}` and `{/* /kit:library */}` (or `kit:cli`). Put each marker on its own line, with blank lines around it. `scripts/setup.ts` removes them.
