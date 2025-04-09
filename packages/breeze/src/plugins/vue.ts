import { walk, WalkAction } from '../tailwindcss/ast'
import type { DesignSystem } from '../tailwindcss/design-system'
import { segment } from '../tailwindcss/utils/segment'

function normalizeSelector(selector: string, type: string) {
  // if (selector.includes('::')) return null

  const selectors = segment(selector, ',').map((sel) => {
    // Replace `&` in target variant with `*`, so variants like `&:hover`
    // become `&:not(*:hover)`. The `*` will often be optimized away.
    sel = sel.replaceAll('&', '*')

    return sel
  })

  return `:${type}(${selectors.join(', ')})`
}

export const vue = (designSystem: DesignSystem) => {
  const variants = designSystem.variants

  for (const type of ['deep', 'slotted', 'global']) {
    variants.functional(type, (ruleNode, variant) => {
      if (variant.modifier !== null) return null

      // let didApply = false

      walk([ruleNode], (node, { path }) => {
        if (node.kind !== 'rule') return WalkAction.Continue

        // Throw out any candidates with variants using nested style rules
        for (const parent of path.slice(0, -1)) {
          if (parent.kind !== 'rule') continue

          // didApply = false
          return WalkAction.Stop
        }

        const value = normalizeSelector(node.selector, type)

        if (value === null) {
          return WalkAction.Continue
        }

        node.selector = value

        // Track that the variant was actually applied
        // didApply = true
      })

      // If the node wasn't modified, this variant is not compatible with
      // `in-*` so discard the candidate.
      // if (!didApply) return null
    })

    variants.suggest(type, () =>
      Array.from(variants.keys()).filter((name) => variants.compoundsWith(type, name)),
    )
  }
}
