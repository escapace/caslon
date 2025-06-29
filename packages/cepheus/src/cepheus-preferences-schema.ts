import { z } from 'zod/v4'

export const cepheusPreferencesSchema = z.object({
  chroma: z.number().min(0).max(1).optional(),
  colorScheme: z.enum(['dark', 'light']).optional(),
  contrast: z.number().min(0).max(1).optional(),
  lightness: z.number().min(0).max(1).optional(),
  palette: z.enum(['no-preference']).or(z.string()).optional(),
})

export type CepheusPreferences = z.infer<typeof cepheusPreferencesSchema>
