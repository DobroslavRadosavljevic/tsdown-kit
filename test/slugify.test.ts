import { describe, expect, it } from 'vitest'

import { slugify } from '../src/slugify.ts'

describe(slugify, () => {
  it.each([
    ['Hello World', 'hello-world'],
    ['  many   spaces  ', 'many-spaces'],
    ['Héllo, Wörld!', 'hello-world'],
    ['Crème brûlée', 'creme-brulee'],
    ['TypeScript 7.0 is here', 'typescript-7-0-is-here'],
    ['Привет мир', 'привет-мир'],
    ['東京 タワー', '東京-タワー'],
    ['---', ''],
    ['', ''],
  ])('%j → %j', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  it('uses a custom separator', () => {
    expect(slugify('one two three', { separator: '_' })).toBe('one_two_three')
    expect(slugify('one two', { separator: '' })).toBe('onetwo')
  })

  it('keeps case when lowercase is false', () => {
    expect(slugify('Hello World', { lowercase: false })).toBe('Hello-World')
  })

  it('does not change the case of the separator', () => {
    expect(slugify('Hello World', { separator: 'X' })).toBe('helloXworld')
  })

  it.each([
    ['hello world', '-', 6, 'hello'],
    ['hello world', '-', 8, 'hello-wo'],
    ['hello world', '-', 11, 'hello-world'],
    ['a -- b', '--', 3, 'a'],
    ['hello', '-', 3, 'hel'],
    ['hello', '-', 0, ''],
  ])('cuts %j (separator %j) to %i: %j', (input, separator, maxLength, expected) => {
    expect(slugify(input, { separator, maxLength })).toBe(expected)
  })

  it('does not cut letters off a word that ends like the separator', () => {
    expect(slugify('banana split', { separator: 'a', maxLength: 6 })).toBe('banana')
  })

  it('does not split a character that takes two code units', () => {
    // U+20000 is one CJK letter stored as a surrogate pair.
    expect(slugify('\u{20000}\u{20001} x', { maxLength: 3 })).toBe('\u{20000}')
  })

  it('rejects an invalid maxLength', () => {
    expect(() => slugify('x', { maxLength: -1 })).toThrow(RangeError)
    expect(() => slugify('x', { maxLength: 1.5 })).toThrow(RangeError)
  })
})
