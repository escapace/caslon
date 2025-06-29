import type { Ref } from 'vue'
import { useServiceWorkerStore } from './use-service-worker-store'

export const useServiceWorkerUpdateLock = (reference: Ref<boolean>): (() => void) => {
  const { serviceWorkerUpdateLock } = useServiceWorkerStore()

  return serviceWorkerUpdateLock(reference)
}
