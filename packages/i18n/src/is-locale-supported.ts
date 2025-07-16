export const isLocaleSupported = (value: unknown): value is string =>
  typeof value === 'string' && I18N_LOCALES.includes(value)
