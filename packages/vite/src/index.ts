import { Compiler } from '@caslon/breeze'
import { Scanner } from '@tailwindcss/oxide'
import type { Options as VueOptions } from '@vitejs/plugin-vue'
import MagicString from 'magic-string'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import fs, { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin, ResolvedConfig, TransformResult } from 'vite'
import { createFilter, normalizePath } from 'vite'

function getHash(text: string): string {
  // return hash('sha256', text, 'hex').substring(0, 8)
  return createHash('sha256').update(text).digest('hex').substring(0, 8)
}

export const isFile = async (path: string) =>
  await fs
    .stat(path)
    .then((stats) => stats.isFile())
    .catch(() => false)

interface Options {
  exclude?: string | ReadonlyArray<string | RegExp> | RegExp
  include?: string | ReadonlyArray<string | RegExp> | RegExp
  scoped?: boolean | string | ReadonlyArray<string | RegExp> | RegExp
  theme?: string
  themeSelector?: string
}

const createProperties = (options: Options | undefined, config: ResolvedConfig) => {
  const root = config.root

  const filterVue =
    options?.include === undefined && options?.exclude === undefined
      ? createFilter('**/*.vue')
      : createFilter(options?.include, options?.exclude)

  const filterScoped =
    options?.scoped === undefined || options?.scoped === false
      ? false
      : options.scoped === true
        ? true
        : createFilter(options.scoped)

  const pathFileTheme = path.resolve(config.root, options?.theme ?? 'src/styles/theme.css')

  const vueOptions =
    // eslint-disable-next-line typescript/no-unsafe-member-access
    config.plugins.find((value) => value.name === 'vite:vue')?.api?.options as Partial<VueOptions>

  const componentIdGenerator = vueOptions?.features?.componentIdGenerator
  const isProduction = vueOptions.isProduction ?? config.isProduction

  const componentId = (filename: string, source: string) => {
    const normalizedPath = normalizePath(path.relative(config.root, filename))

    if (componentIdGenerator === 'filepath') {
      return getHash(normalizedPath)
    } else if (componentIdGenerator === 'filepath-source') {
      return getHash(normalizedPath + source)
    } else if (typeof componentIdGenerator === 'function') {
      return componentIdGenerator(normalizedPath, source, isProduction, getHash)
    } else {
      return getHash(normalizedPath + (isProduction ? source : ''))
    }
  }

  return {
    componentId,
    filterScoped,
    filterVue,
    isProduction,
    pathFileTheme,
    root,
    vueOptions,
  }
}

export function caslon(options?: Options): Plugin {
  let properties: ReturnType<typeof createProperties>

  const compiler = new Compiler()

  function transformSFC(filename: string): TransformResult | undefined {
    const pathWorkingDirectory = properties.root

    const pattern = path.isAbsolute(filename)
      ? path.relative(pathWorkingDirectory, filename)
      : filename
    const source = readFileSync(filename, 'utf8')

    const scanner = new Scanner({ sources: [{ base: pathWorkingDirectory, pattern }] })
    const candidates = scanner.scan()

    if (candidates.length === 0) {
      return undefined
    }

    const scoped =
      typeof properties.filterScoped === 'function'
        ? properties.filterScoped(filename)
        : properties.filterScoped

    const css = compiler.compile(
      candidates,
      scoped
        ? { themeSelector: `[data-v-${properties.componentId(filename, source)}]` }
        : undefined,
    )

    if (css === undefined) {
      return undefined
    }

    const magic = new MagicString(source)

    magic.append(`\n<style${scoped ? ' scoped' : ''}>\n${css}\n</style>`)

    return {
      code: magic.toString(),
      map: null,
    }
  }

  const reset = async () => {
    await compiler.reset({
      theme: (await isFile(properties.pathFileTheme))
        ? await readFile(properties.pathFileTheme, 'utf8')
        : undefined,
      themeSelector: options?.themeSelector,
    })
  }

  return {
    async buildStart() {
      this.addWatchFile(properties.pathFileTheme)
      await reset()
    },
    configResolved(resolvedConfig) {
      properties = createProperties(options, resolvedConfig)
    },
    load: {
      async handler(id) {
        if (id === properties.pathFileTheme) {
          await reset()

          return { code: '', moduleSideEffects: false }
        } else if (properties.filterVue(id)) {
          return transformSFC(id)
        }

        return
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
