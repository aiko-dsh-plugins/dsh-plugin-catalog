/** The directory's source and published data contain package names only. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildCatalog } from '../scripts/build-npm.mjs'

test('lists the four plugins without copying their versions', async () => {
  const catalog = await buildCatalog()
  assert.deepEqual(Object.keys(catalog).sort(), ['packages', 'schemaVersion'])
  assert.equal(catalog.packages.length, 4)
  assert.ok(catalog.packages.includes('aiko-dsh-office'))
})

for (const invalid of [[], ['aiko-dsh-office@0.3.0'], ['https://example.com/package'], ['duplicate','duplicate'], [42]]) {
  test(`rejects invalid package list ${JSON.stringify(invalid)}`, async t => {
    const directory = await mkdtemp(join(tmpdir(), 'aiko-catalog-'))
    t.after(() => rm(directory, { recursive: true, force: true }))
    await writeFile(join(directory, 'plugins-npm.json'), JSON.stringify({schemaVersion:2, packages:invalid}))
    await assert.rejects(buildCatalog(directory))
  })
}
