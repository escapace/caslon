import type { DesignSystem } from '../tailwindcss/design-system'
import { option } from '../utilities/option'

export const colorReferences = (designSystem: DesignSystem) => {
  const colors = option(designSystem, 'array', '--color-references')

  if (colors === undefined) {
    return
  }

  for (const color of colors) {
    if (!/[a-z]+/i.test(color)) {
      continue
    }

    designSystem.theme.colorReferences.add(color)
  }
}
