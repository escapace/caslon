import type { PluginOptions } from '../types'
import { option } from '../utilities/option'

export const colorReferences = (options: PluginOptions) => {
  const { designSystem } = options

  const colors = option(designSystem, 'array-string', '--color-references')

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
