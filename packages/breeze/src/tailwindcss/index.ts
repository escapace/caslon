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
