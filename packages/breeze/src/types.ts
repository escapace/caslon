import type { Options } from '.'
import type { AstNode } from './tailwindcss/ast'
import type { DesignSystem } from './tailwindcss/design-system'

export type NodeSorting = Map<
  AstNode,
  { candidate: string; properties: { count: number; order: number[] }; variants: bigint }
>

export type PluginOptions = { designSystem: DesignSystem } & Required<
  Pick<Options, 'error' | 'warning'>
>
