import { computed, onMounted } from 'vue'
import { useCepheusMutation } from './use-cepheus-mutation'
import { useCepheusStore } from './use-cepheus-store'
import { useHead } from '@unhead/vue'
import { storeToRefs } from 'pinia'

export const useCepheusSynchronizePreferences = () => {
  const store = useCepheusStore()

  const { settingsColorScheme } = storeToRefs(store)

  const colorSchemeProperty = computed(() =>
    settingsColorScheme.value === undefined
      ? 'normal'
      : settingsColorScheme.value === 'dark'
        ? 'dark light'
        : 'light dark',
  )

  useHead({
    htmlAttrs: {
      class: {
        dark: () => settingsColorScheme.value === 'dark',
        light: () => settingsColorScheme.value === 'light',
      },
      style: () => `color-scheme: ${colorSchemeProperty.value};`,
    },
    meta: [
      {
        content: colorSchemeProperty,
        name: 'color-scheme',
      },
    ],
  })

  onMounted(() => {
    const mutationCepheus = useCepheusMutation()

    store.$subscribe((_, value) => {
      void mutationCepheus.mutation({
        chroma: value.chroma,
        colorScheme: value.colorScheme,
        contrast: value.contrast,
        lightness: value.lightness,
      })
    })
  })
}
