import type { InjectionKey } from 'vue'
import type { I18nStore } from './create-i18n'

export const I18N_STORE_INJECTION_KEY: InjectionKey<I18nStore> = Symbol.for('@caslon/i18n/store')
