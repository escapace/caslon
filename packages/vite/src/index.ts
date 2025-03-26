import { Scanner } from '@tailwindcss/oxide'
import MagicString from 'magic-string'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Plugin, ResolvedConfig, TransformResult } from 'vite'
import { Compiler } from '@caslon/breeze'
import fs, { readFile } from 'node:fs/promises'

export const isFile = async (path: string) =>
  await fs
    .stat(path)
    .then((stats) => stats.isFile())
    .catch(() => false)

// TODO: filter / unplugin-util
// TODO: scoped

interface Options {
  theme?: string
  themeSelector?: string
}

export function caslon(options?: Options): Plugin {
  let config: ResolvedConfig
  let pathFileTheme: string

  const compiler = new Compiler()

  function transformSFC(filename: string): TransformResult | undefined {
    const pathWorkingDirectory = config.root

    const pattern = path.isAbsolute(filename)
      ? path.relative(pathWorkingDirectory, filename)
      : filename
    const source = readFileSync(filename, 'utf8')

    const scanner = new Scanner({ sources: [{ base: pathWorkingDirectory, pattern }] })
    const candidates = scanner.scan()

    if (candidates.length === 0) {
      return undefined
    }

    const css = compiler.compile(candidates)

    if (css === undefined) {
      return undefined
    }

    const magic = new MagicString(source)

    magic.append(`\n<style>\n${css}\n</style>`)

    return {
      code: magic.toString(),
      map: null,
    }
  }

  const reset = async () => {
    await compiler.reset({
      theme: (await isFile(pathFileTheme)) ? await readFile(pathFileTheme, 'utf8') : undefined,
      themeSelector: options?.themeSelector,
    })
  }

  return {
    async buildStart() {
      this.addWatchFile(pathFileTheme)
      await reset()
    },
    configResolved(resolvedConfig) {
      config = resolvedConfig
      pathFileTheme = path.resolve(config.root, options?.theme ?? 'src/styles/theme.css')
    },
    load: {
      async handler(id) {
        if (id === pathFileTheme) {
          await reset()

          return { code: '', moduleSideEffects: false }
        }

        if (!id.endsWith('.vue')) {
          return
        }

        return transformSFC(id)
      },
      order: 'pre',
    },
    name: '@caslon/vite',
  }
}

// let filter = createFilter([/\.vue$/], defaultPipelineExclude)
// enforce: 'pre',
// import { parseVueRequest } from '@vitejs/plugin-vue'
// const { filename, query } = parseVueRequest(id)
//
// if (Object.keys(query).length !== 0) {
//   return undefined
// }
//
// console.log(filename, query)
//
// if (!(query.vue === true && typeof query.src === 'string')) {
//   return
// }

// shouldTransformCachedModule({ id }) {
//   return id.includes('.vue')
//   // return false
//   // `vite build --watch`
//   // always transform cached modules for vue sfc
//   // if (
//   //   config.command === 'build' &&
//   //   config.build.watch !== null &&
//   //   config.build.sourcemap !== false &&
//   //   id.includes('.vue')
//   // ) {
//   //   return true
//   // }
//   // return false
// },
// transform(code, id) {
// },
// handleHotUpdate(ctx) {
//   const read = ctx.read
//   if (filter(ctx.file)) {
//     ctx.read = async () => {
//       const code = await read()
//       return await transformSFC(code) || code
//     }
//   }
// },
