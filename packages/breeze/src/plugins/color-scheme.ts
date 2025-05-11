import { atRule, styleRule } from '../tailwindcss/ast'
import type { PluginOptions } from '../types'

export const colorScheme = (options: PluginOptions) => {
  const { designSystem } = options

  designSystem.variants.static('dark', (r) => {
    r.nodes = [
      styleRule('&:not(.light, .light *, .dark, .dark *)', [
        atRule('@media', '(prefers-color-scheme: dark)', r.nodes),
      ]),
      styleRule('&:is(.dark, .dark *)', r.nodes),
    ]
  })

  designSystem.variants.static('light', (r) => {
    r.nodes = [
      styleRule('&:not(.light, .light *, .dark, .dark *)', [
        atRule('@media', '(prefers-color-scheme: light)', r.nodes),
      ]),
      styleRule('&:is(.light, .light *)', r.nodes),
    ]
  })
}
