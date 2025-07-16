import type { Context } from 'hono'
import { fontPreferencesSchema, type FontPreferences } from './font-preferences-schema'

export const fontSessionReducer =
  (_: Context) =>
  // eslint-disable-next-line unicorn/consistent-function-scoping
  (previous: unknown, next: unknown): FontPreferences => {
    const parseResultA = fontPreferencesSchema.safeParse(next)
    const parseResultB = fontPreferencesSchema.safeParse(previous)

    const a = parseResultA.success ? parseResultA.data : undefined
    const b = parseResultA.success ? parseResultB.data : undefined

    const fonts = Array.from(new Set([...(a?.fonts ?? []), ...(b?.fonts ?? [])])).sort((a, b) =>
      a.localeCompare(b, 'en'),
    )

    return { fonts }
  }
