import { cepheusPreferencesSchema, type CepheusPreferences } from './cepheus-preferences-schema'

export const cepheusSessionReducer = (previous: unknown, next: unknown): CepheusPreferences => {
  const parseResultA = cepheusPreferencesSchema.safeParse(next)
  const parseResultB = cepheusPreferencesSchema.safeParse(previous)

  const a = parseResultA.success ? parseResultA.data : undefined
  const b = parseResultB.success ? parseResultB.data : undefined

  const result = {
    chroma: a?.chroma ?? b?.chroma,
    colorScheme: a?.colorScheme /* ?? b?.colorScheme */,
    contrast: a?.contrast /* ?? b?.contrast */,
    lightness: a?.lightness ?? b?.lightness,
  } satisfies CepheusPreferences

  return result
}
