import { isMultipleOf } from '../tailwindcss/utils/infer-data-type'

export function isValidLineHeight(value: unknown) {
  const number = Number(value)

  return number >= 1 && isMultipleOf(number, 0.125)
}
