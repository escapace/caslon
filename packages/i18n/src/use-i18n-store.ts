import { inject } from 'vue'
import { I18N_STORE_INJECTION_KEY } from './constants'

export function useI18nStore() {
  const store = inject(I18N_STORE_INJECTION_KEY)

  if (store === undefined) {
    throw Error('no store provided')
  }

  return store
}
