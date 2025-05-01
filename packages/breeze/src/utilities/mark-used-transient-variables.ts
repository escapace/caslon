import { walkDepth, type AstNode } from '../tailwindcss/ast'
import type { DesignSystem } from '../tailwindcss/design-system'
import { extractUsedVariables } from '../tailwindcss/utils/variables'

export function markUsedTransientVariables(ast: AstNode[], designSystem: DesignSystem) {
  const seen = new Set<string>()

  const next = (value: string | undefined) => {
    if (value === undefined) {
      return
    }

    const variables = extractUsedVariables(value)
    // console.log(value)

    for (const variable of variables) {
      if (seen.has(variable)) {
        continue
      }

      seen.add(variable)
      next(designSystem.resolveThemeValue(variable))
    }
  }

  walkDepth(ast, (node) => {
    if (node.kind === 'declaration') {
      if (node.value === undefined || node.value === null) {
        return
      }

      // Track used CSS variables
      if (node.value.includes('var(')) {
        next(node.value)
      }
    }
  })

  for (const variable of seen) {
    designSystem.theme.markUsedVariable(variable)
  }
}
