/* eslint-disable typescript/no-non-null-assertion */
import { substituteAtApply } from './tailwindcss/apply'
import {
  toCss as _toCss,
  atRule,
  decl,
  optimizeAst,
  styleRule,
  walk,
  type AstNode,
} from './tailwindcss/ast'
import type { Candidate } from './tailwindcss/candidate'
import { substituteFunctions } from './tailwindcss/css-functions'
import { parse } from './tailwindcss/css-parser'
import type { DesignSystem } from './tailwindcss/design-system'
import { ThemeOptions } from './tailwindcss/theme'
import { escape } from './tailwindcss/utils/escape'
import { DEFAULT_THEME } from './theme'
import { parseCss } from './utilities/css-parse'
import { sortAstNodes } from './utilities/sort-ast-nodes'
import { substituteAtVariant } from './utilities/substitute-at-variant'

// TODO: move themeSelector to theme
export interface Options {
  theme?: string
  themeSelector?: string
}

const toCss = (value: AstNode[]) =>
  value.length === 0 || value.every((value) => value.kind === 'at-rule' && value.nodes.length === 0)
    ? undefined
    : _toCss(value)

export class Compiler {
  public designSystem!: DesignSystem
  public options!: Pick<Options, 'theme'> & Required<Pick<Options, 'themeSelector'>>
  public themeAst!: AstNode[]
  public themeValues!: ReadonlyArray<[string, { options: ThemeOptions; value: string }]>

  async reset(options: Options = {}) {
    this.options = {
      ...options,
      themeSelector: options.themeSelector ?? ':where(:root,:host,::backdrop,::selection)',
    }

    const { ast, designSystem } = await parseCss(
      [DEFAULT_THEME, this.options.theme].filter((value) => value !== undefined).join('\n'),
    )

    // @ts-expect-error private
    this.themeValues = Array.from(designSystem.theme.values.entries())

    this.designSystem = designSystem
    this.themeAst = ast
  }

  private compileAstNodes(matches: Map<string, Candidate[]>) {
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

    // console.log(JSON.stringify(this.themeAst, null, 2))

    return optimizeAst(
      [...structuredClone(this.themeAst), atRule('@layer', 'utilities', astNodes)],
      this.designSystem,
    )
  }

  private compileLayers(
    astNodes: AstNode[],
    options?: Partial<Pick<Options, 'themeSelector'>>,
  ): {
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
          theme.length === 0
            ? theme
            : [styleRule(options?.themeSelector ?? this.options.themeSelector, theme)],
        ),
      ],
      utilities,
    }
  }

  private transformStyle(css: string) {
    const ast = parse(css)

    substituteAtVariant(ast, this.designSystem)
    substituteFunctions(ast, this.designSystem)
    substituteAtApply(ast, this.designSystem)

    return toCss(optimizeAst(ast, this.designSystem))
  }

  private candidatesToCss(
    rawCandidates: string[],
    options?: Partial<Pick<Options, 'themeSelector'>>,
  ) {
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

    // if (matches.size === 0) {
    //   return
    // }

    const astNodes = this.compileAstNodes(matches)

    if (astNodes.length === 0) {
      return
    }

    const layers = this.compileLayers(astNodes, options)

    const array = (
      ['theme', 'utilities', 'properties', 'keyframes'] satisfies Array<keyof typeof layers>
    )
      .map((layer) => [layer, toCss(layers[layer])])
      .filter((value): value is [keyof typeof layers, string] => value[1] !== undefined)
      .map((value) => value[1])

    return array.length === 0 ? undefined : array.join('\n')
  }

  public compile(
    candidates: string[],
    styles: string[] = [],
    options?: Partial<Pick<Options, 'themeSelector'>>,
  ): [base: string | undefined, ...Array<string | undefined>] {
    // @ts-expect-error private
    this.designSystem.theme.values = new Map(structuredClone(this.themeValues))

    const transformedStyles = styles.map((value) => this.transformStyle(value))
    const base = this.candidatesToCss(candidates, options)

    return [base, ...transformedStyles]
  }
}
