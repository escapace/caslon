import type { InjectionKey } from 'vue'
import type { CepheusStore } from './create-cepheus'

export const CEPHEUS_STORE_INJECTION_KEY: InjectionKey<CepheusStore> =
  Symbol.for('@caslon/cepheus/store')
