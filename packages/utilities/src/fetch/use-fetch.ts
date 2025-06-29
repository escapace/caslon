import { inject } from 'vue'
import { FETCH_INJECTION_KEY } from './constants'

export function useFetch() {
  const fetch = inject(FETCH_INJECTION_KEY)

  if (fetch === undefined) {
    throw Error('fetch is not defined')
  }

  return fetch
}
