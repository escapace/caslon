import type { DesignSystem } from '../tailwindcss/design-system'
import { assert } from './assert'

export const breakpointsRange = (designSystem: DesignSystem): [number, number] => {
  const values: number[] = []

  for (const [key, { value }] of designSystem.theme.entries()) {
    if (key.startsWith('--breakpoint-')) {
      assert(value.endsWith('px'))
      const number = parseInt(value.slice(0, -2))
      assert(!isNaN(number))
      assert(isFinite(number))

      values.push(number)
    }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)

  assert(min !== max)

  return [min, max]
}
