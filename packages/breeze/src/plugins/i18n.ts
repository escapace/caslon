import { styleRule } from '../tailwindcss/ast'
import type { PluginOptions } from '../types'

export const i18n = (options: PluginOptions) => {
  const { designSystem } = options

  designSystem.variants.functional('lang', (ruleNode, variant) => {
    // eslint-disable-next-line typescript/strict-boolean-expressions
    if (!variant.value || variant.modifier) return null

    let value = variant.value.kind === 'named' ? variant.value.value.trim() : undefined
    value = value === undefined ? undefined : value.length === 0 ? undefined : value

    if (value === undefined) {
      return null
    }

    ruleNode.nodes = [styleRule(`&:lang(${value})`, ruleNode.nodes)]
  })
}
