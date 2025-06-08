import { useDocumentVisibility, useIdle, useOnline, useTimeout } from '@vueuse/core'
import { type Pinia, defineStore, skipHydrate } from 'pinia'
import {
  type App,
  type InjectionKey,
  type Ref,
  computed,
  inject,
  onScopeDispose,
  ref,
  watch,
} from 'vue'
import { serviceWorkerRegister } from './service-worker-register'

type Dispose = () => void

interface ScheduleUpdateChecksReferences {
  scheduled: boolean
  registration?: ServiceWorkerRegistration
  scriptURL?: string
}

const serviceWorkerCheckUpdate = async (references: ScheduleUpdateChecksReferences) => {
  try {
    if (references.scriptURL === undefined) {
      return
    }

    const isInstalling = !(references.registration?.installing == null)

    if (isInstalling) {
      return
    }

    const response = await fetch(references.scriptURL, {
      cache: 'no-store',
      headers: {
        'cache': 'no-store',
        'cache-control': 'no-cache',
      },
    })

    if (response.status === 200) {
      console.debug('checking for service worker updates')

      await references.registration?.update()
    } else {
      throw new Error(`fetch '${references.scriptURL}' failed with status code ${response.status}`)
    }
  } catch (error: unknown) {
    console.debug(
      'failed to check for service worker updates',
      error instanceof Error ? `: ${error.message}` : undefined,
    )
  }

  return
}

const scheduleUpdateChecks = (
  references: ScheduleUpdateChecksReferences,
  updateCheckMilliseconds: number,
  disposables: Set<Dispose>,
  ...conditions: Array<Ref<boolean>>
): void => {
  if (references.scheduled) {
    return
  }

  references.scheduled = true

  const { ready, start, stop } = useTimeout(updateCheckMilliseconds, {
    callback: () => setTimeout(start),
    controls: true,
  })

  const sources = computed(() => [ready, ...conditions].every(({ value }) => value))

  const dispose = watch(
    sources,
    (value) => {
      if (value) {
        void serviceWorkerCheckUpdate(references)
      }
    },
    { immediate: false },
  )

  disposables.add(() => {
    stop()
    dispose()
    references.scheduled = false
  })
}

const updateServiceWorkerState = (
  state: Ref<ServiceWorkerState | undefined>,
  registration?: ServiceWorkerRegistration,
): void => {
  const serviceWorker = registration?.installing ?? registration?.waiting ?? registration?.active

  if (state.value !== serviceWorker?.state) {
    state.value = serviceWorker?.state
  }

  serviceWorker?.addEventListener('statechange', () =>
    updateServiceWorkerState(state, registration),
  )
}

const createServiceWorkerUpdateLock =
  (serviceWorkerLocks: Ref<Set<symbol>>, disposables: Set<Dispose>) =>
  (reference: Ref<boolean>): Dispose => {
    const key = Symbol('service-worker-lock')

    const dispose = watch(
      reference,
      (value) => {
        if (value) {
          serviceWorkerLocks.value.add(key)
        } else {
          serviceWorkerLocks.value.delete(key)
        }
      },
      { immediate: true },
    )

    disposables.add(dispose)

    return () => {
      dispose()
      serviceWorkerLocks.value.delete(key)
    }
  }

export interface CreateServiceWorkerPluginOptions {
  enabled: boolean
  pinia: Pinia
  updateAfterIdleMilliseconds: number
  updateCheckEveryMilliseconds: number
}

export const createServiceWorkerPlugin = (options: CreateServiceWorkerPluginOptions) => {
  const { pinia } = options

  const createServiceWorkerStore = defineStore('service-worker', () => {
    const serviceWorkerUpdateLocks = ref(new Set<symbol>())
    const disposables = new Set<Dispose>()
    const serviceWorkerUpdateLock = createServiceWorkerUpdateLock(
      serviceWorkerUpdateLocks,
      disposables,
    )
    const serviceWorkerState = ref<ServiceWorkerState | undefined>()

    if (options.enabled) {
      const documentVisibility = useDocumentVisibility()
      const isDocumentHidden: Ref<boolean> = computed(() => documentVisibility.value === 'hidden')
      const isOnline = useOnline()
      const isServiceWorkerUpdateUnlocked = computed(
        () => serviceWorkerUpdateLocks.value.size === 0,
      )
      const isServiceWorkerObsolete: Ref<boolean> = ref(false)
      const { idle: isIdle } = useIdle(options.updateAfterIdleMilliseconds)
      const scheduleUpdateChecksReferences: ScheduleUpdateChecksReferences = {
        scheduled: false,
      }

      const isServiceWorkerUpdate = computed(
        () =>
          isServiceWorkerObsolete.value &&
          isServiceWorkerUpdateUnlocked.value &&
          isIdle.value &&
          isDocumentHidden.value,
      )

      if (process?.env?.NODE_ENV !== 'production') {
        disposables.add(
          watch(isServiceWorkerUpdateUnlocked, (value) =>
            console.debug(`service worker update lock is ${value ? 'off' : 'on'}`),
          ),
        )
      }

      const updateServiceWorker = serviceWorkerRegister({
        onNeedRefresh() {
          if (!isServiceWorkerObsolete.value) {
            isServiceWorkerObsolete.value = true
          }
        },
        onRegisteredSW(scriptURL, registration) {
          console.debug(`service worker registration`, registration)
          updateServiceWorkerState(serviceWorkerState, registration)

          registration?.addEventListener('updateFound', () =>
            updateServiceWorkerState(serviceWorkerState, registration),
          )

          if (registration !== undefined) {
            scheduleUpdateChecksReferences.registration = registration
            scheduleUpdateChecksReferences.scriptURL = scriptURL

            scheduleUpdateChecks(
              scheduleUpdateChecksReferences,
              options.updateCheckEveryMilliseconds,
              disposables,
              isOnline,
            )
          }
        },
        onRegisterError(error) {
          updateServiceWorkerState(serviceWorkerState)
          console.warn(`service worker registration error`, error)
        },
        scriptURL: '/service-worker.js',
      })

      disposables.add(
        watch(
          isServiceWorkerUpdate,
          (value) => {
            if (value) {
              console.debug('updating service worker')

              void updateServiceWorker()
            }
          },
          { immediate: true },
        ),
      )
    }

    onScopeDispose(() => {
      try {
        disposables.forEach((value) => value())
      } catch {}
    })

    return {
      serviceWorkerState: skipHydrate(serviceWorkerState),
      serviceWorkerUpdateLock,
    }
  })

  const storeServiceWorker = createServiceWorkerStore(pinia)

  return {
    install: (app: App) => {
      app.provide(injectionKeyUseStoreServiceWorker, storeServiceWorker)
    },
    store: storeServiceWorker,
  }
}

export type ServiceWorkerStore = ReturnType<typeof createServiceWorkerPlugin>['store']

const injectionKeyUseStoreServiceWorker: InjectionKey<ServiceWorkerStore> = Symbol(
  'injectionKeyUseStoreServiceWorker',
)

export function useServiceWorkerStore() {
  const store = inject(injectionKeyUseStoreServiceWorker)

  if (store === undefined) {
    throw Error('no store provided')
  }

  return store
}
