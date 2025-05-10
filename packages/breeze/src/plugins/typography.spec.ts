import { describe, it } from 'vitest'
import { Compiler } from '../index'

describe('typography', () => {
  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset({
      theme: `@theme { --typography-stacks: sans-serif; --typography-primary-stack: sans-serif; }`,
    })

    console.log(compiler.compile({ candidates: ['sans-serif-2.25/2'] }))
    // console.log(compiler.compile({ candidates: ['top-y-md'] }))
    // console.log(compiler.compile({ variables: ['--spacing-y-md'] }))
    // console.log(compiler.compile({ candidates: ['top-y-md'], variables: ['--spacing-y-md'] }))
  })
})
