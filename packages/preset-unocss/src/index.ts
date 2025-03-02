import type { Preset, PresetOptions } from '@unocss/core'
import { definePreset } from '@unocss/core'
import { extractorArbitraryVariants } from '@unocss/extractor-arbitrary-variants'
import { shorthands } from '@unocss/preset-wind4'
import { postprocessors } from '@unocss/preset-wind4/postprocess'
import { shortcuts } from '@unocss/preset-wind4/shortcuts'
import { variants } from './variants'
import { preflights } from './preflights'
import { rules } from './rules'
import type { Theme } from './theme'
import { theme } from './theme'

export type { Theme }

export interface DarkModeSelectors {
  /**
   * Selector for light variant.
   *
   * @defaultValue '.light'
   */
  light?: string

  /**
   * Selector for dark variant.
   *
   * @defaultValue '.dark'
   */
  dark?: string
}

export interface PresetCaslonOptions extends PresetOptions {
  /**
   * Dark mode options
   *
   * @defaultValue 'class'
   */
  dark?: 'class' | 'media' | DarkModeSelectors

  /**
   * Generate tagged pseudo selector as `[group=""]` instead of `.group`
   *
   * @defaultValue false
   */
  attributifyPseudo?: boolean

  /**
   * Prefix for CSS variables.
   *
   * @defaultValue 'un-'
   */
  variablePrefix?: string

  /**
   * Utils prefix. When using tagged pseudo selector, only the first truthy prefix will be used.
   *
   * @defaultValue undefined
   */
  prefix?: string | string[]

  /**
   * Enable arbitrary variants, for example `<div class="[&>*]:m-1 [&[open]]:p-2"></div>`.
   *
   * Disable this might slightly improve the performance.
   *
   * @defaultValue true
   */
  arbitraryVariants?: boolean

  /**
   * Choose which theme keys to export as CSS variables.
   */
  themeKeys?: ((keys: string[]) => string[]) | string[]

  /**
   * The important option lets you control whether UnoCSS’s utilities should be marked with `!important`.
   *
   * This can be really useful when using UnoCSS with existing CSS that has high specificity selectors.
   *
   * You can also set `important` to a selector like `#app` instead, which will generate `#app :is(.m-1) { ... }`
   *
   * Also check out the compatibility with [:is()](https://caniuse.com/?search=%3Ais())
   *
   * @defaultValue false
   */
  important?: boolean | string

  // /**
  //  * Reset the default preflight styles.
  //  *
  //  * @default true
  //  */
  // reset?: boolean
}

export const presetCaslon = definePreset<PresetCaslonOptions, Theme>((options = {}) => {
  options.attributifyPseudo = options.attributifyPseudo ?? false
  options.variablePrefix = options.variablePrefix ?? 'un-'
  options.important = options.important ?? false

  return {
    autocomplete: {
      shorthands,
    },
    extractorDefault:
      options.arbitraryVariants === false ? undefined : extractorArbitraryVariants(),
    layers: {
      theme: -150,
    },
    name: '@caslon/preset-unocss',
    options,
    postprocess: postprocessors(options),
    prefix: options.prefix,
    preflights: preflights(options),
    rules,
    shortcuts,
    theme,
    variants: variants(options),
  } satisfies Preset<Theme>
})
