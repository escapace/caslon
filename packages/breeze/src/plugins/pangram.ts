/* eslint-disable tsdoc/syntax */
/* eslint-disable typescript/strict-boolean-expressions */
import { calculateTypeScale } from '@caslon/utopia'
import { atRoot, atRule, decl, styleRule, type AstNode } from '../tailwindcss/ast'
import type { DesignSystem } from '../tailwindcss/design-system'
import { ThemeOptions, type ThemeKey } from '../tailwindcss/theme'
import type {
  // resolveThemeColor,
  SuggestionDefinition,
  UtilityDescription,
} from '../tailwindcss/utilities'
import { inferDataType, isValidSpacingMultiplier } from '../tailwindcss/utils/infer-data-type'
import { assert } from '../utilities/assert'
import { breakpointsRange } from '../utilities/breakpoints-range'

export function isValidLineHeight(value: unknown) {
  const number_ = Number(value)

  return number_ >= 0 && String(number_) === String(value)
}

/**
 * Ensures a number (or numeric string) is a multiple of another number, and
 * that it has no unnecessary leading or trailing zeros.
 */

const DEFAULT_LINE_HEIGHT = 1.5
const DEFAULT_X_HEIGHT = '1ex'

export interface PangramVerticalSpacingOptions {
  maxScale?: number
  maxWidth?: number
  maxXHeight?: number
  minScale?: number
  minWidth?: number
  minXHeight?: number
  negativeSteps?: number
  positiveSteps?: number
  // TODO: calculateTypeSize?: (options: {
  //   fontSize: number
  //   scale: number
  //   step: number
  //   steps: number
  // }) => number
}

export const createVerticalSpacingVariables = (
  designSystem: DesignSystem,
  options?: PangramOptions,
) => {
  if (options?.primaryPrefix === undefined) {
    return
  }

  const [themeMinWidth, themeMaxWidth] = breakpointsRange(designSystem)

  const negativeSteps = options?.verticalSpacing?.negativeSteps ?? 2
  const positiveSteps = options?.verticalSpacing?.positiveSteps ?? 6

  const minXHeight = options?.verticalSpacing?.minXHeight ?? 9
  const maxXHeight = options?.verticalSpacing?.maxXHeight ?? 16

  const minScale = options?.verticalSpacing?.minScale ?? 1.2
  const maxScale = options?.verticalSpacing?.maxScale ?? 1.25

  const minWidth = options?.verticalSpacing?.minWidth ?? themeMinWidth
  const maxWidth = options?.verticalSpacing?.maxWidth ?? themeMaxWidth

  const maxFontSize = maxXHeight
  const minFontSize = minXHeight

  const scales = calculateTypeScale({
    labelStyle: 'tailwind',
    maxFontSize,
    maxTypeScale: maxScale,
    maxWidth,
    minFontSize,
    minTypeScale: minScale,
    minWidth,
    negativeSteps,
    positiveSteps,
    relativeTo: 'viewport-width',
  })

  const wcagViolations = scales
    .map((value) => value.wcagViolation)
    .filter((value) => value !== undefined)

  if (wcagViolations.length !== 0) {
    throw new Error(
      `WCAG 1.4.4 violation(s): ${wcagViolations.map((value) => `${value.from}-${value.to}`).join(', ')}`,
    )
  }

  for (const scale of scales) {
    designSystem.theme.add(
      `--x-height-${scale.label}`,
      `${scale.clamp} * var(--${options.primaryPrefix}-x-height, 0.5)`,
    )

    // /* How many of the font’s own x‑heights lie between one baseline and the top of the lower‑case letters on the next line, given a particular line-height. */
    // theme.add(
    //   `--interline-x-height`,
    //   `((var(--${prefix}-cap-x-ratio) * (var(--line-height, 1) - 1)) + var(--${prefix}-baseline-offset))`,
    // )

    designSystem.theme.add(
      `--spacing-x-${scale.label}`,
      `calc(((var(--x-height-${scale.label})) / var(--${options.primaryPrefix}-x-height)) * var(--${options.primaryPrefix}-x-width-average))`,
      ThemeOptions.INLINE,
    )

    designSystem.theme.add(
      `--spacing-y-${scale.label}`,
      `calc(var(--x-height-${scale.label}) * ((var(--${options.primaryPrefix}-cap-x-ratio) * (var(--line-height, ${DEFAULT_LINE_HEIGHT}) - 1)) + var(--${options.primaryPrefix}-baseline-offset)))`,
      ThemeOptions.INLINE,
    )
  }
}

const clearNamespace = (designSystem: DesignSystem, namespace: string) => {
  const { utilities } = designSystem

  const value = utilities.get(namespace)
  value.splice(0, value.length)
}

const createVerticalSpacingUtilities = (designSystem: DesignSystem) => {
  const { theme, utilities } = designSystem

  // @ts-expect-error untyped
  const { functionalUtility } = utilities.references as {
    functionalUtility: (classRoot: string, desc: UtilityDescription) => void
    staticUtility: (
      className: string,
      declarations: Array<(() => AstNode) | [string, string]>,
    ) => void
    suggest: (classRoot: string, defns: () => SuggestionDefinition[]) => void
  }

  function spacingUtility(
    name: string,
    themeKeys: ThemeKey[],
    handle: (value: string) => AstNode[] | undefined,
    {
      supportsFractions = false,
      supportsNegative = false,
    }: {
      supportsFractions?: boolean
      supportsNegative?: boolean
    } = {},
  ) {
    clearNamespace(designSystem, name)

    // const themeKeys = _themeKeys.map((value) => `${value}` as `--${string}`)

    functionalUtility(name, {
      defaultValue: null,
      handle,
      handleBareValue: ({ value }) => {
        const multiplier = theme.resolve(null, ['--spacing'])
        if (!multiplier) return null
        if (!isValidSpacingMultiplier(value)) return null

        return `calc(${multiplier} * ${value})`
      },
      handleNegativeBareValue: ({ value }) => {
        const multiplier = theme.resolve(null, ['--spacing'])
        if (!multiplier) return null
        if (!isValidSpacingMultiplier(value)) return null

        return `calc(${multiplier} * -${value})`
      },
      supportsFractions,
      supportsNegative,
      themeKeys,
    })

    // suggest(name, () => [
    //   {
    //     supportsFractions,
    //     supportsNegative,
    //     values: theme.get(['--spacing']) ? DEFAULT_SPACING_SUGGESTIONS : [],
    //     valueThemeKeys: themeKeys,
    //   },
    // ])
  }

  /**
   * @css `margin`
   */
  for (const [namespace, property] of [
    ['my', 'margin-block'],
    ['mt', 'margin-top'],
    ['mb', 'margin-bottom'],
  ] as const) {
    spacingUtility(namespace, ['--margin', '--spacing'], (value) => [decl(property, value)], {
      supportsNegative: true,
    })
  }

  /**
   * @css `inset`
   */
  for (const [name, property] of [
    ['inset-y', 'inset-block'],
    ['top', 'top'],
    ['bottom', 'bottom'],
  ] as const) {
    spacingUtility(name, ['--inset', '--spacing'], (value) => [decl(property, value)], {
      supportsFractions: true,
      supportsNegative: true,
    })
  }

  for (const [name, namespaces, property] of [
    ['h', ['--height', '--spacing'], 'height'],
    ['min-h', ['--min-height', '--height', '--spacing'], 'min-height'],
    ['max-h', ['--max-height', '--height', '--spacing'], 'max-height'],
  ] as Array<[string, ThemeKey[], string]>) {
    spacingUtility(name, namespaces, (value) => [decl(property, value)], {
      supportsFractions: true,
    })
  }

  /**
   * @css `border-spacing`
   */
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const borderSpacingProperties = () =>
    atRoot([
      property('--tw-border-spacing-x', '0', '<length>'),
      property('--tw-border-spacing-y', '0', '<length>'),
    ])

  spacingUtility('border-spacing-y', ['--border-spacing', '--spacing'], (value) => [
    borderSpacingProperties(),
    decl('--tw-border-spacing-y', value),
    decl('border-spacing', 'var(--tw-border-spacing-x) var(--tw-border-spacing-y)'),
  ])

  /**
   * @css `scroll-margin`
   */
  for (const [namespace, property] of [
    ['scroll-my', 'scroll-margin-block'],
    ['scroll-mt', 'scroll-margin-top'],
    ['scroll-mb', 'scroll-margin-bottom'],
  ] as const) {
    spacingUtility(
      namespace,
      ['--scroll-margin', '--spacing'],
      (value) => [decl(property, value)],
      {
        supportsNegative: true,
      },
    )
  }

  /**
   * @css `scroll-padding`
   */
  for (const [namespace, property] of [
    ['scroll-py', 'scroll-padding-block'],
    ['scroll-pt', 'scroll-padding-top'],
    ['scroll-pb', 'scroll-padding-bottom'],
  ] as const) {
    spacingUtility(namespace, ['--scroll-padding', '--spacing'], (value) => [decl(property, value)])
  }

  spacingUtility('gap-y', ['--gap', '--spacing'], (value) => [decl('row-gap', value)])

  spacingUtility(
    'space-y',
    ['--space', '--spacing'],
    (value) => [
      atRoot([property('--tw-space-y-reverse', '0')]),
      styleRule(':where(& > :not(:last-child))', [
        decl('--tw-sort', 'column-gap'),
        decl('--tw-space-y-reverse', '0'),
        decl('margin-block-start', `calc(${value} * var(--tw-space-y-reverse))`),
        decl('margin-block-end', `calc(${value} * calc(1 - var(--tw-space-y-reverse)))`),
      ]),
    ],
    { supportsNegative: true },
  )

  for (const [name, property] of [
    ['py', 'padding-block'],
    ['pt', 'padding-top'],
    ['pb', 'padding-bottom'],
  ] as const) {
    spacingUtility(name, ['--padding', '--spacing'], (value) => [decl(property, value)])
  }

  // /**
  //  * @css `vertical-align`
  //  */
  // functionalUtility('align', {
  //   handle: (value) => [decl('vertical-align', value)],
  //   themeKeys: [],
  // })
}

function property(ident: string, initialValue?: string, syntax?: string) {
  return atRule('@property', ident, [
    decl('syntax', syntax ? `"${syntax}"` : `"*"`),
    decl('inherits', 'false'),

    // If there's no initial value, it's important that we omit it rather than
    // use an empty value. Safari currently doesn't support an empty
    // `initial-value` properly, so we have to design how we use things around
    // the guaranteed invalid value instead, which is how `initial-value`
    // behaves when omitted.
    ...(initialValue ? [decl('initial-value', initialValue)] : []),
  ])
}

const createStyleVariables = (designSystem: DesignSystem, options: PangramOptions) => {
  if (options.prefixes === undefined || options.primaryPrefix === undefined) {
    return
  }

  const { theme } = designSystem

  assert(options.prefixes.includes(options.primaryPrefix))

  for (const prefix of options.prefixes) {
    const isPrimary = prefix === options.primaryPrefix

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
        `(var(--${prefix}-x-height) / var(--${options.primaryPrefix}-x-height))`,
      )
    }
  }
}

export interface PangramOptions {
  prefixes?: string[]
  primaryPrefix?: string
  verticalSpacing?: PangramVerticalSpacingOptions
}

const createStyleUtilities = (designSystem: DesignSystem, options?: PangramOptions) => {
  const { theme, utilities } = designSystem

  if (options?.prefixes === undefined || options?.primaryPrefix === undefined) {
    return
  }

  // @ts-expect-error untyped
  const { suggest } = utilities.references as {
    functionalUtility: (classRoot: string, desc: UtilityDescription) => void
    staticUtility: (
      className: string,
      declarations: Array<(() => AstNode) | [string, string]>,
    ) => void
    suggest: (classRoot: string, defns: () => SuggestionDefinition[]) => void
  }

  for (const prefix of options.prefixes) {
    const isPrimary = prefix === options.primaryPrefix

    const qwe = (xHeight?: string, lineHeight?: string) => {
      // TODO: fallback
      // TODO: prefer local --tw- options
      const declarations: AstNode[] = [
        decl('font-family', `var(--${prefix}-font-family)`),
        decl('font-stretch', `var(--${prefix}-font-stretch)`),
        decl('font-style', `var(--${prefix}-font-style)`),
        decl('font-variation-settings', `var(--${prefix}-font-variation-settings)`),
        decl('font-weight', `var(--${prefix}-font-weight)`),
      ]

      // TODO: assert that there is no --x-height and --line-height variables in theme
      if (typeof lineHeight === 'string') {
        if (!isValidLineHeight(lineHeight)) {
          return null
        }

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
            : `calc((var(--${prefix}-x-height-scale) * (var(--line-height, ${DEFAULT_LINE_HEIGHT}) * var(--${options.primaryPrefix}-cap-height) + var(--${options.primaryPrefix}-leading)) - var(--${prefix}-leading)) / (var(--line-height, ${DEFAULT_LINE_HEIGHT}) * var(--${prefix}-cap-height)))`,
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
            decl('display', 'table'),
            decl('content', `''`),
            decl('margin-bottom', 'calc(var(--tw-text-box-trim-start))'),
          ]),
          styleRule('&::after', [
            decl('display', 'table'),
            decl('content', `''`),
            decl('margin-top', 'calc(var(--tw-text-box-trim-end))'),
          ]),
        ]),
        // TODO: vertical-align: calc(var(--tw-vertical-align));
      )

      return declarations
    }

    utilities.functional(prefix, (candidate) => {
      if (!candidate.value) {
        return qwe(undefined, candidate.modifier?.value)
      }

      if (candidate.value.kind === 'arbitrary') {
        const value: string | null = candidate.value.value
        const type =
          candidate.value.dataType ??
          inferDataType(value, ['color', 'length', 'percentage', 'absolute-size', 'relative-size'])

        switch (type) {
          case 'absolute-size':
          case 'length':
          case 'percentage':
          case 'relative-size':
          case 'size': {
            if (candidate.modifier) {
              let modifier =
                candidate.modifier.kind === 'arbitrary'
                  ? candidate.modifier.value
                  : theme.resolve(candidate.modifier.value, ['--leading'])

              if (!modifier && isValidLineHeight(candidate.modifier.value)) {
                // const multiplier = theme.resolve(null, ['--spacing'])
                // if (!multiplier) return null
                modifier = candidate.modifier.value
              }

              // Shorthand for `leading-none`
              if (!modifier && candidate.modifier.value === 'none') {
                modifier = '1'
              }

              if (modifier) {
                return qwe(value, modifier)
              }

              return null
            }

            return qwe(value)
          }
          default: {
            return null
            // value = asColor(value, candidate.modifier, theme)
            // if (value === null) return
            //
            // return [decl('color', value)]
          }
        }
      }

      // // `color` property
      // {
      //   const value = resolveThemeColor(candidate, theme, ['--text-color', '--color'])
      //   if (value) {
      //     return [decl('color', value)]
      //   }
      // }

      // `font-size` property
      {
        const value = theme.resolveWith(candidate.value.value, ['--x-height'])
        if (value) {
          const [fontSize, options = {}] = Array.isArray(value) ? value : [value]

          if (candidate.modifier) {
            let modifier =
              candidate.modifier.kind === 'arbitrary'
                ? candidate.modifier.value
                : theme.resolve(candidate.modifier.value, ['--leading'])

            if (!modifier && isValidLineHeight(candidate.modifier.value)) {
              // const multiplier = theme.resolve(null, ['--spacing'])
              // if (!multiplier) return null
              modifier = candidate.modifier.value
            }

            // Shorthand for `leading-none`
            if (!modifier && candidate.modifier.value === 'none') {
              modifier = '1'
            }

            if (!modifier) {
              return null
            }

            return qwe(fontSize, modifier)
          }

          if (typeof options === 'string') {
            return qwe(fontSize, options)
          }

          return qwe(fontSize, options['--line-height'])
        }
      }
    })

    suggest(prefix, () => [
      {
        modifiers: Array.from({ length: 21 }, (_, index) => `${index * 5}`),
        values: ['current', 'inherit', 'transparent'],
        valueThemeKeys: ['--text-color', '--color'],
      },
      {
        modifiers: [],
        modifierThemeKeys: ['--leading'],
        values: [],
        valueThemeKeys: ['--x-height'],
      },
    ])
  }
}

// TODO: vertical align
// TODO: line-height
// TODO: font
export const pangram = (designSystem: DesignSystem, options: PangramOptions = {}) => {
  if (options.prefixes === undefined || options.primaryPrefix === undefined) {
    return
  }

  createStyleVariables(designSystem, options)
  createVerticalSpacingVariables(designSystem, options)

  createVerticalSpacingUtilities(designSystem)
  createStyleUtilities(designSystem, options)
}
