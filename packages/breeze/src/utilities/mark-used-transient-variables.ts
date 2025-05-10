import { walkDepth, type AstNode } from '../tailwindcss/ast'
import type { DesignSystem } from '../tailwindcss/design-system'
import { unescape } from '../tailwindcss/utils/escape'
import { extractUsedVariables } from '../tailwindcss/utils/variables'

export function markUsedTransientVariables(input: string | AstNode[], designSystem: DesignSystem) {
  const seen = new Set<string>()

  const next = (value: string | undefined) => {
    if (value === undefined) {
      return
    }

    const variables = extractUsedVariables(value)

    for (let variable of variables) {
      variable = unescape(variable)

      if (seen.has(variable)) {
        continue
      }

      seen.add(variable)
      next(designSystem.theme.values.get(variable)?.value)
      next(designSystem.resolveThemeValue(variable))
    }
  }

  if (typeof input === 'string') {
    if (input.includes('var(')) {
      next(input)
    }
  } else {
    walkDepth(input, (node) => {
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
  }

  for (const variable of [...seen].toReversed()) {
    designSystem.theme.markUsedVariable(variable)
  }
}
