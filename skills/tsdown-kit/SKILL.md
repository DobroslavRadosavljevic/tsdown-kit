---
name: tsdown-kit
description: Use the tsdown-kit package to turn text into URL slugs with slugify(), from TypeScript code or the tsdown-kit CLI. Use when code imports tsdown-kit, or when the user asks to slugify text with this package.
---

# tsdown-kit

`tsdown-kit` turns text into slugs. Install it with `npm install tsdown-kit`. It is ESM only and needs Node.js 22.12 or newer.

## Library

```ts
import { slugify } from 'tsdown-kit'

slugify('Héllo, Wörld!') // 'hello-world'
slugify('TypeScript 7 is here', { separator: '_', maxLength: 12 }) // 'typescript_7'
```

Options (all optional):

| Option      | Type      | Default | Meaning                                                 |
| ----------- | --------- | ------- | ------------------------------------------------------- |
| `separator` | `string`  | `'-'`   | Text between words. Its case is never changed.          |
| `lowercase` | `boolean` | `true`  | Convert the words to lower case.                        |
| `maxLength` | `number`  | none    | Maximum length. The result never ends with a separator. |

- Accents are removed (`é` → `e`). Letters and digits from every script are kept.
- `slugify` throws a `RangeError` when `maxLength` is not a non-negative integer.
- Call `encodeURIComponent` on the result if you need ASCII only.

## CLI

```sh
npx tsdown-kit "Héllo, Wörld!"          # hello-world
echo "One\nTwo" | npx tsdown-kit         # one line in, one slug out
npx tsdown-kit -s _ -m 12 --keep-case "Some Text"
```

Exit codes: `0` on success, `2` on a usage error (unknown flag, no input, bad `--max-length`).
