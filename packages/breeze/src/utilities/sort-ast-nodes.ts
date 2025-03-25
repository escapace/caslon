/* eslint-disable typescript/strict-boolean-expressions */
/* eslint-disable typescript/no-non-null-assertion */
import type { AstNode } from '../tailwindcss/ast'
import { compare } from '../tailwindcss/utils/compare'
import type { NodeSorting } from '../types'

export const sortAstNodes = (astNodes: AstNode[], nodeSorting: NodeSorting) =>
  astNodes.sort((a, z) => {
    // SAFETY: At this point it is safe to use TypeScript's non-null assertion
    // operator because if the ast nodes didn't exist, we introduced a bug
    // above, but there is no need to re-check just to be sure. If this relied
    // on pure user input, then we would need to check for its existence.
    const aSorting = nodeSorting.get(a)!
    const zSorting = nodeSorting.get(z)!

    // Sort by variant order first
    if (aSorting.variants - zSorting.variants !== 0n) {
      return Number(aSorting.variants - zSorting.variants)
    }

    // Find the first property that is different between the two rules
    let offset = 0
    while (
      offset < aSorting.properties.order.length &&
      offset < zSorting.properties.order.length &&
      aSorting.properties.order[offset] === zSorting.properties.order[offset]
    ) {
      offset += 1
    }

    return (
      // Sort by lowest property index first
      (aSorting.properties.order[offset] ?? Infinity) -
        (zSorting.properties.order[offset] ?? Infinity) ||
      // Sort by most properties first, then by least properties
      zSorting.properties.count - aSorting.properties.count ||
      // Sort alphabetically
      compare(aSorting.candidate, zSorting.candidate)
    )
  })
