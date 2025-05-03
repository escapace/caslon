// SPDX-License-Identifier: MIT
// Modified by: kazuya kawaguchi (a.k.a. kazupon)
// Auther: Evan You (https://github.com/yyx990803)
// Forked from: https://github.com/vitejs/vite/tree/main/packages/plugin-vue
// https://github.com/intlify/bundle-tools/blob/main/packages/unplugin-vue-i18n/src/vue/query.ts

export function parseVueRequest(id: string) {
  const url = URL.parse(`file://${id}`)

  if (url === null) {
    return
  }

  const { pathname: filePath, searchParams: query } = url

  const lang =
    Object.keys(Object.fromEntries(query))
      .find((key) => /lang\./i.test(key))
      ?.split('.')[1] ??
    query.get('lang') ??
    undefined

  const queryIndex = query.get('index') ?? undefined

  let index: number | undefined = queryIndex === undefined ? undefined : parseInt(queryIndex)

  if (index !== undefined && isNaN(index)) {
    index = undefined
  }

  return {
    filePath,
    index,
    lang,
    raw: query.has('raw'),
    scoped: query.get('scoped') ?? undefined,
    src: query.has('src'),
    type: query.get('type') ?? undefined,
    vue: query.has('vue'),
  }
}

export const parseVueStyleRequest = (id: string) => {
  const result = parseVueRequest(id)

  if (result === undefined) {
    return undefined
  }

  const { index, lang, type, vue } = result

  if (!vue) {
    return
  }

  if (type !== 'style') {
    return
  }

  if (lang !== 'css') {
    return
  }

  if (typeof index !== 'number') {
    return
  }

  return { ...result, index, lang: lang as 'css', type: type as 'style', vue }
}
