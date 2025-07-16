import { useHead } from '@unhead/vue'
import { storeToRefs } from 'pinia'
import { computed, onMounted, toValue, type MaybeRef } from 'vue'
import { useCepheusMutation } from './use-cepheus-mutation'
import { useCepheusStore } from './use-cepheus-store'

export const useCepheusSynchronizePreferences = (
  options: { darkBackgroundColor?: MaybeRef<string>; lightBackgroundColor?: MaybeRef<string> } = {},
) => {
  const store = useCepheusStore()

  const { settingsColorScheme } = storeToRefs(store)

  const colorSchemeProperty = computed(() =>
    settingsColorScheme.value === undefined
      ? 'normal'
      : settingsColorScheme.value === 'dark'
        ? 'dark light'
        : 'light dark',
  )

  const backgroundColor = computed(() =>
    settingsColorScheme.value === undefined
      ? undefined
      : settingsColorScheme.value === 'dark'
        ? (toValue(options.darkBackgroundColor) ?? 'black')
        : (toValue(options.lightBackgroundColor) ?? 'white'),
  )

  useHead(
    {
      htmlAttrs: {
        class: {
          dark: () => settingsColorScheme.value === 'dark',
          light: () => settingsColorScheme.value === 'light',
        },
        style: {
          'background-color': () => backgroundColor.value ?? false,
          'color-scheme': () => colorSchemeProperty.value,
        },
      },
      meta: [
        {
          content: colorSchemeProperty,
          name: 'color-scheme',
        },
      ],
    }
  )

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
