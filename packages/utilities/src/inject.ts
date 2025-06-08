import type { App } from 'vue'

export const inject = <T = unknown>(app: App, key: string | symbol): T | undefined => {
  const provides = app._context.provides

  let index: string | symbol | undefined = undefined

  if (typeof key === 'symbol') {
    index = Object.getOwnPropertySymbols(provides).find((value) => value === key)
  } else if (typeof key === 'string') {
    const keys = [...Object.getOwnPropertySymbols(provides), ...Object.keys(provides)]

    index =
      keys.find((value) => value === key) ??
      keys.find(
        (value) =>
          key ===
          (typeof value === 'symbol' ? value.toString().replace(/^Symbol\(|\)$/g, '') : value),
      )
  }

  if (index === undefined) {
    return undefined
  }

  return provides[index] as T | undefined
}
