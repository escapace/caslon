import assert from 'node:assert'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as zx from 'zx'
import { $ } from 'zx'

const TAILWINDS_REF = 'main'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pathDirectoryTailwinds = path.resolve(__dirname, '..', 'vendor/tailwindcss')
const pathDirectoryPatches = path.join(__dirname, 'patches')

for (const directory of [pathDirectoryTailwinds, pathDirectoryPatches]) {
  assert(zx.fs.statSync(directory).isDirectory())
}

process.chdir(pathDirectoryTailwinds)
$.cwd = pathDirectoryTailwinds
$.stdio = 'inherit'

await $`git fetch`
await $`git reset --hard origin/${TAILWINDS_REF}`
await $`git clean -f -d x`

const collator = Intl.Collator('en', { numeric: true })
const patches = (
  await zx.glob(`*.patch`, { absolute: true, cwd: pathDirectoryPatches, onlyFiles: true })
).sort((x, y) => collator.compare(x, y))

for (const patch of patches) {
  await $`git apply --check ${patch}`
}

for (const patch of patches) {
  await $`git apply ${patch}`
}
