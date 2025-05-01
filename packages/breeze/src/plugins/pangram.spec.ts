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

    console.log(compiler.compile(['sans-serif-[1lh]/[1]']))
  })
})
