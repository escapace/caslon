import { describe, it } from 'vitest'
import { Compiler } from '../index'

describe('pangram', () => {
  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset({
      pangram: {
        prefixes: ['sans-serif'],
        primaryPrefix: 'sans-serif',
      },
    })

    console.log(compiler.compile({ candidates: ['top-[calc(var(--spacing-y-md))]'] }))
    console.log(compiler.compile({ candidates: ['top-y-md'] }))
    console.log(compiler.compile({ variables: ['--spacing-y-md'] }))
    console.log(compiler.compile({ candidates: ['top-y-md'], variables: ['--spacing-y-md'] }))
  })
})
