import { readFileSync } from 'node:fs'

export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject

export interface JsonObject {
  [key: string]: JsonValue
}

/** Decodes parsed JSON into `JsonValue`, so later code reads checked types instead of `any`. */
function decodeJsonValue(data: unknown): JsonValue {
  if (data === null || typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') return data
  if (Array.isArray(data)) return data.map((item) => decodeJsonValue(item))
  if (typeof data === 'object') {
    const result: JsonObject = {}
    for (const [key, value] of Object.entries(data)) result[key] = decodeJsonValue(value)
    return result
  }
  throw new TypeError(`Expected a JSON value, received ${typeof data}`)
}

export function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)
}

/** Reads a package.json file. Throws when the file is not a JSON object. */
export function readPackageJson(file: string): JsonObject {
  const data: unknown = JSON.parse(readFileSync(file, 'utf-8'))
  const pkg = decodeJsonValue(data)
  if (!isJsonObject(pkg)) throw new TypeError(`${file} is not a JSON object`)
  return pkg
}
