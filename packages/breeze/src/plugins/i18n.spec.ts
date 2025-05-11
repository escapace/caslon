import { describe, expect, it } from 'vitest'
import { Compiler } from '../index'

describe('i18n', () => {
  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(compiler.compile({ candidates: ['lang-en:float-right'] })).toMatchSnapshot()
  })
})
