import { Compiler } from '@caslon/breeze'
import { Scanner, type ChangedContent } from '@tailwindcss/oxide'
import type { Options as VueOptions } from '@vitejs/plugin-vue'
import { parse } from '@vue/compiler-sfc'
import MagicString from 'magic-string'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin, ResolvedConfig, TransformResult } from 'vite'
import { createFilter } from 'vite'
import { isFile } from './utilities/is-file'
// import { createHash } from 'node:crypto'
//
// // https://github.com/vitejs/vite-plugin-vue/blob/main/packages/plugin-vue/src/utils/descriptorCache.ts
// export function getHash(text: string): string {
//   return createHash('sha256').update(text).digest('hex').substring(0, 8)
// }

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

  // const componentIdGenerator = vueOptions?.features?.componentIdGenerator
  const isProduction = vueOptions.isProduction ?? config.isProduction

  // https://github.com/vitejs/vite-plugin-vue/blob/main/packages/plugin-vue/src/utils/descriptorCache.ts
  // const componentId = (filename: string, source: string) => {
  //   const normalizedPath = normalizePath(path.relative(config.root, filename))
  //
  //   if (componentIdGenerator === 'filepath') {
  //     return getHash(normalizedPath)
  //   } else if (componentIdGenerator === 'filepath-source') {
  //     return getHash(normalizedPath + source)
  //   } else if (typeof componentIdGenerator === 'function') {
  //     return componentIdGenerator(normalizedPath, source, isProduction, getHash)
  //   } else {
  //     return getHash(normalizedPath + (isProduction ? source : ''))
  //   }
  // }

  return {
    // componentId,
    filterScoped,
    filterVue,
    isProduction,
    pathFileTheme,
    root,
    vueOptions,
  }
}

const extension = (lang: string | undefined) => {
  const value = lang === 'ts' ? 'ts' : lang === undefined ? 'js' : undefined

  if (value === undefined) {
    throw new Error(`unknown lang '${lang}'`)
  }

  return value
}

const PLACEHOLDER = '__CASLON_PLACEHOLDER__'

export function caslon(options?: Options): Plugin {
  let properties: ReturnType<typeof createProperties>

  const compiler = new Compiler()

  function transformSFC(filename: string): TransformResult | undefined {
    const source = readFileSync(filename, 'utf8')
    const scanner = new Scanner({ sources: [] })

    const scoped =
      typeof properties.filterScoped === 'function'
        ? properties.filterScoped(filename)
        : properties.filterScoped

    const magic = new MagicString(source)

    const parseResult = parse(source)

    if (parseResult.errors.length !== 0) {
      return
    }

    const { descriptor } = parseResult

    const scanFiles: ChangedContent[] = []

    // TODO: scan src imports
    if (descriptor.template !== null) {
      scanFiles.push({
        content: `<template>${descriptor.template.content}</template>`,
        extension: 'vue',
      })
    }

    // TODO: scan src imports
    for (const key of ['script', 'scriptSetup'] as const) {
      if (descriptor[key] !== null) {
        scanFiles.push({
          content: descriptor[key].content,
          extension: extension(descriptor[key].lang),
        })
      }
    }

    const candidates = scanner.scanFiles(scanFiles)

    // TODO: support src imports
    const styles = parseResult.descriptor.styles.filter(
      (value) =>
        value.lang === undefined && value.src === undefined && typeof value.content === 'string',
    )

    // TODO: support src imports
    const [baseStyle, ...transformedStyles] = compiler.compile(
      candidates,
      styles.map((value) => value.content),
      { themeSelector: scoped ? PLACEHOLDER : undefined },
    )

    styles.forEach(({ loc }, index) => {
      const value = transformedStyles[index]

      if (value !== undefined) {
        magic.overwrite(loc.start.offset, loc.end.offset, `\n${value}\n`)
      }
    })

    if (baseStyle !== undefined) {
      magic.append(`\n<style${scoped ? ' scoped' : ''}>\n${baseStyle}\n</style>`)
    }

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
    transform: {
      handler(code, id) {
        const url = URL.parse(`file://${id}`)

        if (url === null) {
          return
        }

        const { pathname: filename, searchParams: query } = url

        if (!properties.filterVue(filename)) {
          return
        }

        if (query.get('vue') !== '') {
          return
        }

        if (query.get('type') !== 'style') {
          return
        }

        if (query.get('lang.css') !== '') {
          return
        }

        const scoped = query.get('scoped')

        if (scoped === null || typeof scoped !== 'string' || scoped.length === 0) {
          return
        }

        const magic = new MagicString(code)

        magic.replaceAll(PLACEHOLDER, `:global([data-v-${scoped}])`)

        return magic.hasChanged()
          ? {
              code: magic.toString(),
              map: magic.generateMap(),
            }
          : undefined
      },
      order: 'pre',
    },
  }
}
