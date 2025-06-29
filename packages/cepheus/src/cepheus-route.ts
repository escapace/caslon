import type { Hono } from 'hono'
import { validator } from 'hono/validator'
import { cepheusPreferencesSchema } from './cepheus-preferences-schema'

export const cepheusRoute = (server: Hono) => {
  server.post(
    '/session/theme',
    validator('json', (value, context) => {
      const parseResult = cepheusPreferencesSchema.safeParse(value)

      if (!parseResult.success) {
        return context.text('Invalid!', 401)
      }

      return parseResult.data
    }),
    async (context) => {
      const { session } = context.var

      session.set('cepheus', context.req.valid('json'))

      for (const value of await session.values()) {
        context.header('set-cookie', value, { append: true })
      }

      return context.json({ success: true })
    },
  )
}
