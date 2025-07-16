import { inject } from '@caslon/utilities'
import { type Pinia, defineStore } from 'pinia'
import { type App, ref } from 'vue'
import type { I18nPreferences } from './i18n-preferences-schema'
import { I18N_STORE_INJECTION_KEY } from './constants'

interface Options {
  preferences?: I18nPreferences
}

const createI18nStore = (options: Options) =>
  defineStore('i18n', () => {
    const locale = ref<I18nPreferences['locale']>(
      options.preferences?.locale ?? I18N_LOCALE_DEFAULT,
    )

    return {
      locale,
    }
  })

export const createI18n = (options: Options) => {
  const disposeRefeference = ref<() => void>()

  const dispose = () => {
    const { value } = disposeRefeference

    if (value !== undefined) {
      value()
    }
  }

  return {
    dispose,
    install: (app: App) => {
      // eslint-disable-next-line typescript/no-non-null-assertion
      const pinia: Pinia = inject(app, 'pinia')!
      const store = createI18nStore(options)(pinia)

      disposeRefeference.value = () => {
        store.$dispose()
      }

      app.provide(I18N_STORE_INJECTION_KEY, store)
      app.onUnmount(dispose)
    },
  }
}

export type I18nStore = ReturnType<ReturnType<typeof createI18nStore>>
