import { Compiler } from '@caslon/breeze'
import { Scanner, type ChangedContent } from '@tailwindcss/oxide'
import type { Options as VueOptions } from '@vitejs/plugin-vue'
import {
  parse,
  type SFCScriptBlock,
  type SFCStyleBlock,
  type SFCTemplateBlock,
} from '@vue/compiler-sfc'
import MagicString, { type SourceMap } from 'magic-string'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ModuleNode, Plugin, ResolvedConfig, TransformResult, ViteDevServer } from 'vite'
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

  // // eslint-disable-next-line typescript/no-non-null-assertion
  // const handleHotUpdate = config.plugins.find(
  //   (value) => value.name === 'vite:vue',
  // )!.handleHotUpdate!
  //
  // assert(typeof handleHotUpdate === 'function')

  // const componentIdGenerator = vueOptions?.features?.componentIdGenerator
  const isProduction = vueOptions.isProduction ?? config.isProduction

  // https://github.com/vitejs/vite-plugin-vue/blob/main/packages/plugin-vue/src/utils/descriptorCache.ts
  // const componentId = (filename: string, source: string) => {
  //   const normalizedPath = normalizePath(path.relative(config.root, filename))
  //
  //   if (componentIdGenerator === 'filePath') {
  //     return getHash(normalizedPath)
  //   } else if (componentIdGenerator === 'filePath-source') {
  //     return getHash(normalizedPath + source)
  //   } else if (typeof componentIdGenerator === 'function') {
  //     return componentIdGenerator(normalizedPath, source, isProduction, getHash)
  //   } else {
  //     return getHash(normalizedPath + (isProduction ? source : ''))
  //   }
  // }

  const state = new Map<string, State>()

  const mode = config.mode

  const sourceMaps = config.mode === 'development' ? (config.css.devSourcemap ?? false) : false

  return {
    // handleHotUpdate,
    mode,
    sourceMaps,
    state,
    // componentId,
    filterScoped,
    filterVue,
    isProduction,
    pathFileTheme,
    root,
    vueOptions,
  }
}

interface StateTheme {
  type: 'theme'
}

interface StateSFC {
  type: 'sfc'
}

interface StateStyle {
  code: string
  map: SourceMap | null
  sfc: string
  type: 'style'
}

type State = StateSFC | StateStyle | StateTheme

const PLACEHOLDER = '__CASLON_PLACEHOLDER__'

const resolveSFCBlockContent = async (
  value: SFCScriptBlock | SFCStyleBlock | SFCTemplateBlock | null,
  directory: string,
) => {
  if (value === null) {
    return
  }

  const filePath = value.src === undefined ? undefined : path.resolve(directory, value.src)

  const content = filePath === undefined ? value.content : await readFile(filePath, 'utf-8')

  const extension =
    value.src === undefined
      ? value.lang === undefined
        ? { script: 'js', style: 'css', template: 'vue' }[value.type]
        : { css: 'css', js: 'js', ts: 'ts' }[value.lang]
      : path.extname(value.src).slice(1)

  if (typeof content === 'string' && content.trim().length !== 0) {
    assert(
      extension !== undefined && ['css', 'html', 'js', 'ts', 'vue'].includes(extension),
      `Unknown extension '${extension}'`,
    )

    return {
      content: value.type === 'template' ? `<template>\n${content}\n</template>` : content,
      extension,
      filePath,
    }
  }

  return undefined
}

const parseStyleId = (id: string) => {
  const url = URL.parse(`file://${id}`)

  if (url === null) {
    return
  }

  const { pathname: filePath, searchParams: query } = url

  if (query.get('vue') !== '') {
    return
  }

  if (query.get('type') !== 'style') {
    return
  }

  if (query.get('lang.css') !== '') {
    return
  }

  const queryIndex = query.get('index')

  if (queryIndex === null) {
    return
  }

  const index = parseInt(queryIndex)

  if (isNaN(index)) {
    return
  }

  let scoped = query.get('scoped') ?? undefined

  if (scoped?.length === 0) {
    scoped = undefined
  }

  return {
    filePath,
    index,
    scoped,
  }
}

export function caslon(options?: Options): Plugin[] {
  let properties: {
    addWatchFile?: (id: string) => void
    error?: (error: string) => never
    info?: (message: string) => never
    server?: ViteDevServer | undefined
    warn?: (message: string) => never
  } & ReturnType<typeof createProperties>

  const compiler = new Compiler()

  const updateState = (id: string, state: State) => {
    // TODO: no need on build
    properties?.addWatchFile?.(id)
    properties.server?.watcher.add?.(id)

    properties.state.set(id, state)
  }

  async function transformSFC(
    filePath: string,
    source?: string,
  ): Promise<TransformResult | undefined> {
    const code = source ?? (await readFile(filePath, 'utf8'))
    const scanner = new Scanner({ sources: [] })
    const directory = path.dirname(filePath)

    const scoped =
      typeof properties.filterScoped === 'function'
        ? properties.filterScoped(filePath)
        : properties.filterScoped

    const magic = new MagicString(code)

    const parseResult = parse(code, {
      sourceMap: properties.sourceMaps,
      templateParseOptions: properties.vueOptions?.template?.compilerOptions,
    })

    if (parseResult.errors.length !== 0) {
      return
    }

    const { descriptor } = parseResult

    const scanFiles: ChangedContent[] = []

    for (const key of ['script', 'scriptSetup', 'template'] as const) {
      const value = await resolveSFCBlockContent(descriptor[key], directory)

      if (value !== undefined) {
        scanFiles.push(value)
      }
    }

    const candidates = scanner.scanFiles(scanFiles)

    const styles = await Promise.all(
      parseResult.descriptor.styles.map(async (block) => {
        const value = await resolveSFCBlockContent(block, directory)
        if (value === undefined || value.extension !== 'css') {
          return undefined
        }

        return { block, ...value }
      }),
    )

    const [theme, ...compiledStyles] = compiler.compile(
      candidates,
      styles.map((value) => value?.content),
      {
        themeSelector: scoped ? PLACEHOLDER : undefined,
      },
    )

    // let indexOffset = 0

    if (theme !== undefined) {
      const style = `\n\n<style${scoped ? ' scoped' : ''}>\n${theme}\n</style>\n\n`

      const position: number | undefined = descriptor.styles
        .map((value) => value.loc.start.offset)
        .sort((a, b) => a - b)[0]

      if (position === undefined) {
        magic.append(style)
      } else {
        // find the previous closing tag
        const offset =
          [
            '</script>',
            '</template>',
            ...descriptor.customBlocks.map((value) => `</${value.type}>`),
          ]
            .map((value) => {
              const index = magic.original.lastIndexOf(value, position)
              return index === -1 ? undefined : index + value.length
            })
            .filter((value) => value !== undefined)
            .sort((a, b) => b - a)[0] ?? 0

        magic.prependRight(offset, style)
        // indexOffset = 1
      }
    }

    compiledStyles.forEach((code, index) => {
      const style = styles[index]

      if (code === undefined || style === undefined) {
        return
      }

      if (style.filePath === undefined) {
        const { end, start } = style.block.loc

        magic.overwrite(start.offset, end.offset, `\n${code}\n`)
      } else {
        const magic = new MagicString(style.content)

        magic.update(0, magic.length(), code)

        properties.state.set(style.filePath, {
          code: magic.toString(),
          map: properties.sourceMaps
            ? magic.generateMap({ hires: 'boundary', source: style.filePath })
            : null,
          sfc: filePath,
          type: 'style',
        })
      }
    })

    const magicHasChanged = magic.hasChanged()

    if (magicHasChanged || styles.some((value) => typeof value?.filePath === 'string')) {
      updateState(filePath, { type: 'sfc' })
    }

    return magicHasChanged
      ? {
          code: magic.toString(),
          map: properties.sourceMaps
            ? magic.generateMap({ hires: 'boundary', source: filePath })
            : null,
        }
      : undefined
  }

  const reset = async () => {
    properties.state.clear()

    const theme = await isFile(properties.pathFileTheme)

    if (theme) {
      updateState(properties.pathFileTheme, { type: 'theme' })
    }

    await compiler.reset({
      directory: theme ? path.dirname(properties.pathFileTheme) : undefined,
      loadStyleSheet: async (id, directory) => {
        const filePath = path.resolve(directory, id)
        const base = path.dirname(filePath)
        const content = await readFile(filePath, 'utf8')

        updateState(filePath, { type: 'theme' })

        return { base, content }
      },
      theme: theme ? await readFile(properties.pathFileTheme, 'utf8') : undefined,
      themeSelector: options?.themeSelector,
    })

    properties.info?.('loading theme')
  }

  return [
    {
      async buildStart() {
        const { addWatchFile: watchFile, error, info, warn } = this

        Object.assign(properties, {
          error: error.bind(this),
          info: info.bind(this),
          warn: warn.bind(this),
          watchFile: watchFile.bind(this),
        })

        await reset()
      },
      configResolved(resolvedConfig) {
        properties = createProperties(options, resolvedConfig)
      },
      configureServer(server) {
        Object.assign(properties, { server })

        server.watcher.on('add', () => void reset())
        server.watcher.on('unlink', () => void reset())
      },
      handleHotUpdate: {
        async handler(context) {
          const { file: filePath } = context

          const state = properties.state.get(filePath)

          if (state === undefined) {
            return
          }

          const { moduleGraph } = context.server
          const invalidatedModules = new Set<ModuleNode>()

          if (state.type === 'theme') {
            for (const filePath of properties.state.keys()) {
              const nodes = moduleGraph.getModulesByFile(filePath)

              if (nodes === undefined) {
                continue
              }

              for (const node of nodes) {
                moduleGraph.invalidateModule(node, invalidatedModules, context.timestamp, true)
              }
            }

            for (const node of context.modules) {
              moduleGraph.invalidateModule(node, invalidatedModules, context.timestamp, true)
            }

            await reset()
            context.server.ws.send({ type: 'full-reload' })
            return []
          } else if (state.type === 'sfc' || state.type === 'style') {
            const nodes = [...context.modules]

            const nodesFilePath = moduleGraph.getModulesByFile(filePath)

            if (nodesFilePath !== undefined) {
              nodes.push(...nodesFilePath)
            }

            if (state.type === 'style') {
              const nodesSFC = moduleGraph.getModulesByFile(state.sfc)

              if (nodesSFC !== undefined) {
                nodes.push(...nodesSFC)
              }

              // context.server.watcher.emit('change')
              await transformSFC(state.sfc)
              // eslint-disable-next-line typescript/no-non-null-assertion
              const nodeSFCMain = nodes.find((value) => value.id === state.sfc)!
              await context.server.reloadModule(nodeSFCMain)
            }

            for (const node of nodes) {
              moduleGraph.invalidateModule(node, invalidatedModules, context.timestamp, true)
            }
          }

          return
        },
        order: 'pre',
      },
      load: {
        async handler(id) {
          if (properties.state.get(id)?.type === 'theme') {
            await reset()

            return { code: '', moduleSideEffects: false }
          } else if (properties.filterVue(id)) {
            return await transformSFC(id)
          } else {
            const value = parseStyleId(id)

            if (value === undefined) {
              return
            }

            const { filePath } = value

            const state = properties.state.get(filePath)

            if (state === undefined || state.type !== 'style') {
              return
            }

            return {
              code: state.code,
              map: state.map,
            }
          }
        },
        order: 'pre',
      },
      name: '@caslon/vite',
      shouldTransformCachedModule({ id }) {
        // return true
        if (properties.state.has(id)) {
          return true
        }

        const filePath = parseStyleId(id)?.filePath

        if (typeof filePath === 'string' && properties.state.has(filePath)) {
          return true
        }

        return undefined
      },
      transform: {
        handler(code, id) {
          const value = parseStyleId(id)

          if (value === undefined) {
            return
          }

          const { filePath, scoped } = value

          if (!properties.filterVue(filePath)) {
            return
          }

          const magic = new MagicString(code)

          magic.replaceAll(PLACEHOLDER, `:global([data-v-${scoped}])`)

          return magic.hasChanged()
            ? {
                code: magic.toString(),
                map: properties.sourceMaps ? magic.generateMap({ hires: 'boundary' }) : null,
              }
            : undefined
        },
        order: 'pre',
      },
    },
  ]
}

// if (state.type === 'theme') {
//   moduleGraph.invalidateModule()
//   context.server.ws.send({ type: 'full-reload' })
//
//   await reset()
//
//   return []
// }
//
// if (invalidatedModules.size === 0) {
//   return
// }
//
// for (const bla of context.modules) {
//   context.server.moduleGraph.invalidateModule(bla)
// }

// context.server.ws.send({ type: 'full-reload' })

// for (const bla of context.modules) {
//   context.server.moduleGraph.invalidateModule(bla)
// }
// return context.modules
// const asd = context.server.moduleGraph.getModulesByFile(file)
//
// console.log(asd)

// console.log(file, context.modules)
//

// return
// return context.modules
// return await properties.handleHotUpdate(context)
// context.server.moduleGraph.invalidateAll()
// return undefined
//
// if (state.type === 'sfc') {
//   // await transformSFC(filePath, code)
//   const code = await read()
//   const result = (await transformSFC(filePath, code))?.code ?? code
//
//   Object.assign(context, {
//     read: () => result,
//   })
// }
// const newState = properties.state.get(filePath)
//
// if (newState?.type === 'style') {
//   const { code } = newState
//
//   Object.assign(context, {
//     read: () => code,
//   })
// }

// await transformSFC(filePath)

// const transformResult = await context.server.transformRequest(nodeSFCMain.url)
// moduleGraph.updateModuleTransformResult(nodeSFCMain, transformResult, false)

// context.server.watcher.emit('change', node.id)
// context.modules
// if (newSFC !== undefined) {
//   // const nodesHMR = await properties.handleHotUpdate({
//   //   file: state.sfc,
//   //   modules: [...invalidatedModules],
//   //   read: () => newSFC.code,
//   //   server: context.server,
//   //   timestamp: context.timestamp,
//   // }) ?? []
//
//   // moduleGraph.updateModuleTransformResult(mod, result)
// }

// if (state.type === 'sfc') {
// } else {
//   // const newSFC = await transformSFC(state.sfc)
//
//   // if (newSFC !== undefined) {
//   //   console.log(properties.handleHotUpdate)
//   //
//   //   properties.handleHotUpdate({
//   //     file: state.sfc,
//   //     modules: [...invalidatedModules],
//   //     read: () => newSFC.code,
//   //     server: context.server,
//   //     timestamp: context.timestamp,
//   //   })
//   // }
//
//
//   return [...invalidatedModules]
// }
