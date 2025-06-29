import { inject } from 'vue'
import { CEPHEUS_STORE_INJECTION_KEY } from './constants'

export function useCepheusStore() {
  const store = inject(CEPHEUS_STORE_INJECTION_KEY)

  if (store === undefined) {
    throw Error('no store provided')
  }

  return store
}
