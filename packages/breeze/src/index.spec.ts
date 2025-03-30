import { assert, describe, expect, it } from 'vitest'
import { Compiler } from './index'

describe('compiler', () => {
  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(
      compiler.compile(['bg-linear-to-t', 'from-sky-50-50', 'to-indigo-50-50/75', 'animate-spin']),
    ).toMatchSnapshot()

    assert.deepEqual(compiler.compile([]), [undefined])
  })

  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset({})

    assert.deepEqual(compiler.compile(['nonexistent']), [undefined])
    assert.deepEqual(compiler.compile([]), [undefined])
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

  it('.', async () => {
    const compiler = new Compiler()

    await expect(
      async () =>
        await compiler.reset({
          theme: `
@theme {
  ---qwe: test;

  background-color: black
}
`,
        }),
    ).rejects.toThrowError(/must only contain custom properties/)
  })

  it('.', async () => {
    const compiler = new Compiler()

    await expect(
      async () =>
        await compiler.reset({
          theme: `
@layer utilitites {
  :root {
    background-color: black
  }
}
`,
        }),
    ).rejects.toThrowError(/only @theme, @utility or @custom-variant/)
  })

  it('.', async () => {
    const compiler = new Compiler()

    await expect(
      async () =>
        await compiler.reset({
          theme: `
:root {
  background-color: black
}
`,
        }),
    ).rejects.toThrowError(/only @theme, @utility or @custom-variant/)
  })

  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(
      compiler.compile(
        [],
        [
          `
:root {
  @variant dark {
    @apply bg-amber-200;
  }

  @apply bg-amber-50;

  margin: --spacing(4);
}
`,
        ],
      ),
    ).toMatchSnapshot()
  })
})
