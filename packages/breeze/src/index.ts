/* eslint-disable typescript/no-non-null-assertion */
import { colorReferences } from './plugins/color-references'
import { colorScheme } from './plugins/color-scheme'
import { typography } from './plugins/typography'
import { vue } from './plugins/vue'
import { Polyfills } from './tailwindcss'
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
import type { LoadStylesheet } from './tailwindcss/at-import'
import type { Candidate } from './tailwindcss/candidate'
import { substituteFunctions } from './tailwindcss/css-functions'
import { parse } from './tailwindcss/css-parser'
import type { DesignSystem } from './tailwindcss/design-system'
import { MapLazy, type ThemeEntry } from './tailwindcss/patches'
import { ThemeOptions } from './tailwindcss/theme'
import { escape } from './tailwindcss/utils/escape'
import { DEFAULT_THEME } from './theme'
import { parseCss } from './utilities/css-parse'
import { markUsedTransientVariables } from './utilities/mark-used-transient-variables'
import { option } from './utilities/option'
import { sortAstNodes } from './utilities/sort-ast-nodes'
import { substituteAtVariant } from './utilities/substitute-at-variant'

const polyfills = Polyfills.All

export interface Options {
  directory?: string
  loadStyleSheet?: LoadStylesheet
  selector?: string
  theme?: string
}

const toCss = (value: AstNode[], track?: boolean) =>
  value.length === 0 || value.every((value) => value.kind === 'at-rule' && value.nodes.length === 0)
    ? undefined
    : _toCss(value, track)

const DEFAULT_SELECTOR = ':where(:root,:host)'

export class Compiler {
  public designSystem!: DesignSystem
  private readonly options: Options = {}
  private themeAst!: AstNode[]
  private themeValues!: ThemeEntry[]

  async reset(options: Options = {}) {
    Object.assign(this.options, options)

    const { ast, designSystem } = await parseCss({
      css: [DEFAULT_THEME, this.options.theme].filter((value) => value !== undefined).join('\n'),
      directory: options.directory,
      loadStyleSheet: options.loadStyleSheet,
    })

    if (this.options.selector === undefined) {
      Object.assign(this.options, { selector: option(designSystem, 'string', '--selector') })
    }

    colorReferences(designSystem)
    vue(designSystem)
    colorScheme(designSystem)
    typography(designSystem)

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
    const validCandidates = new Set<string>()

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

      if (found) {
        validCandidates.add(rawCandidate)
      } else {
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

    // if (astNodes.length !== 0) {
    //   astNodes.unshift(comment(` caslon-utilities: ${[...validCandidates].join(', ')} `))
    // }

    markUsedTransientVariables(astNodes, this.designSystem)

    const result = optimizeAst(
      [...structuredClone(this.themeAst), atRule('@layer', 'utilities', astNodes)],
      this.designSystem,
      polyfills,
    )

    walk(result, (value, tools) => {
      if (value.kind === 'rule' && value.selector === 'REMOVE_THIS') {
        tools.replaceWith([])
      }
    })

    return [result, validCandidates] as const
  }

  private compileLayers(
    astNodes: AstNode[],
    options?: Partial<Pick<Options, 'selector'>>,
  ): {
    keyframes: AstNode[]
    propertiesAtRules: AstNode[]
    propertiesLayer: AstNode[]
    theme: AstNode[]
    utilities: AstNode[]
  } {
    const utilities: AstNode[] = []
    const propertiesAtRules: AstNode[] = []
    const theme: AstNode[] = []
    const keyframes: AstNode[] = []
    const propertiesLayer: AstNode[] = []

    walk(astNodes, (value, tools) => {
      if (value.kind === 'at-rule' && value.name === '@property') {
        propertiesAtRules.push(value)
        tools.replaceWith([])
      }
    })

    walk(astNodes, (value, tools) => {
      if (value.kind === 'at-rule' && value.name === '@layer' && value.params === 'properties') {
        if (value.nodes.length !== 0) {
          propertiesLayer.push(value)
        }
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
      if (value.kind === 'at-rule' && value.name === '@layer' && value.params === 'utilities') {
        utilities.push(value)
        tools.replaceWith([])
      }
    })

    return {
      keyframes,
      propertiesAtRules,
      propertiesLayer,
      theme: [
        atRule(
          '@layer',
          'theme',
          theme.length === 0
            ? theme
            : [styleRule(options?.selector ?? this.options.selector ?? DEFAULT_SELECTOR, theme)],
        ),
      ],
      utilities,
    }
  }

  private transformStyle(css: string | undefined) {
    if (css === undefined) {
      return
    }

    const ast = parse(css)

    substituteAtVariant(ast, this.designSystem)
    substituteFunctions(ast, this.designSystem)
    substituteAtApply(ast, this.designSystem)

    return toCss(optimizeAst(ast, this.designSystem, polyfills))
  }

  private candidatesToCss(rawCandidates: string[], options?: Partial<Pick<Options, 'selector'>>) {
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

    const [astNodes, validCandidates] = this.compileAstNodes(matches)

    if (astNodes.length === 0) {
      return [undefined, astNodes.length === 0 ? undefined : validCandidates] as const
    }

    const layers = this.compileLayers(astNodes, options)

    const array = (
      ['propertiesLayer', 'theme', 'utilities', 'propertiesAtRules', 'keyframes'] satisfies Array<
        keyof typeof layers
      >
    )
      .map((layer) => [layer, toCss(layers[layer])])
      .filter((value): value is [keyof typeof layers, string] => value[1] !== undefined)
      .map((value) => value[1])

    return array.length === 0
      ? ([undefined, undefined] as const)
      : ([
          ['@layer properties, theme, base, components, utilities;', ...array].join('\n'),
          validCandidates,
        ] as const)
  }

  public compile(
    options?: {
      candidates?: string[]
      styles?: Array<string | undefined>
      variables?: string[]
    } & Partial<Pick<Options, 'selector'>>,
  ): {
    candidates: string[]
    css: string | undefined
    styles: Array<string | undefined>
    variables: string[]
  } {
    this.designSystem.theme.values = new MapLazy(
      structuredClone(this.themeValues),
      this.designSystem.theme.resolvers,
    )

    for (const variable of options?.variables ?? []) {
      this.designSystem.theme.markUsedVariable(variable)
    }

    const styles = options?.styles?.map((value) => this.transformStyle(value)) ?? []
    const [css, candidates] =
      options?.candidates === undefined ? [] : this.candidatesToCss(options.candidates, options)

    const variables = [...this.designSystem.theme.values]
      .filter(
        // eslint-disable-next-line typescript/strict-boolean-expressions
        ([_, { options }]) => /* !(options & ThemeOptions.INLINE) && */ options & ThemeOptions.USED,
      )
      .map(([value]) => value)

    return {
      candidates: candidates === undefined ? [] : [...candidates],
      css,
      styles: styles.every((value) => value === undefined) ? [] : styles,
      variables,
    }
  }
}
