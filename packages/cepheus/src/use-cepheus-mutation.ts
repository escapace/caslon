import { canonicalize } from '@escapace/canonicalize'
import { defineMutation } from '@pinia/colada'
import type { CepheusPreferences } from './cepheus-preferences-schema'
import { useFetch } from '@caslon/utilities'

export const useCepheusMutation = defineMutation(() => {
  const fetch = useFetch()

  return {
    mutation: async (value: CepheusPreferences) => {
      const response = await fetch('/session/theme', {
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
    },
  }
})
