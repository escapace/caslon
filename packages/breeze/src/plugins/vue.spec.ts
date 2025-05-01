import { describe, expect, it } from 'vitest'
import { Compiler } from '../index'

describe('vue', () => {
  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(compiler.compile(['global:container'])).toMatchSnapshot()
    expect(compiler.compile(['slotted:container'])).toMatchSnapshot()
    expect(compiler.compile(['deep:container'])).toMatchSnapshot()
  })
})
