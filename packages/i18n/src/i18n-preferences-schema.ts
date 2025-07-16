import { z } from 'zod/v4'

export const i18nPreferencesSchema = z.object({
  locale: z.enum(I18N_LOCALES),
})

export type I18nPreferences = z.infer<typeof i18nPreferencesSchema>
