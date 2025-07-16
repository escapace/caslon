import type { Hono } from 'hono'
import { validator } from 'hono/validator'
import { fontPreferencesSchema } from './font-preferences-schema'

export const fontRoute = (hono: Hono) => {
  hono.post(
    '/session/font',
    validator('json', (value, context) => {
      const parseResult = fontPreferencesSchema.safeParse(value)

      if (!parseResult.success) {
        return context.text('Invalid!', 401)
      }

      return parseResult.data
    }),
    async (context) => {
      const { session } = context.var

      session.set('font', context.req.valid('json'))

      for (const value of await session.values()) {
        context.header('set-cookie', value, { append: true })
      }

      return context.json({ success: true })
    },
  )
}
