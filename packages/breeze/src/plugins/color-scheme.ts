import { atRule, styleRule } from '../tailwindcss/ast'
import type { DesignSystem } from '../tailwindcss/design-system'

export const colorScheme = (designSystem: DesignSystem) => {
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
