import { Compiler, type Options as BreezeOptions } from '@caslon/breeze'
import { Scanner, type ChangedContent } from '@tailwindcss/oxide'
import type { ResolvedOptions as VueOptions, Api as VuePluginApi } from '@vitejs/plugin-vue'
import { remove } from 'lodash-es'
import MagicString, { type SourceMap } from 'magic-string'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ModuleNode, Plugin, ResolvedConfig, TransformResult, ViteDevServer } from 'vite'
import { createFilter } from 'vite'
import { parse as _parseSFC, type SFCParseOptions, type SFCParseResult } from 'vue/compiler-sfc'
import { pipe } from './utilities/pipe'
import { resolveSFCBlockContent } from './resolve-sfc-block-content'
import { isFile } from './utilities/is-file'
import { parseVueRequest, parseVueStyleRequest } from './utilities/parse-vue-request'

interface Options extends Pick<BreezeOptions, 'selector'> {
  exclude?: string | ReadonlyArray<string | RegExp> | RegExp
  include?: string | ReadonlyArray<string | RegExp> | RegExp
  scoped?: boolean | string | ReadonlyArray<string | RegExp> | RegExp
  theme?: string
}

interface StateTheme {
  type: 'theme'
}

interface StateSFC {
  candidates: string[]
  scoped: boolean
  type: 'sfc'
  variables: string[]
}

interface StateStyle {
  code: string
  map: SourceMap | null
  sfc: string
  type: 'style'
}

type State = StateSFC | StateStyle | StateTheme

const PLACEHOLDER = '__CASLON_PLACEHOLDER__'

const createReset =
  (properties: {
    compiler: Compiler
    indice: Map<string, State>
    pathFileTheme: string
    updateState: (id: string, state: State) => void
    options?: Options
  }) =>
  async () => {
    properties.indice.clear()

    const theme = await isFile(properties.pathFileTheme)

    if (theme) {
      properties.updateState(properties.pathFileTheme, { type: 'theme' })
    }

    await properties.compiler.reset({
      directory: theme ? path.dirname(properties.pathFileTheme) : undefined,
      // error: properties.error,
      // warning: properties.warn,

      selector: properties.options?.selector,
      theme: theme ? await readFile(properties.pathFileTheme, 'utf8') : undefined,

      loadStyleSheet: async (id, directory) => {
        const filePath = path.resolve(directory, id)
        const base = path.dirname(filePath)
        const content = await readFile(filePath, 'utf8')

        properties.updateState(filePath, { type: 'theme' })

        return { base, content, path: filePath }
      },
    })
  }

const createTransformSFC =
  (properties: {
    compiler: Compiler
    indice: Map<string, State>
    parseSFC: (source: string, options?: SFCParseOptions) => SFCParseResult
    pathFileTheme: string
    sourcemap: {
      css: boolean
    }
    updateState: (id: string, state: State) => void
    options?: Options
    vueOptions?: VueOptions
  }) =>
  async (filePath: string, source?: string): Promise<TransformResult | undefined> => {
    const code = source ?? (await readFile(filePath, 'utf8'))
    const scanner = new Scanner({ sources: [] })
    const directory = path.dirname(filePath)

    const scoped = /^\p{Z}*<!--\p{Z}*caslon-scoped\p{Z}*-->\p{Z}*$/mu.test(code)

    const magic = new MagicString(code, { filename: filePath })

    const parseResult = properties.parseSFC(code, {
      sourceMap: true,
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

    const {
      css: theme,
      styles: compiledStyles,
      ...candidatesAndVariables
    } = properties.compiler.compile({
      candidates,
      selector: scoped ? PLACEHOLDER : undefined,
      styles: styles.map((value) =>
        value === undefined
          ? undefined
          : { css: value.content, filePath: properties.sourcemap.css ? value.filePath : undefined },
      ),
    })

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
      }
    }

    compiledStyles.forEach((code, index) => {
      const style = styles[index]

      if (code === undefined || style === undefined) {
        return
      }

      if (style.filePath === undefined) {
        const { end, start } = style.block.loc

        magic.overwrite(start.offset, end.offset, `\n${code.css}\n`)
      } else {
        const magic = new MagicString(style.content)

        magic.update(0, magic.length(), code.css)

        properties.indice.set(style.filePath, {
          code: magic.toString(),
          get map() {
            return properties.sourcemap.css
              ? magic.generateMap({ hires: true, source: style.filePath })
              : null
          },
          sfc: filePath,
          type: 'style',
        })
      }
    })

    const magicHasChanged = magic.hasChanged()

    if (magicHasChanged || styles.some((value) => typeof value?.filePath === 'string')) {
      properties.updateState(filePath, { scoped, type: 'sfc', ...candidatesAndVariables })
    }

    return magicHasChanged
      ? {
          code: magic.toString(),
          map: { mappings: '' },
          // get map() {
          //   return { mappings: '' }
          //   // return magic.generateMap({
          //   //   hires: true,
          //   //   includeContent: true,
          //   //   source: filePath,
          //   // })
          // },
          // map: null,
        }
      : undefined
  }

const createProperties = (options: Options | undefined, config: ResolvedConfig) => {
  const root = config.root

  const filterVue =
    options?.include === undefined && options?.exclude === undefined
      ? createFilter('**/*.vue', undefined, { resolve: root })
      : createFilter(options?.include, options?.exclude, { resolve: root })

  // const filterScoped =
  //   options?.scoped === undefined || options?.scoped === false
  //     ? false
  //     : options.scoped === true
  //       ? true
  //       : createFilter(options.scoped, undefined, { resolve: root })

  const pathFileTheme = path.resolve(config.root, options?.theme ?? 'src/styles/theme.css')

  const vueOptions: VueOptions | undefined = (
    config.plugins.find((value) => value.name === 'vite:vue') as Plugin<VuePluginApi>
  ).api?.options

  // eslint-disable-next-line typescript/no-non-null-assertion
  const handleHotUpdate = config.plugins.find(
    (value) => value.name === 'vite:vue',
  )!.handleHotUpdate!

  assert(typeof handleHotUpdate === 'function')

  const parseSFC = vueOptions?.compiler?.parse ?? _parseSFC

  const cssPlugin = config.plugins.find((value) => value.name === 'vite:css-post')

  const cssTransform =
    cssPlugin?.transform !== undefined && 'handler' in cssPlugin.transform
      ? cssPlugin?.transform.handler
      : cssPlugin?.transform

  assert(typeof cssTransform === 'function')

  const indice = new Map<string, State>()

  const sourcemap = {
    css: config.mode === 'development' ? (config.css.devSourcemap ?? false) : false,
  }

  const compiler = new Compiler()

  let addWatchFile: ((id: string) => void) | undefined
  let server: ViteDevServer | undefined
  const error: ((error: string) => never | void) | undefined = console.error
  const info: ((message: string) => never | void) | undefined = console.log
  const warn: ((message: string) => never | void) | undefined = console.warn

  const properties = {
    compiler,
    cssTransform,
    filterVue,
    handleHotUpdate,
    indice,
    options,
    parseSFC,
    pathFileTheme,
    root,
    sourcemap,
    vueOptions,

    addWatchFile,
    error,
    info,
    server,
    warn,
  }

  return pipe(
    properties,
    (properties) =>
      Object.assign(properties, {
        updateState: (id: string, state: State) => {
          properties.addWatchFile?.(id)
          properties.server?.watcher.add?.(id)
          properties.indice.set(id, state)
        },
      }),
    (properties) =>
      Object.assign(properties, {
        reset: createReset(properties),
      }),
    (properties) =>
      Object.assign(properties, {
        transformSFC: createTransformSFC(properties),
      }),
  )
}

type Properties = ReturnType<typeof createProperties>

export function caslon(options?: Options): Plugin[] {
  let properties: Properties

  return [
    {
      enforce: 'pre',
      name: '@caslon/vite',

      configResolved(resolvedConfig) {
        properties = createProperties(options, resolvedConfig)
      },

      configureServer(server) {
        Object.assign(properties, { server })

        server.watcher.on('add', () => void properties.reset())
        server.watcher.on('unlink', () => void properties.reset())
      },

      async buildStart() {
        const { addWatchFile, error, info, warn } = this

        Object.assign(properties, {
          addWatchFile: addWatchFile.bind(this),
          error: error.bind(this),
          info: info.bind(this),
          warn: warn.bind(this),
        })

        await properties.reset()
      },

      shouldTransformCachedModule({ id }) {
        if (properties.filterVue(id)) {
          return true
        }

        if (properties.indice.has(id)) {
          return true
        }

        const filePath = parseVueStyleRequest(id)?.filePath

        if (typeof filePath === 'string' && properties.indice.has(filePath)) {
          return true
        }

        return undefined
      },

      transform: {
        async handler(code, id) {
          if (properties.indice.get(id)?.type === 'theme') {
            await properties.reset()

            return { code: '', moduleSideEffects: false }
          } else if (properties.filterVue(id)) {
            return await properties.transformSFC(id, code)
          } else {
            const value = parseVueStyleRequest(id)

            if (value === undefined) {
              return
            }

            const { filePath, scoped } = value

            const state = properties.indice.get(filePath)

            if (state?.type === 'style') {
              return {
                code: state.code,
                map: state.map,
              }
            } else if (
              state?.type === 'sfc' &&
              code.includes(PLACEHOLDER) &&
              scoped !== undefined
            ) {
              const magic = new MagicString(code)

              magic.replaceAll(PLACEHOLDER, `:global([data-v-${scoped}])`)

              return magic.hasChanged()
                ? {
                    code: magic.toString(),
                    get map() {
                      return properties.sourcemap.css
                        ? magic.generateMap({
                            hires: true,
                            includeContent: true,
                            source: filePath,
                          })
                        : null
                    },
                  }
                : undefined
            }

            return
          }
        },
        order: 'pre',
      },

      handleHotUpdate: {
        async handler(context) {
          let state = properties.indice.get(context.file)

          const invalidatedModules = new Set<ModuleNode>()
          const nodes = new Set<ModuleNode>(context.modules)

          new Set(
            [
              context.file,
              state?.type === 'style' ? state.sfc : undefined,
              state?.type === 'theme'
                ? [
                    ...properties.indice.keys(),
                    ...[...properties.indice.values()].map((value) =>
                      value.type === 'style' ? value.sfc : undefined,
                    ),
                  ]
                : undefined,
            ]
              .flat()
              .filter((value) => value !== undefined),
          ).forEach((value) =>
            context.server.moduleGraph
              .getModulesByFile(value)
              ?.forEach((value) => nodes.add(value)),
          )

          if (state === undefined) {
            if (properties.filterVue(context.file)) {
              await properties.transformSFC(context.file)
            } else {
              return
            }
          }

          state = properties.indice.get(context.file)

          if (state?.type === 'theme') {
            for (const node of nodes) {
              context.server.moduleGraph.invalidateModule(
                node,
                invalidatedModules,
                context.timestamp,
                true,
              )
            }

            if (state.type === 'theme') {
              await properties.reset()
            }

            context.server.ws.send({ type: 'full-reload' })
            return []
          } else if (state?.type === 'sfc' || state?.type === 'style') {
            if (state.type === 'style') {
              await properties.transformSFC(state.sfc)
            }

            for (const node of nodes) {
              await context.server.reloadModule(node)
            }
          }

          return
        },
        order: 'pre',
      },

      async renderChunk(_, chunk) {
        const variables = new Set<string>()
        const candidates = new Set<string>()
        const modulesToRemove = new Set<string>()

        for (const [id] of Object.entries(chunk.modules)) {
          const request = parseVueRequest(id)

          if (request === undefined) {
            continue
          }

          const { filePath } = request

          if (properties.indice.has(filePath)) {
            // eslint-disable-next-line typescript/no-non-null-assertion
            const state = properties.indice.get(filePath)!

            assert(state.type !== 'theme')

            if (
              state.type === 'sfc' &&
              !state.scoped &&
              request.vue &&
              request.type === 'style' &&
              request.lang === 'css' &&
              request.index === 0
            ) {
              for (const variable of state.variables) {
                variables.add(variable)
              }

              for (const candidate of state.candidates) {
                candidates.add(candidate)
              }

              modulesToRemove.add(id)
            }
          }
        }

        if (variables.size === 0 && candidates.size === 0) {
          return
        }

        for (const id of modulesToRemove) {
          remove(chunk.moduleIds, (value) => value === id)
          remove(chunk.dynamicImports, (value) => value === id)
          remove(chunk.exports, (value) => value === id)
          remove(chunk.imports, (value) => value === id)

          Reflect.deleteProperty(chunk.modules, id)
        }

        const name = `${chunk.fileName}.css`

        const { css } = properties.compiler.compile({
          candidates: [...candidates],
          selector: options?.selector,
          variables: [...variables],
        })

        if (css === undefined) {
          return
        }

        // eslint-disable-next-line typescript/no-explicit-any, typescript/no-unsafe-argument
        await properties.cssTransform.call(this as any, css, name)

        chunk.modules[name] = {
          code: null,
          originalLength: 0,
          removedExports: [],
          renderedExports: [],
          renderedLength: 0,
        }
      },
    },
  ]
}
