import { describe, expect, it } from 'vitest'
import { Compiler } from './index'

describe('compiler', () => {
  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(
      compiler.compile({
        candidates: ['bg-linear-to-t', 'from-sky-50-50', 'to-primary-50-50', 'animate-spin'],
      }),
    ).toMatchSnapshot()

    expect(compiler.compile()).toMatchSnapshot()
  })

  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(compiler.compile({ candidates: ['dark:bg-red-50'] })).toMatchSnapshot()
  })

  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset({})

    expect(compiler.compile({ candidates: ['nonexistent'] })).toMatchSnapshot()
    expect(compiler.compile()).toMatchSnapshot()
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
      compiler.compile({ candidates: ['content-auto-test', 'pointer-coarse-test:relative'] }),
    ).toMatchSnapshot()
  })

  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(compiler.compile({ candidates: ['animate-spin', 'rounded-xl'] })).toMatchSnapshot()
    expect(compiler.compile({ candidates: ['relative'] })).toMatchSnapshot()
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
      compiler.compile({
        styles: [
          `
:root {
  @variant dark {
    @apply bg-amber-200;
  }

  @apply bg-amber-50;

  margin: --spacing(4);
  background-color: --alpha(var(--color-gray-950) / 10%);
}
`,
        ],
      }),
    ).toMatchSnapshot()
  })

  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(compiler.compile()).toMatchSnapshot()
  })

  it('.', async () => {
    const compiler = new Compiler()
    await compiler.reset()

    expect(compiler.compile({ variables: ['--color-red-500'] })).toMatchSnapshot()
  })
})
