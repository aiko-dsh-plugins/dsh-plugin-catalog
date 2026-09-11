/** GitHub Topic collection and static inspection of published DSH packages. */
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { list } from 'tar'

const PACKAGE_NAME = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/
const VERSION = /^\d+\.\d+\.\d+(?:-[\da-zA-Z.-]+)?(?:\+[\da-zA-Z.-]+)?$/
const REPOSITORY = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/
const epoch = Date.parse('2008-01-01T00:00:00Z') / 1000
const iso = seconds => new Date(seconds * 1000).toISOString().replace('.000Z', 'Z')
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)

/** Stop publication on rate limits and transient failures, retaining retryable work. */
export class Unavailable extends Error {}

/** Parse repository metadata by exact owner/repository identity. */
export function repositoryOf(value) {
  const input = typeof value === 'string' ? value : value?.url
  if (typeof input !== 'string') return null
  const normalized = input.replace(/^git\+/, '').replace(/\.git(?:#.*)?$/, '').replace(/\/$/, '')
  const match = /^(?:(?:https?:\/\/|ssh:\/\/git@|git:\/\/)github\.com\/|git@github\.com:|github:)?([\w.-]+\/[\w.-]+)$/.exec(normalized)
  return match?.[1].toLowerCase() ?? null
}

/** Relative package paths must stay inside the archive's package directory. */
function packagePath(value) {
  if (typeof value !== 'string') return null
  const path = value.replace(/^\.\//, '')
  return path && !path.includes('\\') && !path.startsWith('/') && !path.split('/').some(part => !part || part === '.' || part === '..') ? path : null
}

/** Detect an installable host bundle declaration without executing plugin code. */
export function bundleManifest(value) {
  return object(value) && typeof value.name === 'string' && PACKAGE_NAME.test(value.name)
    && typeof value.version === 'string' && VERSION.test(value.version)
    && object(value.dsh?.bundle) && packagePath(value.dsh.bundle.patch) !== null
}

function runtimeExport(value) {
  if (typeof value === 'string') return value
  if (!object(value)) return undefined
  return runtimeExport(value.import) ?? runtimeExport(value.node) ?? runtimeExport(value.default)
}

/** Inspect bounded tar bytes in memory, with no extraction, imports or lifecycle scripts. */
export function inspectArtifact(bytes, { name, version, repository, integrity, maxExpandedBytes = 100 * 1024 * 1024 }) {
  if (integrity) {
    const digest = integrity.split(/\s+/).find(item => item.startsWith('sha512-'))
    if (!digest || createHash('sha512').update(bytes).digest('base64') !== digest.slice(7)) throw new Error('Package integrity mismatch')
  }
  const archive = gunzipSync(bytes, { maxOutputLength: maxExpandedBytes })
  const files = new Map()
  let manifest
  const parser = list({ sync: true, strict: true, onReadEntry(entry) {
    if (entry.type !== 'File') { entry.resume(); return }
    if (!entry.path.startsWith('package/') || !packagePath(entry.path.slice(8))) throw new Error('Invalid package archive path')
    if (files.has(entry.path)) throw new Error('Duplicate package archive entry')
    files.set(entry.path, entry.size)
    if (entry.path === 'package/package.json') {
      if (entry.size > 1024 * 1024) throw new Error('Package manifest too large')
      const chunks = []
      entry.on('data', chunk => chunks.push(chunk))
      entry.on('end', () => { manifest = JSON.parse(Buffer.concat(chunks).toString('utf8')) })
    } else entry.resume()
  } })
  parser.end(archive)
  if (!bundleManifest(manifest) || manifest.name !== name || (version && manifest.version !== version)) throw new Error('Package bundle identity mismatch')
  if (repository && repositoryOf(manifest.repository) !== repository.toLowerCase()) throw new Error('Package repository mismatch')
  const patch = `package/${packagePath(manifest.dsh.bundle.patch)}`
  if (!files.get(patch)) throw new Error('Published bundle patch missing or empty')
  for (const path of [manifest.main, runtimeExport(manifest.exports?.['.'] ?? manifest.exports), runtimeExport(manifest.exports?.['./client'])]) {
    if (path && (!/\.[cm]?js$/.test(path) || !files.get(`package/${packagePath(path)}`))) throw new Error('Published JavaScript runtime entry missing')
  }
  return manifest
}

/** HTTP reads have byte/time limits; GitHub credentials are never sent to package hosts. */
export function createClient({ token, fetchImpl = fetch, searchDelayMs = 2100, timeoutMs = 20000, maxArtifactBytes = 32 * 1024 * 1024 } = {}) {
  let nextSearch = 0
  async function request(url, { bytes = false, missing = false } = {}) {
    const parsed = new URL(url)
    const headers = { accept: bytes ? 'application/octet-stream' : 'application/json', 'user-agent': 'aiko-dsh-discovery' }
    if (parsed.hostname === 'api.github.com') {
      headers.accept = 'application/vnd.github+json'
      if (token) headers.authorization = `Bearer ${token}`
      if (parsed.pathname === '/search/repositories') {
        await new Promise(resolve => setTimeout(resolve, Math.max(0, nextSearch - Date.now())))
        nextSearch = Date.now() + searchDelayMs
      }
    }
    let response
    try { response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(timeoutMs) }) }
    catch { throw new Unavailable(`Network request failed: ${parsed.hostname}`) }
    if (missing && response.status === 404) { await response.body?.cancel(); return null }
    if (!response.ok) { await response.body?.cancel(); throw new Unavailable(`HTTP ${response.status}: ${parsed.hostname}`) }
    const limit = bytes ? maxArtifactBytes : 8 * 1024 * 1024
    const chunks = []
    let length = 0
    try {
      for await (const chunk of response.body) {
        length += chunk.length
        if (length > limit) throw new Error('Response exceeds byte limit')
        chunks.push(chunk)
      }
    } catch { throw new Unavailable(`Response incomplete or too large: ${parsed.hostname}`) }
    const body = Buffer.concat(chunks)
    return bytes ? body : JSON.parse(body.toString('utf8'))
  }
  return { request }
}

/** Start a bounded scan; progress persists between scheduled invocations. */
export function newState(now = new Date()) {
  return { version: 1, repositories: {}, scan: { id: now.toISOString(), queue: [{ from: epoch, to: Math.floor(now.getTime() / 1000), page: 1 }] } }
}

/** Split oversized searches by creation time; never label GitHub's first 1,000 results as complete. */
export async function collectRepositories(client, state, { maxSearchRequests = 20, now = new Date() } = {}) {
  if (!state.scan.queue.length) state.scan = newState(now).scan
  for (let requests = 0; requests < maxSearchRequests && state.scan.queue.length; requests++) {
    const part = state.scan.queue[0]
    const query = `topic:dsh-plugin fork:true archived:false created:${iso(part.from)}..${iso(part.to)}`
    const response = await client.request(`https://api.github.com/search/repositories?${new URLSearchParams({ q: query, sort: 'updated', order: 'desc', per_page: '100', page: String(part.page) })}`)
    if (!Number.isSafeInteger(response.total_count) || !Array.isArray(response.items)) throw new Unavailable('Invalid GitHub search response')
    if (response.total_count > 1000 || response.incomplete_results) {
      if (part.from === part.to) throw new Unavailable('Search cannot be fully enumerated at one-second resolution')
      const middle = Math.floor((part.from + part.to) / 2)
      state.scan.queue.splice(0, 1, { from: middle + 1, to: part.to, page: 1 }, { from: part.from, to: middle, page: 1 })
      continue
    }
    for (const repo of response.items) {
      if (!REPOSITORY.test(repo.full_name ?? '') || typeof repo.default_branch !== 'string') throw new Unavailable('Invalid GitHub repository')
      const key = repo.full_name.toLowerCase()
      const previous = state.repositories[key]
      state.repositories[key] = { ...previous, repo, seen: state.scan.id }
    }
    if (part.page * 100 < response.total_count) {
      if (response.items.length === 0) throw new Unavailable('GitHub pagination ended early')
      part.page++
    } else state.scan.queue.shift()
  }
  if (!state.scan.queue.length) {
    for (const [key, entry] of Object.entries(state.repositories)) if (entry.seen !== state.scan.id) delete state.repositories[key]
  }
}

async function manifests(client, repo, maxPackages) {
  const prefix = `https://raw.githubusercontent.com/${repo.full_name}/${encodeURIComponent(repo.default_branch)}/`
  const root = await client.request(`${prefix}package.json`, { missing: true })
  const found = bundleManifest(root) ? [{ manifest: root, path: '' }] : []
  if (!root?.workspaces && found.length) return found
  const tree = await client.request(`https://api.github.com/repos/${repo.full_name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`, { missing: true })
  if (!tree) return found
  if (tree.truncated || !Array.isArray(tree.tree)) throw new Unavailable('Repository tree incomplete')
  const paths = tree.tree.filter(entry => entry.type === 'blob' && entry.path.endsWith('/package.json')
    && !/(?:^|\/)(?:node_modules|vendor|fixtures|tests?|examples?|\.git)(?:\/|$)/.test(entry.path))
  if (paths.length > maxPackages) throw new Unavailable('Repository exceeds package inspection budget')
  for (const { path } of paths) {
    if (!packagePath(path) || !/^[A-Za-z0-9_./-]+$/.test(path)) continue
    const manifest = await client.request(`${prefix}${path.split('/').map(encodeURIComponent).join('/')}`, { missing: true })
    if (bundleManifest(manifest)) found.push({ manifest, path: path.slice(0, -'/package.json'.length) })
  }
  return found
}

/** Verify npm and same-repository release archives; source-only entries cannot be installed. */
export async function inspectRepository(client, repo, { now = new Date(), maxPackages = 40 } = {}) {
  const candidates = await manifests(client, repo, maxPackages)
  const plugins = []
  let release
  for (const { manifest, path } of candidates) {
    const url = `https://github.com/${repo.full_name}${path ? `/tree/${encodeURIComponent(repo.default_branch)}/${path}` : ''}`
    const plugin = {
      name: manifest.name, owner: repo.full_name.split('/')[0], url, category: 'github-discovery',
      description: { en: String(manifest.description || repo.description || manifest.name) },
      stars: repo.stargazers_count ?? 0, added: now.toISOString().slice(0, 10), install: '',
      discovery: { status: 'source-only', checkedAt: now.toISOString() },
    }
    const published = await client.request(`https://registry.npmjs.org/${encodeURIComponent(manifest.name)}/latest`, { missing: true })
    if (published && bundleManifest(published) && repositoryOf(published.repository) === repo.full_name.toLowerCase()) {
      const dist = new URL(published.dist?.tarball ?? 'https://invalid/')
      if (dist.protocol === 'https:' && dist.host === 'registry.npmjs.org' && !dist.username && !dist.password
        && typeof published.dist?.integrity === 'string') {
        const bytes = await client.request(dist.href, { bytes: true })
        try {
          inspectArtifact(bytes, { name: manifest.name, version: published.version, repository: repo.full_name, integrity: published.dist.integrity })
          plugin.npm = manifest.name; plugin.version = published.version; plugin.discovery.status = 'published'
        } catch { /* An invalid archive has no verified install target. */ }
      }
    }
    if (plugin.discovery.status === 'source-only') {
      release ??= await client.request(`https://api.github.com/repos/${repo.full_name}/releases/latest`, { missing: true }) ?? { assets: [] }
      for (const asset of release.assets ?? []) {
        const archive = asset.browser_download_url
        if (typeof archive !== 'string' || !archive.startsWith(`https://github.com/${repo.full_name}/releases/download/`)
          || !archive.endsWith('.tgz') || asset.size > 32 * 1024 * 1024) continue
        const bytes = await client.request(archive, { bytes: true })
        try {
          const checked = inspectArtifact(bytes, { name: manifest.name })
          plugin.tarball = archive; plugin.version = checked.version; plugin.discovery.status = 'published'
          break
        } catch { /* Release assets for other packages do not identify this plugin. */ }
      }
    }
    if (plugin.discovery.status === 'published') plugin.install = `dsh plugin --profile web add ${plugin.name}@${plugin.tarball ?? plugin.version}`
    plugins.push(plugin)
  }
  return plugins
}

/** Reinspect changed/old repositories within a per-run budget; retain failures for retry. */
export async function inspectPending(client, state, { maxRepositories = 60, recheckHours = 168, now = new Date(), ...options } = {}) {
  const cutoff = now.getTime() - recheckHours * 3600000
  const pending = Object.values(state.repositories).filter(entry => !entry.checkedAt || Date.parse(entry.checkedAt) < cutoff || entry.checkedPush !== entry.repo.pushed_at)
    .sort((a, b) => (a.attemptedAt ?? '').localeCompare(b.attemptedAt ?? ''))
  const failures = []
  for (const entry of pending.slice(0, maxRepositories)) {
    entry.attemptedAt = now.toISOString()
    try {
      entry.plugins = await inspectRepository(client, entry.repo, { now, ...options })
      entry.checkedAt = now.toISOString(); entry.checkedPush = entry.repo.pushed_at
      delete entry.failure
    } catch (error) {
      entry.failure = error.message
      failures.push({ repository: entry.repo.full_name, error: error.message })
      if (/HTTP (403|429)/.test(error.message)) break
    }
  }
  return failures
}

/** Publish progress honestly; failed or changed inspections do not reuse installable entries. */
export function buildFeed(state, now = new Date()) {
  const entries = Object.values(state.repositories)
  const checked = entries.filter(entry => entry.checkedAt && !entry.failure && entry.checkedPush === entry.repo.pushed_at)
  const plugins = checked.flatMap(entry => entry.plugins).sort((a, b) => a.url.localeCompare(b.url))
  return {
    updated: now.toISOString(), count: plugins.length,
    categories: { 'github-discovery': { en: 'GitHub community', zh: 'GitHub 社区' } }, plugins,
    discovery: { version: 1, topic: 'dsh-plugin', total: entries.length, checked: checked.length, complete: !state.scan.queue.length && checked.length === entries.length },
  }
}
