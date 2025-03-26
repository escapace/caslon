/* eslint-disable typescript/no-non-null-assertion */
import { atRule, decl, optimizeAst, styleRule, toCss, walk, type AstNode } from './tailwindcss/ast'
import type { Candidate } from './tailwindcss/candidate'
import type { DesignSystem } from './tailwindcss/design-system'
import { ThemeOptions } from './tailwindcss/theme'
import { escape } from './tailwindcss/utils/escape'
import { DEFAULT_THEME } from './theme'
import { parseCss } from './utilities/css-parse'
import { sortAstNodes } from './utilities/sort-ast-nodes'

export interface Options {
  theme?: string
  themeSelector?: string
}

export class Compiler {
  public designSystem!: DesignSystem
  public options!: Pick<Options, 'theme'> & Required<Pick<Options, 'themeSelector'>>
  public themeAst!: AstNode[]

  async reset(options: Options = {}) {
    this.options = {
      ...options,
      themeSelector: options.themeSelector ?? ':where(:root,:host,::backdrop,::selection)',
    }

    const { ast, designSystem } = await parseCss(
      [DEFAULT_THEME, this.options.theme].filter((value) => value !== undefined).join('\n'),
    )

    this.designSystem = designSystem
    this.themeAst = ast
  }

  private createAstNodes(matches: Map<string, Candidate[]>) {
    const nodeSorting = new Map<
      AstNode,
      { candidate: string; properties: { count: number; order: number[] }; variants: bigint }
    >()
    const astNodes: AstNode[] = []

    const variantOrderMap = this.designSystem.getVariantOrder()

    for (const [rawCandidate, candidates] of matches) {
      let found = false

      for (const candidate of candidates) {
        const rules = this.designSystem.compileAstNodes(candidate)
        if (rules.length === 0) continue

        found = true

        for (const { node, propertySort } of rules) {
          // Track the variant order which is a number with each bit representing a
          // variant. This allows us to sort the rules based on the order of
          // variants used.
          let variantOrder = 0n
          for (const variant of candidate.variants) {
            variantOrder |= 1n << BigInt(variantOrderMap.get(variant)!)
          }

          nodeSorting.set(node, {
            candidate: rawCandidate,
            properties: propertySort,
            variants: variantOrder,
          })

          astNodes.push(node)
        }
      }

      if (!found) {
        this.designSystem.invalidCandidates.add(rawCandidate)
        // onInvalidCandidate?.(rawCandidate)
      }
    }

    sortAstNodes(astNodes, nodeSorting)

    // for (const keyframes of this.designSystem.theme.getKeyframes()) {
    //   // Wrap `@keyframes` in `AtRoot` so they are hoisted out of `:root` when
    //   // printing. We push it to the top-level of the AST so that an eventual
    //   // `@reference` does not cut it out when printing the document.
    //   astNodes.unshift(context({ theme: true }, [atRoot([keyframes])]))
    // }

    // astNodes.unshift(...this.themeAst)

    return optimizeAst(
      [...this.themeAst, atRule('@layer', 'utilities', astNodes)],
      this.designSystem,
    )
  }

  private splitAstNodes(astNodes: AstNode[]): {
    keyframes: AstNode[]
    properties: AstNode[]
    theme: AstNode[]
    utilities: AstNode[]
  } {
    const utilities: AstNode[] = []
    const properties: AstNode[] = []
    const theme: AstNode[] = []
    const keyframes: AstNode[] = []

    walk(astNodes, (value, tools) => {
      if (value.kind === 'at-rule' && value.name === '@property') {
        properties.push(value)
        tools.replaceWith([])
      }
    })

    for (const [key, value] of this.designSystem.theme.entries()) {
      // eslint-disable-next-line typescript/strict-boolean-expressions
      if (value.options & ThemeOptions.USED) {
        theme.push(decl(escape(key), value.value))
      }
    }

    walk(astNodes, (value, tools) => {
      if (value.kind === 'at-rule' && value.name === '@keyframes') {
        keyframes.push(value)
        tools.replaceWith([])
      }
    })

    walk(astNodes, (value, tools) => {
      if (value.kind === 'rule' && value.selector === 'REMOVE_THIS') {
        tools.replaceWith([])
      }
    })

    walk(astNodes, (value, tools) => {
      if (value.kind === 'at-rule' && value.name === '@layer' && value.params === 'utilities') {
        utilities.push(value)
        tools.replaceWith([])
      }
    })

    return {
      keyframes,
      properties,
      theme: [
        atRule(
          '@layer',
          'theme',
          theme.length === 0 ? theme : [styleRule(this.options.themeSelector, theme)],
        ),
      ],
      utilities,
    }
  }

  public compile(rawCandidates: string[]) {
    const matches = new Map<string, Candidate[]>()

    for (const rawCandidate of rawCandidates) {
      if (this.designSystem.invalidCandidates.has(rawCandidate)) {
        // onInvalidCandidate?.(rawCandidate)
        continue // Bail, invalid candidate
      }

      const candidates = this.designSystem.parseCandidate(rawCandidate)
      if (candidates.length === 0) {
        this.designSystem.invalidCandidates.add(rawCandidate)
        // onInvalidCandidate?.(rawCandidate)
        continue // Bail, invalid candidate
      }

      matches.set(rawCandidate, candidates)
    }

    if (matches.size === 0) {
      return
    }

    const astNodes = this.createAstNodes(matches)

    if (astNodes.length === 0) {
      return
    }

    const layers = this.splitAstNodes(astNodes)

    // this.toCss(ast, layer)
    const array = (
      ['theme', 'utilities', 'properties', 'keyframes'] satisfies Array<keyof typeof layers>
    )
      .map((layer) => [layer, toCss(layers[layer])])
      .filter((value): value is [keyof typeof layers, string] => value[1] !== undefined)
      .map((value) => value[1])

    return array.length === 0 ? undefined : array.join('\n')
  }
}

// export const presetCaslon = definePreset(() => {
//   const preset = new PresetCaslon()
//
//   return {
//     autocomplete: {
//       templates: preset.designSystem.getClassList().map(([value]) => value),
//     },
//     configResolved(options) {
//       if (options.outputToCssLayers === true || typeof options.outputToCssLayers === 'object') {
//         throw new Error(`@caslon/preset-unocss: outputToCssLayers is not supported.`)
//       }
//     },
//     layers: {
//       keyframes: 150,
//       properties: 100,
//       theme: -150,
//       utilities: 0,
//     },
//     name: '@caslon/preset-unocss',
//     // options,
//     preflights: preset.preflights(),
//     rules: [preset.createRule()],
//     theme: {},
//   } satisfies Preset
// })

// // @ts-expect-error private
// const mapUtilities = designSystem.utilities.utilities
// const mapVariants = designSystem.variants.variants

// ./../vendor/tailwindcss/packages/tailwindcss/theme.css
