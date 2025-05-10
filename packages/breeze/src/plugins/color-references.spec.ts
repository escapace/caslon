import { describe, expect, it } from 'vitest'
import { Compiler } from '../index'

describe('cepheus', () => {
  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(compiler.compile({ candidates: ['bg-zzz'] })).toMatchSnapshot()
    await compiler.reset({ theme: `@theme { --cepheus-colors: 'zzz', asd; }` })
    expect(compiler.compile({ candidates: ['bg-zzz'] })).toMatchSnapshot()
  })
})
