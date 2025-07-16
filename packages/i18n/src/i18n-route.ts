import type { Hono } from 'hono'
import { validator } from 'hono/validator'
import { i18nPreferencesSchema } from './i18n-preferences-schema'

export const i18nRoute = (hono: Hono) => {
  hono.post(
    '/session/i18n',
    validator('json', (value, context) => {
      const parseResult = i18nPreferencesSchema.safeParse(value)

      if (!parseResult.success) {
        return context.text('Invalid!', 401)
      }

      return parseResult.data
    }),
    async (context) => {
      const { session } = context.var

      session.set('i18n', context.req.valid('json'))

      for (const value of await session.values()) {
        context.header('set-cookie', value, { append: true })
      }

      return context.json({ success: true })
    },
  )
}
