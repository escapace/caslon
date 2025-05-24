import { calculateClamp, calculateTypeSize, checkWCAG } from '@caslon/utopia'
import { atRule, decl, styleRule, type AstNode } from '../tailwindcss/ast'
import type { ThemeValueResolver } from '../tailwindcss/patches'
import { ThemeOptions } from '../tailwindcss/theme'
import { escape } from '../tailwindcss/utils/escape'
import { inferDataType, isValidSpacingMultiplier } from '../tailwindcss/utils/infer-data-type'
import type { PluginOptions } from '../types'
import { assert } from '../utilities/assert'
import { breakpointsRange } from '../utilities/breakpoints-range'
import { isValidLineHeight } from '../utilities/is-valid-line-height'
import { isValidTypeScale } from '../utilities/is-valid-type-scale'
import { markUsedTransientVariables } from '../utilities/mark-used-transient-variables'
import { option } from '../utilities/option'

const isWithinRange = (number: number, range: [number, number]): boolean => {
  const [min, max] = range
  assert(min <= max, 'Invalid range: min should be less than or equal to max.')
  return number >= min && number <= max
}

const DEFAULT_LINE_HEIGHT = 1.5
const DEFAULT_X_HEIGHT = '1ex'

interface TypographyOptions extends PluginOptions {
  maxFontSize: number
  maxTypeScale: number
  maxWidth: number
  minFontSize: number
  minTypeScale: number
  minWidth: number
  primaryStack: string
  stacks: string[]
  wcagConformanceRange: [number, number]
}

const calcualateSpacingPair = (
  value: [number, number],
  options: Required<
    Pick<TypographyOptions, 'maxFontSize' | 'maxWidth' | 'minFontSize' | 'minWidth'>
  >,
) => {
  const [a, b] = value.map((multiplier) => ({
    maxSize: Math.round(options.maxFontSize * multiplier),
    minSize: Math.round(options.minFontSize * multiplier),
  }))

  return calculateClamp({
    maxSize: b.maxSize,
    maxWidth: options.maxWidth,
    minSize: a.minSize,
    minWidth: options.minWidth,
    relativeTo: 'viewport-width',
  })
}

const createResolver =
  (options: TypographyOptions): ThemeValueResolver =>
  (value) => {
    const array =
      /^--(?<type>spacing|x-height)-(?<x>-?(?:\d+\.)?\d+)(?:(?<separator>[/-])(?<y>-?(?:\d+\.)?\d+|lh))?$/i.exec(
        value,
      )

    if (array?.groups === undefined) {
      return undefined
    }

    const { separator, type, x, y } = array.groups as Record<string, string | undefined>

    if (type !== 'x-height' && type !== 'spacing') {
      return undefined
    }

    if (x === undefined) {
      return undefined
    }

    const xx = parseFloat(x)

    if (isNaN(xx)) {
      return undefined
    }

    if (type === 'x-height' && y === undefined && isValidTypeScale(xx)) {
      const minFontSize = calculateTypeSize(options, options.minWidth, xx)
      const maxFontSize = calculateTypeSize(options, options.maxWidth, xx)

      if (!isWithinRange(xx, options.wcagConformanceRange)) {
        const wcag = checkWCAG({
          max: maxFontSize,
          maxWidth: options.maxWidth,
          min: minFontSize,
          minWidth: options.minWidth,
        })

        if (Array.isArray(wcag) && wcag.length > 0) {
          options.warning(`WCAG 1.4.4 violation for type size ${xx}: ${wcag[0]}-${wcag[1]}.`)
        }
      }

      const clamp = calculateClamp({
        maxSize: maxFontSize,
        maxWidth: options.maxWidth,
        minSize: minFontSize,
        minWidth: options.minWidth,
        relativeTo: 'viewport-width',
      })

      const value = `${clamp} * var(--${options.primaryStack}-x-height)`

      markUsedTransientVariables(value, options.designSystem)

      return {
        options: ThemeOptions.DEFAULT,
        src: undefined,
        value,
      }
    }

    if (y === undefined) {
      return undefined
    }

    if (type !== 'spacing') {
      return undefined
    }

    if (y === 'lh' && separator === '/' && isValidTypeScale(xx)) {
      // How many of the font’s own x‑heights lie between one baseline and the top of the lower‑case letters on the next line, given a particular line-height.
      //   `--interline-x-height`,
      //   `((var(--${prefix}-cap-x-ratio) * (var(--line-height, 1) - 1)) + var(--${prefix}-baseline-offset))`,
      const value = `calc(var(${escape(`--x-height-${xx}`)}) * ((var(--${options.primaryStack}-cap-x-ratio) * (var(--line-height) - 1)) + var(--${options.primaryStack}-baseline-offset)))`

      markUsedTransientVariables(value, options.designSystem)

      // typographic spacing
      return {
        options: ThemeOptions.INLINE,
        src: undefined,
        value,
      }
    }

    const yy = parseFloat(y)

    if (isNaN(yy)) {
      return undefined
    }

    if (separator === '/' && isValidTypeScale(xx) && isValidLineHeight(yy)) {
      const value = `calc(var(${escape(`--x-height-${xx}`)}) * ((var(--${options.primaryStack}-cap-x-ratio) * ${yy - 1}) + var(--${options.primaryStack}-baseline-offset)))`

      markUsedTransientVariables(value, options.designSystem)

      return {
        options: ThemeOptions.DEFAULT,
        src: undefined,
        value,
      }
    }

    if (separator === '-' && isValidSpacingMultiplier(xx) && isValidSpacingMultiplier(yy)) {
      if (xx === 0 && yy === 0) {
        return
      }

      const value = `calc(${calcualateSpacingPair([xx, yy], {
        maxFontSize: options.maxFontSize,
        maxWidth: options.maxWidth,
        minFontSize: options.minFontSize,
        minWidth: options.minWidth,
      })} * var(--${options.primaryStack}-x-width-average))`

      markUsedTransientVariables(value, options.designSystem)

      return {
        options: ThemeOptions.DEFAULT,
        src: undefined,
        value,
      }
    }

    return undefined
  }

const createSpacingVariables = (options: TypographyOptions) => {
  const { designSystem } = options
  const resolver = createResolver(options)

  designSystem.theme.resolvers.push(resolver)

  const spacingVariable = resolver('--x-height-0')

  assert(spacingVariable !== undefined)

  designSystem.theme.add('--x-height-0', spacingVariable.value, spacingVariable.options)

  designSystem.theme.values.delete('--spacing')
  designSystem.theme.add(
    `--spacing`,
    `calc(((var(--x-height-0)) / var(--${options.primaryStack}-x-height)) * var(--${options.primaryStack}-x-width-average))`,
  )
}

const createStyleVariables = (options: TypographyOptions) => {
  const { designSystem } = options
  const { theme } = designSystem

  for (const prefix of options.stacks) {
    const isPrimary = prefix === options.primaryStack

    theme.add(`--${prefix}-distance-top`, `(var(--${prefix}-ascent) - var(--${prefix}-cap-height))`)
    theme.add(`--${prefix}-leading`, `(var(--${prefix}-distance-top) - var(--${prefix}-descent))`)

    if (isPrimary) {
      theme.add(
        `--${prefix}-cap-x-ratio`,
        `(var(--${prefix}-cap-height) / var(--${prefix}-x-height))`,
      )
      theme.add(
        `--${prefix}-baseline-offset`,
        `((var(--${prefix}-ascent) - var(--${prefix}-descent) - var(--${prefix}-x-height)) / var(--${prefix}-x-height))`,
      )
    } else {
      theme.add(
        `--${prefix}-x-height-scale`,
        `(var(--${prefix}-x-height) / var(--${options.primaryStack}-x-height))`,
      )
    }
  }
}

const createAstNodes = (options: {
  primaryStack: string
  stack: string
  lineHeight?: string
  xHeight?: string
}) => {
  const { lineHeight, primaryStack, stack: prefix, xHeight } = options

  const isPrimary = prefix === primaryStack

  const declarations: AstNode[] = [
    decl('font-family', `var(--${prefix}-font-family)`),
    decl('font-stretch', `var(--${prefix}-font-stretch)`),
    decl('font-style', `var(--${prefix}-font-style)`),
    decl('font-variation-settings', `var(--${prefix}-font-variation-settings)`),
    decl('font-weight', `var(--${prefix}-font-weight)`),
  ]

  if (typeof lineHeight === 'string') {
    declarations.push(decl('--line-height', lineHeight))
  }

  if (typeof xHeight === 'string') {
    declarations.push(decl('--x-height', xHeight))
  }

  declarations.push(
    decl(
      '--tw-line-height-ratio',
      isPrimary
        ? `1`
        : `calc((var(--${prefix}-x-height-scale) * (var(--line-height, ${DEFAULT_LINE_HEIGHT}) * var(--${primaryStack}-cap-height) + var(--${primaryStack}-leading)) - var(--${prefix}-leading)) / (var(--line-height, ${DEFAULT_LINE_HEIGHT}) * var(--${prefix}-cap-height)))`,
    ),
    decl(
      '--tw-line-height',
      `(var(--line-height, ${DEFAULT_LINE_HEIGHT}) * var(--tw-line-height-ratio))`,
    ),
    decl(
      '--tw-cap-height',
      `((var(--x-height, ${DEFAULT_X_HEIGHT}) * var(--${prefix}-cap-height)) / var(--${prefix}-x-height))`,
    ),
    decl('--tw-font-size', `(var(--tw-cap-height) / var(--${prefix}-cap-height))`),
    decl('--tw-vertical-align', `(var(--tw-font-size) * var(--${prefix}-leading))`),
    decl(
      `--tw-line-height-length`,
      `((var(--tw-line-height) * var(--tw-cap-height)) + var(--tw-vertical-align))`,
    ),
    decl(`font-size`, `calc(var(--tw-font-size))`),
    decl(`line-height`, `calc(var(--tw-line-height-length))`),

    atRule('@supports', '(text-box: trim-both ex alphabetic)', [
      decl('text-box', 'trim-both ex alphabetic'),
    ]),

    atRule('@supports', 'not (text-box: trim-both ex alphabetic)', [
      decl(
        `--tw-text-box-trim-start`,
        `(-1 * var(--tw-font-size) * (((2 * var(--${prefix}-leading)) + (var(--${prefix}-cap-height) * (var(--tw-line-height) + 1)) - (2 * var(--${prefix}-x-height)) - var(--${prefix}-line-gap)) / 2))`,
      ),
      decl(
        `--tw-text-box-trim-end`,
        `((var(--tw-cap-height) * (var(--tw-line-height) - 1) / 2) * -1)`,
      ),
      styleRule('&::before', [
        decl('display', 'inline-block'),
        decl('content', `''`),
        decl('margin-bottom', 'calc(var(--tw-text-box-trim-start))'),
      ]),
      styleRule('&::after', [
        decl('display', 'inline-block'),
        decl('content', `''`),
        decl('margin-top', 'calc(var(--tw-text-box-trim-end))'),
      ]),
    ]),
  )

  return declarations
}

const createStyleUtilities = (options: TypographyOptions) => {
  const { designSystem } = options
  const { theme, utilities } = designSystem
  const { primaryStack } = options

  for (const stack of options.stacks) {
    utilities.functional(stack, (candidate) => {
      const xHeight =
        candidate.value === null
          ? null
          : candidate.value.kind === 'named'
            ? isValidTypeScale(candidate.value.value)
              ? theme.resolve(candidate.value.value, ['--x-height'])
              : null
            : candidate.value.kind === 'arbitrary'
              ? inferDataType(candidate.value.value, ['length', 'percentage']) === null
                ? null
                : candidate.value.value
              : null

      if (xHeight === null) {
        return null
      }

      const lineHeight =
        candidate.modifier === null
          ? undefined
          : candidate.modifier?.kind === 'named'
            ? isValidLineHeight(candidate.modifier.value) || candidate.modifier.value === 'lh'
              ? candidate.modifier.value
              : null
            : null

      if (lineHeight === null) {
        return null
      }

      return createAstNodes({
        lineHeight,
        primaryStack,
        stack,
        xHeight,
      })
    })
  }
}

const createOptions = (pluginOptions: PluginOptions): TypographyOptions | undefined => {
  const { designSystem } = pluginOptions

  let primaryStack = option(designSystem, 'string', '--typography-primary-stack')
  primaryStack =
    typeof primaryStack === 'string'
      ? /^[a-z-]+$/.test(primaryStack)
        ? primaryStack
        : undefined
      : undefined

  let stacks = option(designSystem, 'array-string', '--typography-stacks')
    ?.filter((value) => /^[a-z-]+$/.test(value))
    ?.filter((value) => value !== undefined)
  stacks = stacks?.length === 0 ? undefined : stacks

  if (primaryStack === undefined || stacks === undefined) {
    return
  }

  assert(stacks.includes(primaryStack))

  const [minWidthTheme, maxWidthTheme] = breakpointsRange(designSystem)

  const minFontSize = option(designSystem, 'number', '--typography-min-font-size') ?? 18
  const minTypeScale = option(designSystem, 'number', '--typography-min-scale') ?? 1.2
  const minWidth = option(designSystem, 'number', '--typography-min-width') ?? minWidthTheme

  const maxFontSize = option(designSystem, 'number', '--typography-max-font-size') ?? 20
  const maxTypeScale = option(designSystem, 'number', '--typography-max-scale') ?? 1.25
  const maxWidth = option(designSystem, 'number', '--typography-max-width') ?? maxWidthTheme

  const wcagConformanceRange = option(
    designSystem,
    'array-number',
    '--typography-wcag-conformance-range',
  ) ?? [-2, 6]

  assert(
    minFontSize <= maxFontSize,
    '--typography-max-font-size must be larger or equal to --typography-min-font-size',
  )

  assert(
    minTypeScale <= maxTypeScale,
    '--typography-max-scale must be larger or equal to --typography-min-scale',
  )

  assert(
    minWidth <= maxWidth,
    '--typography-max-width must be larger or equal to --typography-min-width',
  )

  assert(
    designSystem.theme.get(['--x-height']) === null,
    '--x-height variable is not permitted in theme.',
  )
  assert(
    designSystem.theme.get(['--line-height']) === null,
    '--line-height variable is not permitted in theme.',
  )

  return {
    ...pluginOptions,

    primaryStack,
    stacks,

    maxFontSize,
    maxTypeScale,
    maxWidth,
    minFontSize,
    minTypeScale,
    minWidth,
    wcagConformanceRange: [Math.min(...wcagConformanceRange), Math.max(...wcagConformanceRange)],
  }
}

export const typography = (pluginOptions: PluginOptions) => {
  const options = createOptions(pluginOptions)

  if (options === undefined) {
    return
  }

  createStyleVariables(options)
  createSpacingVariables(options)
  createStyleUtilities(options)
}

// // @ts-expect-error untyped
// const { suggest } = utilities.references as {
//   functionalUtility: (classRoot: string, desc: UtilityDescription) => void
//   staticUtility: (
//     className: string,
//     declarations: Array<(() => AstNode) | [string, string]>,
//   ) => void
//   suggest: (classRoot: string, defns: () => SuggestionDefinition[]) => void
// }

// suggest(stack, () => [
//   {
//     modifiers: Array.from({ length: 21 }, (_, index) => `${index * 5}`),
//     values: ['current', 'inherit', 'transparent'],
//     valueThemeKeys: ['--text-color', '--color'],
//   },
//   {
//     modifiers: [],
//     modifierThemeKeys: ['--leading'],
//     values: [],
//     valueThemeKeys: ['--x-height'],
//   },
// ])
