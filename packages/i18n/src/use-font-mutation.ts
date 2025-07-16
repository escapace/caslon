import { canonicalize } from '@escapace/canonicalize'
import { defineMutation } from '@pinia/colada'
import { z } from 'zod/v4'
import { fontPreferencesSchema, type FontPreferences } from './font-preferences-schema'
import { useFetch } from '@caslon/utilities'

export const useFontMutation = defineMutation(() => {
  const fetch = useFetch()

  return {
    mutation: async (value: FontPreferences) => {
      const parseResult = fontPreferencesSchema.safeParse(value)

      if (parseResult.success) {
        const response = await fetch('/session/font', {
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
      } else {
        throw new Error(z.prettifyError(parseResult.error))
      }
    },
    // onSuccess: data => {
    //   queryClient.setQueryData(['todo', { id: 5 }], data)
    // }
  }
})
