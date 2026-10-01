export interface SlugifyOptions {
  /**
   * Text placed between words. It is used as given, also when `lowercase` is true.
   * @default '-'
   */
  readonly separator?: string
  /**
   * Convert the words to lower case.
   * @default true
   */
  readonly lowercase?: boolean
  /**
   * Maximum length of the result, in UTF-16 code units (`string.length`). The result never ends
   * with a separator and never splits a character that takes two code units.
   * Must be a non-negative integer.
   */
  readonly maxLength?: number
}

const COMBINING_MARKS = /\p{M}+/gu
const NON_WORD = /[^\p{L}\p{N}]+/u
const TRAILING_HIGH_SURROGATE = /[\uD800-\uDBFF]$/u

/** Cuts `words` joined by `separator` to `maxLength`, so that no separator is left at the end. */
function joinWithin(words: readonly string[], separator: string, maxLength: number): string {
  let slug = ''
  for (const word of words) {
    const prefix = slug === '' ? '' : `${slug}${separator}`
    const next = `${prefix}${word}`
    if (next.length <= maxLength) {
      slug = next
      continue
    }
    // The cut lands inside this word. Keep part of the word only if the separator fits before it.
    if (prefix.length < maxLength) slug = next.slice(0, maxLength).replace(TRAILING_HIGH_SURROGATE, '')
    break
  }
  return slug
}

/**
 * Turns text into a slug for URLs, file names, or ids. Accents are removed (`é` → `e`), and letters
 * and digits from every script are kept. Call `encodeURIComponent` on the result if you need ASCII.
 *
 * @throws {RangeError} When `maxLength` is not a non-negative integer.
 * @example
 * slugify('Héllo, Wörld!') // 'hello-world'
 * slugify('TypeScript 7 is here', { separator: '_', maxLength: 12 }) // 'typescript_7'
 */
export function slugify(input: string, options: SlugifyOptions = {}): string {
  const { separator = '-', lowercase = true, maxLength } = options

  if (maxLength !== undefined && (!Number.isInteger(maxLength) || maxLength < 0)) {
    throw new RangeError(`maxLength must be a non-negative integer, received ${maxLength}`)
  }

  const words = input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .split(NON_WORD)
    .filter(Boolean)
    .map((word) => (lowercase ? word.toLowerCase() : word))

  return maxLength === undefined ? words.join(separator) : joinWithin(words, separator, maxLength)
}
