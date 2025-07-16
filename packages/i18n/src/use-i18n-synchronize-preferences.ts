/// <reference types="@pangram/font-loader" />

import { useHead } from '@unhead/vue'
import { onMounted, watch, ref, onScopeDispose } from 'vue'
import { useFontMutation } from './use-font-mutation'
import { useI18nMutation } from './use-i18n-mutation'
import { useI18nStore } from './use-i18n-store'
import { deepEqual } from 'fast-equals'
import { storeToRefs } from 'pinia'

export const useI18nSynchronizePreferences = () => {
  const i18n = storeToRefs(useI18nStore())
  const fonts = ref<string[]>([])

  useHead(
    {
      htmlAttrs: {
        lang: () => i18n.locale.value,
      },
    },
  )

  onMounted(() => {
    const fontMutation = useFontMutation()
    const i18nMutation = useI18nMutation()

    const { locale } = i18n

    // TODO: load locale styles
    watch(locale, (locale) => {
      void window.fontLoader(locale)
      void i18nMutation.mutation({ locale })
    })

    onScopeDispose(
      window.fontLoaderSubscribe((value) => {
        if (value.some(({ state }) => state === 'font-loaded')) {
          const newValue = Array.from(
            new Set([...fonts.value, ...value.map(({ slug }) => slug)]),
          ).sort()

          if (!deepEqual(fonts.value, newValue)) {
            fonts.value = newValue
          }
        }
      }),
    )

    watch(
      fonts,
      (fonts) => {
        void fontMutation.mutation({ fonts })
      },
      { deep: false },
    )
  })
}
