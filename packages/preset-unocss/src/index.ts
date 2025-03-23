/* eslint-disable typescript/no-non-null-assertion */
import { sequentialize } from '@escapace/sequentialize'
import { definePreset, type Preflight, type Preset, type Rule } from '@unocss/core'
import {
  atRoot,
  context,
  decl,
  optimizeAst,
  styleRule,
  toCss,
  walk,
  type AstNode,
} from './tailwindcss/ast'
import type { Candidate } from './tailwindcss/candidate'
import { buildDesignSystem, type DesignSystem } from './tailwindcss/design-system'
import { ThemeOptions, type Theme } from './tailwindcss/theme'
import { escape } from './tailwindcss/utils/escape'
import { createTwTheme } from './utilities/create-tw-theme'
import { sortAstNodes } from './utilities/sort-ast-nodes'

class PresetCaslon {
  public designSystem!: DesignSystem
  public matches = new Map<string, Candidate[]>()
  public theme!: Theme

  constructor() {
    this.matches.clear()
    const theme = createTwTheme()
    const designSystem = buildDesignSystem(theme)

    this.theme = theme
    this.designSystem = designSystem
  }

  createRule(): Rule {
    return [
      /.+/,
      ([rawCandidate] /* , { symbols } */) => {
        if (this.designSystem.invalidCandidates.has(rawCandidate)) {
          // onInvalidCandidate?.(rawCandidate)
          return // Bail, invalid candidate
        }

        const candidates = this.designSystem.parseCandidate(rawCandidate)
        if (candidates.length === 0) {
          this.designSystem.invalidCandidates.add(rawCandidate)
          // onInvalidCandidate?.(rawCandidate)
          return // Bail, invalid candidate
        }

        this.matches.set(rawCandidate, candidates)

        return undefined
      },
    ]
  }

  private toCss(ast: AstNode[], layer?: string) {
    const _layer = layer === 'theme' || layer === 'utilities' ? layer : undefined
    const _ast = layer === 'theme' ? [styleRule(':root', ast)] : ast

    return ast.length === 0
      ? undefined
      : _layer === undefined
        ? toCss(_ast)
        : [
            `@layer ${_layer} {`,
            ...toCss(_ast)
              .split('\n')
              .map((value) => `  ${value}`),
            `}`,
          ].join('\n')
  }

  private createAstNodes() {
    const nodeSorting = new Map<
      AstNode,
      { candidate: string; properties: { count: number; order: number[] }; variants: bigint }
    >()
    const astNodes: AstNode[] = []
    // const astNodesKeyframes: AstNode[] = []

    const variantOrderMap = this.designSystem.getVariantOrder()

    for (const [rawCandidate, candidates] of this.matches) {
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

    for (const keyframes of this.designSystem.theme.getKeyframes()) {
      // Wrap `@keyframes` in `AtRoot` so they are hoisted out of `:root` when
      // printing. We push it to the top-level of the AST so that an eventual
      // `@reference` does not cut it out when printing the document.
      astNodes.unshift(context({ theme: true }, [atRoot([keyframes])]))
    }

    return optimizeAst(astNodes, this.designSystem)
  }

  private splitAstNodes(): {
    keyframes: AstNode[]
    properties: AstNode[]
    theme: AstNode[]
    utilities: AstNode[]
  } {
    const utilities = this.createAstNodes()
    const properties: AstNode[] = []
    const theme: AstNode[] = []
    const keyframes: AstNode[] = []

    walk(utilities, (value, tools) => {
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

    walk(utilities, (value, tools) => {
      if (value.kind === 'at-rule' && value.name === '@keyframes') {
        keyframes.push(value)
        tools.replaceWith([])
      }
    })

    return {
      keyframes,
      properties,
      theme,
      utilities,
    }
  }

  public preflights(): Preflight[] {
    let nodes:
      | {
          keyframes: AstNode[]
          properties: AstNode[]
          theme: AstNode[]
          utilities: AstNode[]
        }
      | undefined

    const wrap = sequentialize()

    return ([undefined, 'theme', 'utilities', 'properties', 'keyframes'] as const).map(
      (layer): Preflight => {
        if (layer === undefined) {
          // eslint-disable-next-line typescript/require-await
          const getCSS = wrap(async () => {
            nodes = this.splitAstNodes()

            return undefined
          })

          return {
            getCSS,
            layer,
          }
        } else {
          // eslint-disable-next-line typescript/require-await
          const getCSS = wrap(async () => {
            const ast = nodes![layer]

            return this.toCss(ast, layer)
          })

          return {
            getCSS,
            layer,
          }
        }
      },
    )
  }
}

export const presetCaslon = definePreset(() => {
  const preset = new PresetCaslon()

  return {
    autocomplete: {
      templates: preset.designSystem.getClassList().map(([value]) => value),
    },
    configResolved(options) {
      if (options.outputToCssLayers === true || typeof options.outputToCssLayers === 'object') {
        throw new Error(`@caslon/preset-unocss: outputToCssLayers is not supported.`)
      }
    },
    layers: {
      keyframes: 150,
      properties: 100,
      theme: -150,
      utilities: 0,
    },
    name: '@caslon/preset-unocss',
    // options,
    preflights: preset.preflights(),
    rules: [preset.createRule()],
    theme: {},
  } satisfies Preset
})

// // @ts-expect-error private
// const mapUtilities = designSystem.utilities.utilities
// const mapVariants = designSystem.variants.variants
