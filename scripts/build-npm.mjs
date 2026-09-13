/** Package the organization allowlist; plugins own all release and display metadata. */
import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const packageName = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/u

/** Validate a names-only directory without contacting npm or copying plugin versions. */
export async function buildCatalog(directory = root) {
  const catalog = JSON.parse(await readFile(join(directory, 'plugins-npm.json'), 'utf8'))
  if (catalog.schemaVersion !== 2 || !Array.isArray(catalog.packages) || !catalog.packages.length
    || catalog.packages.length > 256 || catalog.packages.some(name => typeof name !== 'string' || !packageName.test(name))
    || new Set(catalog.packages).size !== catalog.packages.length
    || Object.keys(catalog).some(key => !['schemaVersion', 'packages'].includes(key))) throw new Error('Expected schemaVersion 2 and unique npm package names only')
  return catalog
}

/** Write an inert npm package containing the names-only directory. */
export async function writePackage(directory = root) {
  const source = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
  const output = join(directory, 'dist')
  const catalog = await buildCatalog(directory)
  await mkdir(output, { recursive: true })
  const manifest = {
    name: source.name, version: source.version, description: 'Aiko DSH plugin package directory.',
    license: 'CC0-1.0', files: ['plugins.json'],
    homepage: `https://www.npmjs.com/package/${source.name}`,
    bugs: { url: 'https://github.com/aiko-dsh-plugins/dsh-plugin-catalog/issues' },
    publishConfig: { access: 'public', registry: 'https://registry.npmjs.org/' },
  }
  await writeFile(join(output, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
  await writeFile(join(output, 'plugins.json'), JSON.stringify(catalog, null, 2) + '\n')
  await writeFile(join(output, 'README.md'), '# Aiko DSH plugin directory\n\nRequires aiko-dsh-market 1.39.0 or later. This package lists npm package names only. Each plugin publishes its own version, bilingual help, screenshots, and Aiko DSH compatibility declaration. Publish this directory only when adding or removing packages.\n')
  await copyFile(join(directory, 'LICENSE'), join(output, 'LICENSE'))
  return output
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(await writePackage())
