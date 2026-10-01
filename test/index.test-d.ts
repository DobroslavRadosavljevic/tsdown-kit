import { describe, expectTypeOf, it } from 'vitest'

import { slugify } from '../src/index.ts'
import type { SlugifyOptions } from '../src/index.ts'

// Type tests for the public API. `tsc` checks this file; nothing in it runs.
describe('public API types', () => {
  it('slugify takes text and optional options, and returns a string', () => {
    expectTypeOf(slugify).parameter(0).toEqualTypeOf<string>()
    expectTypeOf(slugify).parameter(1).toEqualTypeOf<SlugifyOptions | undefined>()
    expectTypeOf(slugify).returns.toEqualTypeOf<string>()
  })

  it('SlugifyOptions fields are optional and read-only', () => {
    expectTypeOf<SlugifyOptions>().toEqualTypeOf<{
      readonly separator?: string
      readonly lowercase?: boolean
      readonly maxLength?: number
    }>()
  })
})
