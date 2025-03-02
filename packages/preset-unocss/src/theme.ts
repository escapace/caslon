// TODO: spacing

// TODO
// colors
// font
// fontWeight
// leading
// text,
// tracking,

import {
  animation,
  aria,
  blur,
  breakpoint,
  container,
  dropShadow,
  ease,
  insetShadow,
  media,
  perspective,
  property,
  radius,
  shadow,
  spacing,
  supports,
  textShadow,
  textStrokeWidth,
  verticalBreakpoint,
} from '@unocss/preset-wind4/theme'

const defaults = {
  transition: {
    duration: '150ms',
  },
}

// export interface Colors {
//   [key: string]: string | Colors
// }

export interface ThemeAnimation {
  category?: Record<string, string>
  counts?: Record<string, number | string>
  durations?: Record<string, string>
  keyframes?: Record<string, string>
  properties?: Record<string, object>
  timingFns?: Record<string, string>
}

export interface Theme {
  // colors?: any
  // font?: Record<string, string>
  // fontWeight?: Record<string, string>
  // leading?: Record<string, string>
  // text: Record<string, { fontSize?: string, letterSpacing?: string; lineHeight?: string, }>
  // tracking?: Record<string, string>

  animate?: Record<string, string>
  blur?: Record<string, string>
  breakpoint?: Record<string, string>
  container?: Record<string, string>
  defaults?: Record<string, Record<string, string>>
  dropShadow?: Record<string, string | string[]>
  ease?: Record<string, string>
  insetShadow?: Record<string, string | string[]>
  perspective?: Record<string, string>
  property?: Record<string, string>
  radius?: Record<string, string>
  shadow?: Record<string, string | string[]>
  spacing?: Record<string, string>
  textShadow?: Record<string, string | string[]>
  textStrokeWidth?: Record<string, string>
  verticalBreakpoint?: Record<string, string>

  animation?: ThemeAnimation
  duration?: Record<string, string>

  // container
  containers?: {
    center?: boolean
    maxWidth?: Record<string, string>
    padding?: string | Record<string, string>
  }

  // for variant
  aria?: Record<string, string>
  data?: Record<string, string>
  media?: Record<string, string>
  supports?: Record<string, string>
}

export const theme = {
  // for rules
  animation,
  blur,
  breakpoint,
  defaults,
  dropShadow,
  ease,
  insetShadow,
  perspective,
  property,
  radius,
  shadow,
  spacing,
  textShadow,
  textStrokeWidth,
  verticalBreakpoint,

  // for rules & variants
  container,

  // for variant
  aria,
  media,
  supports,
} satisfies Theme
