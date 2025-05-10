import type { DesignSystem } from '../tailwindcss/design-system'
import type { ThemeKey } from '../tailwindcss/theme'
import { splitString } from './split-string'

export function option(
  designSystem: DesignSystem,
  type: 'number',
  ...keys: ThemeKey[]
): number | undefined
export function option(
  designSystem: DesignSystem,
  type: 'string',
  ...keys: ThemeKey[]
): string | undefined
export function option(
  designSystem: DesignSystem,
  type: 'array',
  ...keys: ThemeKey[]
): string[] | undefined
export function option(
  designSystem: DesignSystem,
  type: 'array' | 'number' | 'string',
  ...keys: ThemeKey[]
): number | string | string[] | undefined {
  let value = designSystem.theme.get(keys) ?? undefined

  for (const key of keys) {
    designSystem.theme.values.delete(key)
  }

  if (value === undefined) {
    return
  }

  value = value.trim()

  if (value.length === 0) {
    return undefined
  }

  if (type === 'array') {
    return splitString(value)
  } else if (type === 'string' || type === 'number') {
    if (
      (value.startsWith(`'`) && value.endsWith(`'`)) ||
      (value.startsWith(`"`) && value.endsWith(`"`))
    ) {
      value = value.slice(1, -1).trim()
    }

    if (value.length === 0) {
      return undefined
    }
  }

  if (type === 'number') {
    const number = parseFloat(value)

    if (Number.isNaN(number) || Number.isFinite(number)) {
      return undefined
    }

    return number
  }

  return value
}
