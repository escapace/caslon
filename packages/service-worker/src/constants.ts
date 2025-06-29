import type { InjectionKey } from 'vue'
import type { ServiceWorkerStore } from './create-service-worker'

export const SERVICE_WORKER_STORE_INJECTION_KEY: InjectionKey<ServiceWorkerStore> = Symbol.for(
  '@caslon/service-worker/store',
)
