import type { InjectionKey } from 'vue'

export const FETCH_INJECTION_KEY: InjectionKey<typeof fetch> = Symbol.for('@caslon/utilities/fetch')
