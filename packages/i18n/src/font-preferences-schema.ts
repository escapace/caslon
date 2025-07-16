import { z } from 'zod/v4'

export const fontPreferencesSchema = z.object({
  fonts: z.array(z.enum(I18N_FONTS)).check((context) => {
    if (context.value.length !== new Set(context.value).size) {
      context.issues.push({
        code: 'custom',
        input: context.value,
        message: `No duplicates allowed.`,
      })
    }
  }),
})

export type FontPreferences = z.infer<typeof fontPreferencesSchema>
