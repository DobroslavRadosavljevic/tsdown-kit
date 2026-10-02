import { fileURLToPath } from 'node:url'

import { defineConfig } from 'blume'
import { filesystem, githubReleases } from 'blume/sources'

import { isJsonObject, readPackageJson } from '../scripts/package-json.ts'

// The docs describe the package one folder up. Its package.json is the single source for the
// site title, the description, and the GitHub repository.
const {
  name: packageName,
  description,
  repository,
} = readPackageJson(fileURLToPath(new URL('../package.json', import.meta.url)))
const repositoryUrl = isJsonObject(repository) ? repository['url'] : repository
const groups =
  typeof repositoryUrl === 'string'
    ? /github\.com[/:](?<owner>[\w.-]+)\/(?<repo>[\w.-]+?)(?:\.git)?$/u.exec(repositoryUrl)?.groups
    : undefined
const owner = groups?.['owner']
const repo = groups?.['repo']
const github = owner !== undefined && repo !== undefined ? { owner, repo } : undefined

// The unscoped name. The site title, and so the name of its published agent skill, must match
// the skill in ../skills/<name>/, so the site serves the same skill that ships in the npm package.
const name = typeof packageName === 'string' ? packageName.replace(/^@[^/]+\//u, '') : 'my-package'

// GitHub Pages serves a project site under /<repo>. The docs workflow sets these; other hosts
// (Vercel, Netlify, Cloudflare Pages) detect the site URL by themselves.
const { DOCS_SITE: site, DOCS_BASE: base } = process.env

export default defineConfig({
  title: name,
  ...(typeof description === 'string' ? { description } : {}),
  ...(github === undefined ? {} : { github: { ...github, dir: 'docs' } }),

  content: {
    sources: [
      filesystem({ root: 'content' }),
      // Every GitHub release (the Release workflow creates one per version) becomes a changelog entry.
      ...(github === undefined ? [] : [githubReleases({ prefix: 'changelog', ...github })]),
    ],
  },

  lastModified: 'git',

  markdown: {
    code: { icons: true },
  },

  agents: {
    // Publish the agent skill that ships in the npm package (../skills/<name>/SKILL.md).
    skills: '../skills',
  },

  deployment: {
    // An empty value (a custom domain has no base path) means "not set".
    ...(site === undefined || site === '' ? {} : { site }),
    ...(base === undefined || base === '' ? {} : { base }),
  },
})
