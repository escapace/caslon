/* eslint-disable typescript/unbound-method */

import { Features } from '../tailwindcss'
import { styleRule, walk, type AstNode, type AtRule } from '../tailwindcss/ast'
import { applyVariant } from '../tailwindcss/compile'
import type { DesignSystem } from '../tailwindcss/design-system'

export const substituteAtVariant = (ast: AstNode[], designSystem: DesignSystem) => {
  let features = Features.None

  const variantNodes: AtRule[] = []

  walk(ast, (node, { parent, replaceWith }) => {
    // Apply `@variant` at-rules
    if (node.kind === 'at-rule' && node.name === '@variant') {
      // Legacy `@variant` at-rules containing `@slot` or without a body should
      // be considered a `@custom-variant` at-rule.
      if (parent === null) {
        replaceWith([])
      }

      // Collect all the `@variant` at-rules, we will replace them later once
      // all variants are registered in the system.
      else {
        variantNodes.push(node)
      }
    }
  })

  // Replace the `@variant` at-rules with the actual variant rules.
  if (variantNodes.length > 0) {
    for (const variantNode of variantNodes) {
      // Starting with the `&` rule node
      const node = styleRule('&', variantNode.nodes)

      const variant = variantNode.params

      const variantAst = designSystem.parseVariant(variant)
      if (variantAst === null) {
        throw new Error(`Cannot use \`@variant\` with unknown variant: ${variant}`)
      }

      const result = applyVariant(node, variantAst, designSystem.variants)
      if (result === null) {
        throw new Error(`Cannot use \`@variant\` with variant: ${variant}`)
      }

      // Update the variant at-rule node, to be the `&` rule node
      Object.assign(variantNode, node)
    }

    features |= Features.Variants
  }

  return features
}
