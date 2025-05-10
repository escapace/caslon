import split from 'split-string'

export const splitString = (string?: string | null) => {
  if (typeof string !== 'string') {
    return undefined
  }

  const value = split(string, {
    keep: (value) => value !== ' ' && value !== `'` && value !== `"` && value !== `\\`,
    quotes: [`'`, `"`],
    separator: ',',
  })
    .map((value) => value.trim())
    .filter((value) => value.length !== 0)

  if (value.length === 0) {
    return undefined
  }

  return value
}
