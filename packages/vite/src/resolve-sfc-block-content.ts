import assert from 'node:assert'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { SFCScriptBlock, SFCStyleBlock, SFCTemplateBlock } from 'vue/compiler-sfc'

export const resolveSFCBlockContent = async (
  value: SFCScriptBlock | SFCStyleBlock | SFCTemplateBlock | null,
  directory: string,
) => {
  if (value === null) {
    return
  }

  const filePath = value.src === undefined ? undefined : path.resolve(directory, value.src)

  const content = filePath === undefined ? value.content : await readFile(filePath, 'utf-8')

  const extension =
    value.src === undefined
      ? value.lang === undefined
        ? { script: 'js', style: 'css', template: 'vue' }[value.type]
        : { css: 'css', js: 'js', ts: 'ts' }[value.lang]
      : path.extname(value.src).slice(1)

  if (typeof content === 'string' && content.trim().length !== 0) {
    assert(
      extension !== undefined && ['css', 'html', 'js', 'ts', 'vue'].includes(extension),
      `Unknown extension '${extension ?? value.lang}'`,
    )

    return {
      content: value.type === 'template' ? `<template>\n${content}\n</template>` : content,
      extension,
      filePath,
    }
  }

  return undefined
}
