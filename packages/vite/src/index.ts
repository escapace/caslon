import { Compiler, type Options as BreezeOptions } from '@caslon/breeze'
import { Scanner, type ChangedContent } from '@tailwindcss/oxide'
import type { Options as VueOptions } from '@vitejs/plugin-vue'
import {
  parse as _parseSFC,
  type SFCScriptBlock,
  type SFCStyleBlock,
  type SFCTemplateBlock,
} from '@vue/compiler-sfc'
import { remove } from 'lodash-es'
import MagicString, { type SourceMap } from 'magic-string'
import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ModuleNode, Plugin, ResolvedConfig, TransformResult, ViteDevServer } from 'vite'
import { createFilter } from 'vite'
import { isFile } from './utilities/is-file'
import { parseVueRequest, parseVueStyleRequest } from './utilities/parse-vue-request'

interface Options extends Pick<BreezeOptions, 'selector'> {
  exclude?: string | ReadonlyArray<string | RegExp> | RegExp
  include?: string | ReadonlyArray<string | RegExp> | RegExp
  scoped?: boolean | string | ReadonlyArray<string | RegExp> | RegExp
  theme?: string
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

  // eslint-disable-next-line typescript/no-non-null-assertion
  const handleHotUpdate = config.plugins.find(
    (value) => value.name === 'vite:vue',
  )!.handleHotUpdate!

  assert(typeof handleHotUpdate === 'function')

  const isProduction = vueOptions.isProduction ?? config.isProduction

  const parseSFC = vueOptions.compiler?.parse ?? _parseSFC

  const cssPlugin = config.plugins.find((value) => value.name === 'vite:css-post')

  const cssTransform =
    cssPlugin?.transform !== undefined && 'handler' in cssPlugin.transform
      ? cssPlugin?.transform.handler
      : cssPlugin?.transform

  assert(typeof cssTransform === 'function')

  const state = new Map<string, State>()

  const mode = config.mode

  const sourcemap = {
    css:
      config.mode === 'development'
        ? (config.css.devSourcemap ?? false) ||
          config.dev.sourcemap === true ||
          (config.dev.sourcemap !== false ? config.dev.sourcemap?.css === true : false)
        : false,
  }

  const compiler = new Compiler()

  return {
    compiler,
    cssTransform,
    handleHotUpdate,
    mode,
    sourcemap,
    state,
    // componentId,
    filterScoped,
    filterVue,
    isProduction,
    parseSFC,
    pathFileTheme,
    root,
    vueOptions,
  }
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
      `Unknown extension '${extension ?? value.lang}'`,
    )

    return {
      content: value.type === 'template' ? `<template>\n${content}\n</template>` : content,
      extension,
      filePath,
    }
  }

  return undefined
}

export function caslon(options?: Options): Plugin[] {
  let properties: {
    addWatchFile?: (id: string) => void
    error?: (error: string) => never
    info?: (message: string) => never
    server?: ViteDevServer | undefined
    warn?: (message: string) => never
  } & ReturnType<typeof createProperties>

  const updateState = (id: string, state: State) => {
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
      styles: styles.map((value) => value?.content),
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

        magic.overwrite(start.offset, end.offset, `\n${code}\n`)
      } else {
        const magic = new MagicString(style.content)

        magic.update(0, magic.length(), code)

        properties.state.set(style.filePath, {
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
      updateState(filePath, { scoped, type: 'sfc', ...candidatesAndVariables })
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

  const reset = async () => {
    properties.state.clear()

    const theme = await isFile(properties.pathFileTheme)

    if (theme) {
      updateState(properties.pathFileTheme, { type: 'theme' })
    }

    await properties.compiler.reset({
      directory: theme ? path.dirname(properties.pathFileTheme) : undefined,
      error: properties.error,
      loadStyleSheet: async (id, directory) => {
        const filePath = path.resolve(directory, id)
        const base = path.dirname(filePath)
        const content = await readFile(filePath, 'utf8')

        updateState(filePath, { type: 'theme' })

        return { base, content, path: filePath }
      },
      selector: options?.selector,
      theme: theme ? await readFile(properties.pathFileTheme, 'utf8') : undefined,
      warning: properties.warn,
    })
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
      enforce: 'pre',
      handleHotUpdate: {
        async handler(context) {
          let state = properties.state.get(context.file)

          const invalidatedModules = new Set<ModuleNode>()
          const nodes = new Set<ModuleNode>(context.modules)

          new Set(
            [
              context.file,
              state?.type === 'style' ? state.sfc : undefined,
              state?.type === 'theme'
                ? [
                    ...properties.state.keys(),
                    ...[...properties.state.values()].map((value) =>
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
              await transformSFC(context.file)
            } else {
              return
            }
          }

          state = properties.state.get(context.file)

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
              await reset()
            }

            context.server.ws.send({ type: 'full-reload' })
            return []
          } else if (state?.type === 'sfc' || state?.type === 'style') {
            if (state.type === 'style') {
              await transformSFC(state.sfc)
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

          if (properties.state.has(filePath)) {
            // eslint-disable-next-line typescript/no-non-null-assertion
            const state = properties.state.get(filePath)!

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

      transform: {
        async handler(code, id) {
          if (properties.state.get(id)?.type === 'theme') {
            await reset()

            return { code: '', moduleSideEffects: false }
          } else if (properties.filterVue(id)) {
            return await transformSFC(id, code)
          } else {
            const value = parseVueStyleRequest(id)

            if (value === undefined) {
              return
            }

            const { filePath, scoped } = value

            const state = properties.state.get(filePath)

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

      name: '@caslon/vite',
      shouldTransformCachedModule({ id }) {
        if (properties.filterVue(id)) {
          return true
        }

        if (properties.state.has(id)) {
          return true
        }

        const filePath = parseVueStyleRequest(id)?.filePath

        if (typeof filePath === 'string' && properties.state.has(filePath)) {
          return true
        }

        return undefined
      },
    },
  ]
}
