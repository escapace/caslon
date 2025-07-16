/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable typescript/no-non-null-assertion */

import { inject } from '@caslon/utilities'
import { type Cassiopeia, CASSIOPEIA_INJECTION_KEY } from '@cassiopeia/vue'
import { createCepheus as createCepheus_ } from '@cepheus/vue'
import { runtime } from '@escapace/env'
import {
  useLocalStorage as _useLocalStorage,
  tryOnScopeDispose,
  usePreferredColorScheme,
  usePreferredContrast,
} from '@vueuse/core'
import { lerp, type Palette } from 'cepheus'
import { defineStore, type Pinia, skipHydrate, storeToRefs } from 'pinia'
import { type App, computed, effectScope, ref, unref } from 'vue'
import type { CepheusPreferences } from './cepheus-preferences-schema'
import { CEPHEUS_STORE_INJECTION_KEY } from './constants'

export interface CepheusOptions {
  palette: Palette
  // palettes: MaybeRef<{ [key: string]: Palette; 'no-preference': Palette }>
  clientHints?: Pick<CepheusPreferences, 'colorScheme' | 'contrast'>
  preferences?: CepheusPreferences
}

const useLocalRef = <T>(id: string, value: T) =>
  runtime === 'browser' ? _useLocalStorage(id, value) : ref<T>(value)

const createCepheusStore = (options: Partial<CepheusOptions>) =>
  defineStore('cepheus', () => {
    const CONTRAST_MAX = 0.25
    const CONTRAST_MIN = 0.1
    const { clientHints, preferences } = options

    const palette = useLocalRef<string>('cepheus-palette', preferences?.palette ?? 'no-preference')
    const chroma = useLocalRef('cepheus-chroma', preferences?.chroma ?? 1)
    const lightness = useLocalRef('cepheus-lightness', preferences?.lightness ?? 0.5)
    const contrast = useLocalRef('cepheus-contrast', preferences?.contrast)
    const colorScheme = useLocalRef<'dark' | 'light' | undefined>(
      'cepheus-color-scheme',
      preferences?.colorScheme,
    )

    const browserContrast = usePreferredContrast()
    const settingsContrast = computed<number>(
      () =>
        contrast.value ??
        (browserContrast.value === 'no-preference'
          ? runtime !== 'browser'
            ? clientHints?.contrast
            : undefined
          : browserContrast.value === 'more'
            ? 1
            : browserContrast.value === 'less'
              ? 0
              : undefined) ??
        0.5,
    )

    const browserColorScheme = usePreferredColorScheme()
    const settingsColorScheme = computed<'dark' | 'light' | undefined>(
      () =>
        colorScheme.value ??
        (browserColorScheme.value === 'no-preference'
          ? runtime !== 'browser'
            ? clientHints?.colorScheme
            : 'light'
          : browserColorScheme.value),
    )

    const settingsChroma = computed(() => {
      const min = lerp(0.025, 0, unref(settingsContrast))
      const max = unref(chroma)

      return { max, min: lerp(0, min, max) }
    })

    const settingsLightness = computed(() => {
      const l = unref(lightness)
      const c = lerp(CONTRAST_MAX, CONTRAST_MIN, unref(settingsContrast))

      return { max: lerp(1 - c, 1, l), min: lerp(0, c, l) }
    })

    return {
      chroma,
      colorScheme,
      contrast,
      lightness,
      palette,
      settingsChroma: skipHydrate(settingsChroma),
      settingsColorScheme: skipHydrate(settingsColorScheme),
      settingsLightness: skipHydrate(settingsLightness),
    }
  })

export type CepheusStore = ReturnType<ReturnType<typeof createCepheusStore>>

export const createCepheus = (options: CepheusOptions) => {
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
      const pinia: Pinia = inject(app, 'pinia')!
      const cassiopeia: Cassiopeia = inject(app, CASSIOPEIA_INJECTION_KEY)!
      const store = createCepheusStore(options)(pinia)

      const scope = effectScope(true)

      const cepheus = scope.run(() => {
        const {
          settingsChroma: chroma,
          settingsColorScheme: colorScheme,
          settingsLightness: lightness,
        } = storeToRefs(store)

        // TODO: colors
        const cepheus = createCepheus_({
          chroma,
          colorScheme,
          lightness,
          palette: options.palette,
        })

        tryOnScopeDispose(() => cepheus.dispose())

        return cepheus
      })!

      disposeRefeference.value = () => {
        store.$dispose()
        scope.stop()
      }

      cassiopeia.use(cepheus)
      app.provide(CEPHEUS_STORE_INJECTION_KEY, store)
      app.use(cepheus)
      app.onUnmount(dispose)
    },
  }
}

// const qwe = computedAsync(async (onCancel) => {
//   const abortController = new AbortController()
//
//   onCancel(() => abortController.abort())
//
//   return ''
// })
//
// qwe

// const palette = shallowRef<Palette>(unref(options.palettes)[unref(paletteKey)])

// watch([() => unref(options.palettes), paletteKey] as const, ([palettes, key]) => {
//   const value = palettes[key]
//
//   if (value !== undefined && palette.value !== value) {
//     palette.value = value
//   }
// })
