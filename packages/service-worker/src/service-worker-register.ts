export interface ServiceWorkerRegisterOptions {
  scriptURL: string
  immediate?: boolean
  onNeedRefresh?: () => void
  onOfflineReady?: () => void
  onRegisteredSW?: (
    swScriptUrl: string,
    registration: ServiceWorkerRegistration | undefined,
  ) => void
  onRegisterError?: (error: unknown) => void
  registrationOptions?: RegistrationOptions
}

const AUTO_UPDATE = false

export function serviceWorkerRegister(options: ServiceWorkerRegisterOptions) {
  const {
    immediate = false,
    onNeedRefresh,
    onOfflineReady,
    onRegisteredSW,
    onRegisterError,
  } = options

  let wb: import('workbox-window').Workbox | undefined
  // eslint-disable-next-line prefer-const
  let registerPromise: Promise<void>
  let sendSkipWaitingMessage: (() => void) | undefined

  const updateServiceWorker = async () => {
    await registerPromise

    if (!AUTO_UPDATE) {
      sendSkipWaitingMessage?.()
    }
  }

  async function register() {
    if ('serviceWorker' in navigator) {
      const { Workbox } = await import('workbox-window')
      wb = new Workbox(options.scriptURL, {
        type: 'module',
        updateViaCache: 'all',
        ...options.registrationOptions,
      })
      sendSkipWaitingMessage = () => {
        // Send a message to the waiting service worker,
        // instructing it to activate.
        // Note: for this to work, you have to add a message
        // listener in your service worker. See below.
        wb?.messageSkipWaiting()
      }

      if (AUTO_UPDATE) {
        wb.addEventListener('activated', (event) => {
          if ((event.isUpdate ?? false) || (event.isExternal ?? false)) window.location.reload()
        })
        wb.addEventListener('installed', (event) => {
          if (!(event.isUpdate ?? false)) {
            onOfflineReady?.()
          }
        })
      } else {
        let onNeedRefreshCalled = false
        const showSkipWaitingPrompt = () => {
          onNeedRefreshCalled = true
          // \`event.wasWaitingBeforeRegister\` will be false if this is
          // the first time the updated service worker is waiting.
          // When \`event.wasWaitingBeforeRegister\` is true, a previously
          // updated service worker is still waiting.
          // You may want to customize the UI prompt accordingly.

          // Assumes your app has some sort of prompt UI element
          // that a user can either accept or reject.
          // Assuming the user accepted the update, set up a listener
          // that will reload the page as soon as the previously waiting
          // service worker has taken control.
          wb?.addEventListener('controlling', (event) => {
            if (event.isUpdate ?? false) {
              window.location.reload()
            }
          })

          onNeedRefresh?.()
        }
        wb.addEventListener('installed', (event) => {
          if (event.isUpdate === undefined) {
            if (event.isExternal !== undefined) {
              if (event.isExternal) showSkipWaitingPrompt()
              else !onNeedRefreshCalled && onOfflineReady?.()
            } else {
              if (event.isExternal ?? false) {
                window.location.reload()
              } else !onNeedRefreshCalled && onOfflineReady?.()
            }
          } else if (!event.isUpdate) {
            onOfflineReady?.()
          }
        })
        // Add an event listener to detect when the registered
        // service worker has installed but is waiting to activate.
        wb.addEventListener('waiting', showSkipWaitingPrompt)
        // @ts-expect-error event listener provided by workbox-window
        wb.addEventListener('externalwaiting', showSkipWaitingPrompt)
      }

      // register the service worker
      wb.register({ immediate })
        .then((r) => {
          if (onRegisteredSW != null) onRegisteredSW(options.scriptURL, r)
        })
        .catch((error) => {
          onRegisterError?.(error)
        })
    }
  }

  registerPromise = register()

  return updateServiceWorker
}
