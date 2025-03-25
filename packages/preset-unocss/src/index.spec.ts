import { assert, describe, expect, it } from 'vitest'
import { Compiler } from './compiler'

describe('compiler', () => {
  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset(`
body {
  background-color: black;
}

@layer layer {
  .tab-4 {
    tab-size: 4;
  }
}
`)

    expect(
      compiler.compile([
        'bg-linear-to-t',
        'from-sky-50-50',
        'to-indigo-50-50/75',
        'animate-spin',
        'tab-4',
      ]),
    ).toMatchSnapshot()

    assert.equal(compiler.compile([]), undefined)
  })

  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset('')

    assert.equal(compiler.compile(['nonexistent']), undefined)
    assert.equal(compiler.compile([]), undefined)
  })

  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset(`
@utility content-auto {
  content-visibility: auto;
}

@custom-variant pointer-coarse (@media (pointer: coarse));
`)

    expect(compiler.compile(['content-auto', 'pointer-coarse:relative'])).toMatchSnapshot()
  })
})
