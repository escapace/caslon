import { assert, describe, expect, it } from 'vitest'
import { Compiler } from './index'

describe('compiler', () => {
  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset({
      theme: `
body {
  background-color: black;
}

@layer layer {
  .tab-4 {
    tab-size: 4;
  }
}
`,
    })

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
    await compiler.reset({})

    assert.equal(compiler.compile(['nonexistent']), undefined)
    assert.equal(compiler.compile([]), undefined)
  })

  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset({
      theme: `
@utility content-auto-test {
  content-visibility: auto;
}

@custom-variant pointer-coarse-test (@media (pointer: coarse));
`,
    })

    expect(
      compiler.compile(['content-auto-test', 'pointer-coarse-test:relative']),
    ).toMatchSnapshot()
  })

  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(compiler.compile(['animate-spin', 'rounded-xl'])).toMatchSnapshot()
    expect(compiler.compile(['relative'])).toMatchSnapshot()
  })
})
