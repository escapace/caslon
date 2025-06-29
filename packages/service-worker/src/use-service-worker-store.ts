import { inject } from 'vue'
import { SERVICE_WORKER_STORE_INJECTION_KEY } from './constants'

export function useServiceWorkerStore() {
  const store = inject(SERVICE_WORKER_STORE_INJECTION_KEY)

  if (store === undefined) {
    throw Error('no store provided')
  }

  return store
}
