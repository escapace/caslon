/* eslint-disable typescript/unbound-method */
/* eslint-disable typescript/strict-boolean-expressions */
import { Features } from '../tailwindcss'
import { substituteAtApply } from '../tailwindcss/apply'
import {
  atRoot,
  atRule,
  context,
  context as contextNode,
  decl,
  rule,
  styleRule,
  toCss,
  walk,
  WalkAction,
  type AstNode,
  type StyleRule,
} from '../tailwindcss/ast'
import { substituteAtImports, type LoadStylesheet } from '../tailwindcss/at-import'
import { substituteFunctions } from '../tailwindcss/css-functions'
import { parse } from '../tailwindcss/css-parser'
import { buildDesignSystem, type DesignSystem } from '../tailwindcss/design-system'
import { Theme, ThemeOptions } from '../tailwindcss/theme'
import { createCssUtility } from '../tailwindcss/utilities'
import { escape, unescape } from '../tailwindcss/utils/escape'
import { segment } from '../tailwindcss/utils/segment'
import { compoundsForSelectors, IS_VALID_VARIANT_NAME } from '../tailwindcss/variants'
import { substituteAtVariant } from './substitute-at-variant'

// const IS_VALID_PREFIX = /^[a-z]+$/

function parseThemeOptions(parameters: string) {
  let options = ThemeOptions.NONE
  let prefix = null

  for (const option of segment(parameters, ' ')) {
    if (option === 'reference') {
      options |= ThemeOptions.REFERENCE
    } else if (option === 'inline') {
      options |= ThemeOptions.INLINE
    } else if (option === 'default') {
      options |= ThemeOptions.DEFAULT
    } else if (option === 'static') {
      options |= ThemeOptions.STATIC
    } else if (option.startsWith('prefix(') && option.endsWith(')')) {
      prefix = option.slice(7, -1)
    }
  }

  return [options, prefix] as const
}

export const parseCss = async (options: {
  css: string
  directory?: string
  loadStyleSheet?: LoadStylesheet
}) => {
  let features = Features.None
  const ast = [contextNode({ theme: true }, parse(options.css))] as AstNode[]

  features |= await substituteAtImports(ast, options.directory ?? '', async (id, directory) => {
    if (id === 'tailwindcss') {
      return { base: '', content: '', path: id }
    }

    if (options.loadStyleSheet === undefined) {
      throw new Error(`@import & @reference not supported. ${id}`)
    }

    return await options.loadStyleSheet(id, directory)
  })

  const important = null as boolean | null
  const theme = new Theme()
  const customVariants: Array<(designSystem: DesignSystem) => void> = []
  const customUtilities: Array<(designSystem: DesignSystem) => void> = []
  let firstThemeRule = null as StyleRule | null
  // let utilitiesNode = null as AtRule | null
  // const variantNodes: AtRule[] = []
  const ignoredCandidates: string[] = []

  walk(ast, (node, { context, parent, replaceWith }) => {
    // Collect custom `@utility` at-rules
    if (node.kind === 'at-rule' && node.name === '@utility') {
      if (parent !== null) {
        throw new Error('`@utility` cannot be nested.')
      }

      if (node.nodes.length === 0) {
        throw new Error(
          `\`@utility ${node.params}\` is empty. Utilities should include at least one property.`,
        )
      }

      const utility = createCssUtility(node)
      if (utility === null) {
        throw new Error(
          `\`@utility ${node.params}\` defines an invalid utility name. Utilities should be alphanumeric and start with a lowercase letter.`,
        )
      }

      customUtilities.push(utility)
    } else if (node.kind === 'at-rule' && node.name === '@custom-variant') {
      // Register custom variants from `@custom-variant` at-rules
      if (parent !== null) {
        throw new Error('`@custom-variant` cannot be nested.')
      }

      // Remove `@custom-variant` at-rule so it's not included in the compiled CSS
      replaceWith([])

      const [name, selector] = segment(node.params, ' ')

      if (!IS_VALID_VARIANT_NAME.test(name)) {
        throw new Error(
          `\`@custom-variant ${name}\` defines an invalid variant name. Variants should only contain alphanumeric, dashes or underscore characters.`,
        )
      }

      if (node.nodes.length > 0 && selector) {
        throw new Error(`\`@custom-variant ${name}\` cannot have both a selector and a body.`)
      }

      // Variants with a selector, but without a body, e.g.: `@custom-variant hocus (&:hover, &:focus);`
      if (node.nodes.length === 0) {
        if (!selector) {
          throw new Error(`\`@custom-variant ${name}\` has no selector or body.`)
        }

        const selectors = segment(selector.slice(1, -1), ',')
        if (selectors.length === 0 || selectors.some((selector) => selector.trim() === '')) {
          throw new Error(
            `\`@custom-variant ${name} (${selectors.join(',')})\` selector is invalid.`,
          )
        }

        const atRuleParameters: string[] = []
        const styleRuleSelectors: string[] = []

        for (let selector of selectors) {
          selector = selector.trim()

          if (selector.startsWith('@')) {
            atRuleParameters.push(selector)
          } else {
            styleRuleSelectors.push(selector)
          }
        }

        customVariants.push((designSystem) => {
          designSystem.variants.static(
            name,
            (r) => {
              const nodes: AstNode[] = []

              if (styleRuleSelectors.length > 0) {
                nodes.push(styleRule(styleRuleSelectors.join(', '), r.nodes))
              }

              for (const selector of atRuleParameters) {
                nodes.push(rule(selector, r.nodes))
              }

              r.nodes = nodes
            },
            {
              compounds: compoundsForSelectors([...styleRuleSelectors, ...atRuleParameters]),
            },
          )
        })

        return
      }

      // Variants without a selector, but with a body:
      //
      // E.g.:
      //
      // ```css
      // @custom-variant hocus {
      //   &:hover {
      //     @slot;
      //   }
      //
      //   &:focus {
      //     @slot;
      //   }
      // }
      // ```
      else {
        customVariants.push((designSystem) => {
          designSystem.variants.fromAst(name, node.nodes)
        })

        return
      }
    } else if (node.kind === 'at-rule' && node.name === '@theme') {
      // Handle `@theme`
      let [themeOptions, themePrefix] = parseThemeOptions(node.params)

      if (context.reference) {
        themeOptions |= ThemeOptions.REFERENCE
      }

      if (themePrefix) {
        // if (!IS_VALID_PREFIX.test(themePrefix)) {
        //   throw new Error(
        //     `The prefix "${themePrefix}" is invalid. Prefixes must be lowercase ASCII letters (a-z) only.`,
        //   )
        // }

        throw new Error(`Theme prefix is not supported.`)

        // theme.prefix = themePrefix
      }

      // Record all custom properties in the `@theme` declaration
      walk(node.nodes, (child) => {
        // Collect `@keyframes` rules to re-insert with theme variables later,
        // since the `@theme` rule itself will be removed.
        if (child.kind === 'at-rule' && child.name === '@keyframes') {
          theme.addKeyframes(child)
          return WalkAction.Skip
        }

        if (child.kind === 'comment') return
        if (child.kind === 'declaration' && child.property.startsWith('--')) {
          theme.add(unescape(child.property), child.value ?? '', themeOptions)
          return
        }

        const snippet = toCss([atRule(node.name, node.params, [child])])
          .split('\n')
          .map(
            (line, index, all) => `${index === 0 || index >= all.length - 2 ? ' ' : '>'} ${line}`,
          )
          .join('\n')

        throw new Error(
          `\`@theme\` blocks must only contain custom properties or \`@keyframes\`.\n\n${snippet}`,
        )
      })

      // Keep a reference to the first `@theme` rule to update with the full
      // theme later, and delete any other `@theme` rules.
      if (!firstThemeRule) {
        firstThemeRule = styleRule('REMOVE_THIS', [])
        replaceWith([firstThemeRule])
      } else {
        replaceWith([])
      }

      return WalkAction.Skip
    } else {
      if (parent === null) {
        throw new Error('only @theme, @utility or @custom-variant are allowed')
      }
    }
  })

  const designSystem = buildDesignSystem(theme)

  if (important) {
    designSystem.important = important
  }

  if (ignoredCandidates.length > 0) {
    for (const candidate of ignoredCandidates) {
      designSystem.invalidCandidates.add(candidate)
    }
  }

  for (const customVariant of customVariants) {
    customVariant(designSystem)
  }

  for (const customUtility of customUtilities) {
    customUtility(designSystem)
  }

  // Output final set of theme variables at the position of the first
  // `@theme` rule.
  if (firstThemeRule) {
    const nodes = []

    for (const [key, value] of designSystem.theme.entries()) {
      if (value.options & ThemeOptions.REFERENCE) continue

      nodes.push(decl(escape(key), value.value))
    }

    const keyframesRules = designSystem.theme.getKeyframes()
    for (const keyframes of keyframesRules) {
      // Wrap `@keyframes` in `AtRoot` so they are hoisted out of `:root` when
      // printing. We push it to the top-level of the AST so that an eventual
      // `@reference` does not cut it out when printing the document.
      ast.push(context({ theme: true }, [atRoot([keyframes])]))
    }

    firstThemeRule.nodes = [context({ theme: true }, nodes)]
  }

  // FIXME: is this necessary?
  features |= substituteAtVariant(ast, designSystem)
  features |= substituteFunctions(ast, designSystem)
  features |= substituteAtApply(ast, designSystem)

  // Remove `@utility`, we couldn't replace it before yet because we had to
  // handle the nested `@apply` at-rules first.

  walk(ast, (node, { replaceWith }) => {
    if (node.kind !== 'at-rule') return

    if (node.name === '@utility') {
      replaceWith([])
    }

    // The `@utility` has to be top-level, therefore we don't have to traverse
    // into nested trees.
    return WalkAction.Skip
  })

  return {
    ast,
    designSystem,
    features,
  }
}

// // Apply `@variant` at-rules
// if (node.name === '@variant') {
//   // Legacy `@variant` at-rules containing `@slot` or without a body should
//   // be considered a `@custom-variant` at-rule.
//   if (parent === null) {
//     // Body-less `@variant`, e.g.: `@variant foo (…);`
//     if (node.nodes.length === 0) {
//       node.name = '@custom-variant'
//     }
//
//     // Using `@slot`:
//     //
//     // ```css
//     // @variant foo {
//     //   &:hover {
//     //     @slot;
//     //   }
//     // }
//     // ```
//     else {
//       walk(node.nodes, (child) => {
//         if (child.kind === 'at-rule' && child.name === '@slot') {
//           node.name = '@custom-variant'
//           return WalkAction.Stop
//         }
//       })
//
//       // No `@slot` found, so this is still a regular `@variant` at-rule
//       if (node.name === '@variant') {
//         variantNodes.push(node)
//       }
//     }
//   }
//
//   // Collect all the `@variant` at-rules, we will replace them later once
//   // all variants are registered in the system.
//   else {
//     variantNodes.push(node)
//   }
// }
//
// Find `@tailwind utilities` so that we can later replace it with the
// actual generated utility class CSS.
// if (
//   node.name === '@tailwind' &&
//   (node.params === 'utilities' || node.params.startsWith('utilities'))
// ) {
//   // Any additional `@tailwind utilities` nodes can be removed
//   if (utilitiesNode !== null) {
//     replaceWith([])
//     return
//   }
//
//   utilitiesNode = node
//   features |= Features.Utilities
// }

// Replace the `@tailwind utilities` node with a context since it prints
// children directly.
// if (utilitiesNode) {
//   const node = utilitiesNode as AstNode as Context
//   node.kind = 'context'
//   node.context = {}
// }

// Replace the `@variant` at-rules with the actual variant rules.
// if (variantNodes.length > 0) {
//   for (const variantNode of variantNodes) {
//     // Starting with the `&` rule node
//     const node = styleRule('&', variantNode.nodes)
//
//     const variant = variantNode.params
//
//     const variantAst = designSystem.parseVariant(variant)
//     if (variantAst === null) {
//       throw new Error(`Cannot use \`@variant\` with unknown variant: ${variant}`)
//     }
//
//     const result = applyVariant(node, variantAst, designSystem.variants)
//     if (result === null) {
//       throw new Error(`Cannot use \`@variant\` with variant: ${variant}`)
//     }
//
//     // Update the variant at-rule node, to be the `&` rule node
//     Object.assign(variantNode, node)
//   }
//   features |= Features.Variants
// }
//
// if (node.name === '@media') {
//   const parameters = segment(node.params, ' ')
//   const unknownParameters: string[] = []
//
//   for (const parameter of parameters) {
//     // Handle `@media source(…)`
//     if (parameter.startsWith('source(')) {
//       const path = parameter.slice(7, -1)
//
//       walk(node.nodes, (child, { replaceWith }) => {
//         if (child.kind !== 'at-rule') return
//
//         if (child.name === '@tailwind' && child.params === 'utilities') {
//           child.params += ` source(${path})`
//           replaceWith([contextNode({ sourceBase: context.base }, [child])])
//           return WalkAction.Stop
//         }
//       })
//     }
//
//     // Handle `@media theme(…)`
//     //
//     // We support `@import "tailwindcss" theme(reference)` as a way to
//     // import an external theme file as a reference, which becomes `@media
//     // theme(reference) { … }` when the `@import` is processed.
//     else if (parameter.startsWith('theme(')) {
//       const themeParameters = parameter.slice(6, -1)
//       const hasReference = themeParameters.includes('reference')
//
//       walk(node.nodes, (child) => {
//         if (child.kind !== 'at-rule') {
//           if (hasReference) {
//             throw new Error(
//               `Files imported with \`@import "…" theme(reference)\` must only contain \`@theme\` blocks.\nUse \`@reference "…";\` instead.`,
//             )
//           }
//
//           return WalkAction.Continue
//         }
//
//         if (child.name === '@theme') {
//           child.params += ' ' + themeParameters
//           return WalkAction.Skip
//         }
//       })
//     }
//
//     // Handle `@media prefix(…)`
//     //
//     // We support `@import "tailwindcss" prefix(ident)` as a way to
//     // configure a theme prefix for variables and utilities.
//     else if (parameter.startsWith('prefix(')) {
//       const prefix = parameter.slice(7, -1)
//
//       walk(node.nodes, (child) => {
//         if (child.kind !== 'at-rule') return
//         if (child.name === '@theme') {
//           child.params += ` prefix(${prefix})`
//           return WalkAction.Skip
//         }
//       })
//     }
//
//     // Handle important
//     else if (parameter === 'important') {
//       important = true
//     }
//
//     // Handle `@import "…" reference`
//     else if (parameter === 'reference') {
//       node.nodes = [contextNode({ reference: true }, node.nodes)]
//     }
//
//     //
//     else {
//       unknownParameters.push(parameter)
//     }
//   }
//
//   if (unknownParameters.length > 0) {
//     node.params = unknownParameters.join(' ')
//   } else if (parameters.length > 0) {
//     replaceWith(node.nodes)
//   }
// }
