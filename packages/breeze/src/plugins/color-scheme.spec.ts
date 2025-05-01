import { describe, expect, it } from 'vitest'
import { Compiler } from '../index'

describe('color-scheme', () => {
  it('colors', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(compiler.compile(['bg-primary-15-15-10'])).toMatchSnapshot()
    expect(compiler.compile(['bg-primary-15-15/10'])).toMatchSnapshot()
    expect(compiler.compile(['bg-primary-15-15/[71.37%]'])).toMatchSnapshot()
    expect(compiler.compile(['bg-(---color-primary-15-15)'])).toMatchSnapshot()
    expect(compiler.compile(['bg-(---color-primary-15-15)/10'])).toMatchSnapshot()
    expect(compiler.compile(['bg-[primary-15-15]'])).toMatchSnapshot()
    expect(
      compiler.compile(['bg-linear-to-t', 'from-primary-50-50', 'to-0-50-50']),
    ).toMatchSnapshot()
  })

  it('light/dark', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(compiler.compile(['dark:container'])).toMatchSnapshot()
    expect(compiler.compile(['light:container'])).toMatchSnapshot()
  })
})
