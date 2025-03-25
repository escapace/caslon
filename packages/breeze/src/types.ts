import type { AstNode } from './tailwindcss/ast'

export type NodeSorting = Map<
  AstNode,
  { candidate: string; properties: { count: number; order: number[] }; variants: bigint }
>
