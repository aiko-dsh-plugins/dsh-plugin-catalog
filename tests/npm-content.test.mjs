/** Packaging checks for the independently installable npm catalog. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cp, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildCatalog } from '../scripts/build-npm.mjs'

const root = new URL('../', import.meta.url)

test('ships bilingual help, raster previews and exact dependency-first npm targets', async () => {
  const catalog = await buildCatalog()
  assert.equal(catalog.plugins.length, 4)
  for (const plugin of catalog.plugins) {
    assert.ok(plugin.readme.en.length > 100 && plugin.readme.zh.length > 100)
    assert.equal(plugin.homepage, `https://www.npmjs.com/package/${plugin.npm}`)
    assert.equal(plugin.tarball, undefined)
  }
  assert.ok(catalog.plugins.find(p => p.npm === 'aiko-dsh-market').screenshots.every(image => image.startsWith('data:image/png;base64,')))
  const bid = catalog.plugins.find(p => p.npm === 'aiko-dsh-bid-studio')
  assert.deepEqual(bid.requires, [catalog.plugins.find(p => p.npm === 'aiko-dsh-ontology-kernel').url])
})

for (const invalid of ['help', 'image', 'dependency', 'installation']) {
  test(`rejects invalid ${invalid} before packaging`, async t => {
    const directory = await mkdtemp(join(tmpdir(), 'aiko-catalog-'))
    t.after(() => rm(directory, { recursive: true, force: true }))
    await cp(new URL('content/', root), join(directory, 'content'), { recursive: true })
    await cp(new URL('plugins-npm.json', root), join(directory, 'plugins-npm.json'))
    const catalog = JSON.parse(await readFile(join(directory, 'plugins-npm.json'), 'utf8'))
    const name = catalog.plugins[0].npm
    if (invalid === 'help') await writeFile(join(directory, 'content', name, 'en.md'), '[old](https://github.com/aiko-dsh-plugins/dsh-office)')
    if (invalid === 'image') await writeFile(join(directory, 'content', name, 'images.json'), '["../secret.png"]')
    if (invalid === 'dependency') catalog.plugins[0].requires = [catalog.plugins[0].url]
    if (invalid === 'installation') catalog.plugins[0].install = 'github:aiko/private-source'
    await writeFile(join(directory, 'plugins-npm.json'), JSON.stringify(catalog))
    await assert.rejects(buildCatalog(directory))
  })
}
