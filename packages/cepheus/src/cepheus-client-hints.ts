import type { Context } from 'hono'
import { cepheusPreferencesSchema, type CepheusPreferences } from './cepheus-preferences-schema'

export const cepheusClientHints = (
  context?: Context,
): Pick<CepheusPreferences, 'colorScheme' | 'contrast'> | undefined => {
  const prefersColorScheme = context?.req.header('sec-ch-prefers-color-scheme')?.toLowerCase()
  const prefersContrast = context?.req.header('sec-ch-prefers-contrast')?.toLowerCase()

  const preferences: Pick<CepheusPreferences, 'colorScheme' | 'contrast'> = {
    colorScheme:
      typeof prefersColorScheme === 'string' && ['dark', 'light'].includes(prefersColorScheme)
        ? (prefersColorScheme as 'dark' | 'light')
        : undefined,
    contrast:
      typeof prefersContrast === 'string'
        ? { 'less': 0, 'more': 1, 'no-preference': 0.5 }[prefersContrast.toLowerCase()]
        : undefined,
  }

  const result = cepheusPreferencesSchema.safeParse(preferences)

  return result.success ? result.data : undefined
}
