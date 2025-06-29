/* eslint-disable typescript/no-explicit-any */
import 'hono'
import type { Cookies } from 'seedpods'

declare module 'hono' {
  interface ContextVariableMap {
    session: Cookies<any>
  }
}
