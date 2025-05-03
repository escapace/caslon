import { describe, expect, it } from 'vitest'
import { Compiler } from '../index'

describe('vue', () => {
  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(compiler.compile({ candidates: ['global:container'] })).toMatchSnapshot()
    expect(compiler.compile({ candidates: ['slotted:container'] })).toMatchSnapshot()
    expect(compiler.compile({ candidates: ['deep:container'] })).toMatchSnapshot()
  })
})
