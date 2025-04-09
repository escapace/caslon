export const enum Polyfills {
  None = 0,

  // Control if fallbacks for `@property` rules are emitted
  AtProperty = 1 << 0,

  // Control if `color-mix(…)` fallbacks are inserted
  ColorMix = 1 << 1,

  // Enable all
  All = AtProperty | ColorMix,
}

export const enum Features {
  None = 0,

  // `@apply` was used
  AtApply = 1 << 0,

  // `@import` was used
  AtImport = 1 << 1,

  // `@plugin` or `@config` was used
  JsPluginCompat = 1 << 2,

  // `theme(…)` was used
  ThemeFunction = 1 << 3,

  // `@tailwind utilities` was used
  Utilities = 1 << 4,

  // `@variant` was used
  Variants = 1 << 5,
}
