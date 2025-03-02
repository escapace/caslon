/* eslint-disable typescript/no-non-null-assertion */
/* eslint-disable typescript/no-unsafe-member-access */
/* eslint-disable typescript/no-unsafe-call */
/* eslint-disable typescript/no-unsafe-argument */
/* eslint-disable typescript/no-explicit-any */
import type { Preflight } from '@unocss/core'
import { camelToHyphen, compressCSS, passThemeKey } from '@unocss/preset-wind4/utils'
import { alphaPlaceholdersRE } from '@unocss/rule-utils'
import type { PresetCaslonOptions } from '.'
import type { Theme } from './theme'

/** Output for CSS Variables */
const DefaultCssVariableKeys: Array<keyof Theme> = [
  // 'font',
  // 'colors',
  // 'text',
  // 'fontWeight',
  // 'tracking',
  // 'leading',

  // 'spacing', // spacing is a special case
  'breakpoint',
  'verticalBreakpoint',
  'container',
  'textStrokeWidth',
  'radius',
  'shadow',
  'insetShadow',
  'dropShadow',
  'textShadow',
  'ease',
  'blur',
  'perspective',
  'property',
  'defaults',
]

function themeToCSVariables(theme: Theme, keys: string[]): string {
  let cssVariables = ''

  function process(object: any, prefix: string) {
    for (const key in object) {
      if (key === 'DEFAULT' && Object.keys(object).length === 1) {
        cssVariables += `${camelToHyphen(`--${prefix}`)}: ${object[key].replace(alphaPlaceholdersRE, '1')};\n`
      }

      if (passThemeKey.includes(key)) continue

      if (Array.isArray(object[key])) {
        cssVariables += `${camelToHyphen(`--${prefix}-${key}`)}: ${object[key].join(',').replace(alphaPlaceholdersRE, '1')};\n`
      } else if (typeof object[key] === 'object') {
        process(object[key], `${prefix}-${key}`)
      } else {
        cssVariables += `${camelToHyphen(`--${prefix}-${key}`)}: ${object[key].replace(alphaPlaceholdersRE, '1')};\n`
      }
    }
  }

  for (const key in theme) {
    if (!keys.includes(key)) continue
    process(theme[key as keyof Theme], key)
  }

  return cssVariables
}

function theme(options: PresetCaslonOptions): Preflight<Theme> {
  const themeKeys =
    typeof options.themeKeys === 'function'
      ? options.themeKeys(DefaultCssVariableKeys)
      : (options.themeKeys ?? DefaultCssVariableKeys)

  return {
    getCSS({ theme }) {
      return compressCSS(`
:root,:host {
--spacing: ${theme.spacing!.DEFAULT};
${themeToCSVariables(theme, themeKeys).trim()}
}`)
    },
    layer: 'theme',
  }
}

export const preflights: (options: PresetCaslonOptions) => Array<Preflight<Theme>> = (options) =>
  [theme(options)].filter(Boolean)
