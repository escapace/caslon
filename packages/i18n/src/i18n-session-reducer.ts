import { pick } from '@escapace/accept-language-parser'
import type { Context } from 'hono'
import { isLocaleSupported } from './is-locale-supported'
import { i18nPreferencesSchema, type I18nPreferences } from './i18n-preferences-schema'

export const i18nSessionReducer =
  (context: Context) =>
  (previous: unknown, next: unknown): I18nPreferences => {
    const parseResultA = i18nPreferencesSchema.safeParse(next)
    const parseResultB = i18nPreferencesSchema.safeParse(previous)

    const a = parseResultA.success ? parseResultA.data : undefined
    const b = parseResultB.success ? parseResultB.data : undefined

    const header = context.req.header('accept-language')

    const locale =
      a?.locale ??
      b?.locale ??
      (header === undefined
        ? undefined
        : pick(header, I18N_LOCALES, { forgiving: true, type: 'lookup' }).find((value) =>
            isLocaleSupported(value),
          )) ??
      I18N_LOCALE_DEFAULT

    return { locale }
  }
