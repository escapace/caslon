import { canonicalize } from '@escapace/canonicalize'
import { defineMutation } from '@pinia/colada'
import type { I18nPreferences } from './i18n-preferences-schema'
import { useFetch } from '@caslon/utilities'

export const useI18nMutation = defineMutation(() => {
  const fetch = useFetch()

  return {
    mutation: async (value: I18nPreferences) => {
      const response = await fetch('/session/i18n', {
        body: canonicalize(value),
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      // return response.json()
    },
    // onSuccess: data => {
    //   queryClient.setQueryData(['todo', { id: 5 }], data)
    // }
  }
})
