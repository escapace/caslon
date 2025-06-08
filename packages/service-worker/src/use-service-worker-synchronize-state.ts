// import { useIsFetching, useIsMutating, useQueryClient } from '@tanstack/vue-query'
// import { tryOnScopeDispose } from '@vueuse/core'
// import { computed, watch } from 'vue'
// import { useServiceWorkerStore } from './use-service-worker-store'
// import { useServiceWorkerUpdateLock } from './use-service-worker-update-lock'
//
// export const useServiceWorkerUpdateLock = () => {
//   const serviceWorker = useServiceWorkerStore()
//
//   const mutationCount = useIsMutating()
//   const fetchingCount = useIsFetching()
//
//   const dispose = serviceWorker.serviceWorkerUpdateLock(
//     computed(() => mutationCount.value + fetchingCount.value !== 0),
//   )
//
//   tryOnScopeDispose(dispose)
// }
//
// export const useServiceWorkerSynchronizeState = () => {
//   if (__PLATFORM__ === 'browser') {
//     useServiceWorkerUpdateLock()
//
//     const storeServiceWorker = useServiceWorkerStore()
//     const query = useQueryClient()
//
//     watch(
//       computed(() => storeServiceWorker.serviceWorkerState),
//       (value) => {
//         console.debug(`service worker state changed '${value ?? 'none'}'`)
//
//         if (value === 'activated') {
//           query.setDefaultOptions({
//             mutations: { networkMode: 'online' },
//             queries: { networkMode: 'offlineFirst' },
//           })
//         } else {
//           query.setDefaultOptions({
//             mutations: { networkMode: 'online' },
//             queries: { networkMode: 'online' },
//           })
//         }
//       },
//       { immediate: true },
//     )
//   }
// }
