import type { App, Plugin } from 'vue'
import { FETCH_INJECTION_KEY } from './constants'

export const createFetch = (options: { fetch: typeof fetch }): Plugin => ({
  install: (app: App) => {
    app.provide(FETCH_INJECTION_KEY, options.fetch)
  },
})
