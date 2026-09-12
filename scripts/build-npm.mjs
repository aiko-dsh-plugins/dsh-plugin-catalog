/** Build the public npm catalog with localized help and embedded raster previews. */
import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const retired = /https?:\/\/(?:raw\.githubusercontent\.com|github\.com)\/aiko-dsh-plugins\/(?:dsh-market|dsh-office|dsh-bid-studio|dsh-ontology-kernel)(?=[/#?\s)]|$)/u

/** Compile an organization catalog; legacy URLs are inert dependency identifiers. */
export async function buildCatalog(directory = root) {
  const catalog = JSON.parse(await readFile(join(directory, 'plugins-npm.json'), 'utf8'))
  const names = new Set()
  for (const plugin of catalog.plugins) {
    if (!/^aiko-dsh-[a-z-]+$/u.test(plugin.npm) || names.has(plugin.npm)) throw new Error('Invalid or duplicate npm identity')
    names.add(plugin.npm)
    if (plugin.tarball || plugin.install !== `dsh plugin --profile web add ${plugin.npm}@${plugin.version}`) throw new Error('Catalog must select exact npm installations')
    plugin.homepage = `https://www.npmjs.com/package/${plugin.npm}`
    plugin.feedback = 'https://github.com/aiko-dsh-plugins/dsh-plugin-catalog/issues'
    plugin.readme = {}
    for (const language of ['en', 'zh']) {
      const markdown = await readFile(join(directory, 'content', plugin.npm, `${language}.md`), 'utf8')
      if (retired.test(markdown)) throw new Error(`Retired repository in ${plugin.npm} ${language} help`)
      if (!markdown.trim() || markdown.length > 256 * 1024) throw new Error('Missing or oversized readme')
      plugin.readme[language] = markdown
    }
    const images = JSON.parse(await readFile(join(directory, 'content', plugin.npm, 'images.json'), 'utf8'))
    if (!Array.isArray(images) || images.length > 6) throw new Error('Invalid screenshot list')
    plugin.screenshots = await Promise.all(images.map(async file => {
      if (!/^[a-z0-9-]+\.png$/u.test(file)) throw new Error('Screenshot must be a local PNG filename')
      const bytes = await readFile(join(directory, 'content', plugin.npm, file))
      if (!bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) || bytes.length > 3 * 1024 * 1024) throw new Error('Invalid or oversized PNG')
      return `data:image/png;base64,${bytes.toString('base64')}`
    }))
  }
  if (catalog.count !== names.size) throw new Error('Catalog count mismatch')
  const byUrl = new Map(catalog.plugins.map(plugin => [plugin.url, plugin]))
  const visited = new Set(), visiting = new Set()
  const visit = plugin => {
    if (visiting.has(plugin.url)) throw new Error('Catalog dependency cycle')
    if (visited.has(plugin.url)) return
    visiting.add(plugin.url)
    for (const url of plugin.requires ?? []) {
      if (!byUrl.has(url)) throw new Error(`Missing plugin dependency: ${url}`)
      visit(byUrl.get(url))
    }
    visiting.delete(plugin.url); visited.add(plugin.url)
  }
  for (const plugin of catalog.plugins) visit(plugin)
  return catalog
}

/** Write only distribution metadata and catalog resources into the npm staging directory. */
export async function writePackage(directory = root) {
  const source = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
  const output = join(directory, 'dist')
  const catalog = await buildCatalog(directory)
  await mkdir(output, { recursive: true })
  const manifest = {
    name: source.name, version: source.version, description: 'Aiko DSH plugin catalog, bilingual help and screenshots.',
    license: '(CC0-1.0 AND MIT)', files: ['plugins.json', 'THIRD-PARTY-NOTICES.md'],
    homepage: `https://www.npmjs.com/package/${source.name}`,
    bugs: { url: 'https://github.com/aiko-dsh-plugins/dsh-plugin-catalog/issues' },
    publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/' },
  }
  await writeFile(join(output, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
  await writeFile(join(output, 'plugins.json'), JSON.stringify(catalog) + '\n')
  await writeFile(join(output, 'README.md'), '# Aiko DSH plugin catalog\n\nPlugin versions, installation dependencies, English and Chinese help, and embedded PNG previews for Aiko DSH Market. This data package contains no executable plugins.\n')
  await copyFile(join(directory, 'LICENSE'), join(output, 'LICENSE'))
  await copyFile(join(directory, 'THIRD-PARTY-NOTICES.md'), join(output, 'THIRD-PARTY-NOTICES.md'))
  return output
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(await writePackage())
}
